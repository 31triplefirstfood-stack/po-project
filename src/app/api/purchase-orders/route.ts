import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generatePoNumber } from "@/lib/po-number";
import { z } from "zod";
import { PoStatus } from "@prisma/client";

const VAT_RATE = 0.07;

// ── Updated Schema ────────────────────────────────────────────────────────
const poItemSchema = z
    .object({
        productId: z.string().optional(),
        itemName: z.string().optional(),
        itemType: z.enum(["STANDARD", "MANUAL", "OTHER"]).default("STANDARD"),
        quantity: z.number().positive("Quantity must be positive"),
        unitPrice: z.number().min(0, "Unit price must be non-negative"), // Allow 0 for some cases? Changed to min(0)
    })
    .refine((data) => {
        if (data.itemType === "STANDARD" && !data.productId) {
            return false;
        }
        return true;
    }, { message: "Product ID is required for STANDARD items", path: ["productId"] })
    .refine((data) => {
        if ((data.itemType === "MANUAL" || data.itemType === "OTHER") && !data.productId && !data.itemName) {
            return false;
        }
        return true;
    }, { message: "Product ID or Item Name is required for MANUAL/OTHER items", path: ["itemName"] });

const createPoSchema = z.object({
    userId: z.string().optional(), // Made optional to allow server-side default
    supplierId: z.string().min(1, "Supplier is required"),
    issueDate: z.string().datetime({ offset: true }).or(z.string().date()),
    paymentDate: z.string().datetime({ offset: true }).or(z.string().date()).nullable().optional(),
    deliveryDate: z.string().datetime({ offset: true }).or(z.string().date()),
    discountAmount: z.number().min(0).default(0),
    notes: z.string().optional(),
    items: z.array(poItemSchema).min(1, "At least one item is required"),
});

// GET /api/purchase-orders — list all POs with optional filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") as PoStatus | null;
        const supplierId = searchParams.get("supplierId");
        const search = searchParams.get("search") ?? "";

        const whereClause: any = {
            ...(status && { status }),
            ...(supplierId && { supplierId }),
            AND: [
                {
                    OR: [
                        { productionOrder: null },
                        { productionOrder: { status: "COMPLETED" } }
                    ]
                }
            ]
        };

        if (search) {
            whereClause.AND.push({
                OR: [
                    { poNumber: { contains: search, mode: "insensitive" } },
                    { supplier: { companyName: { contains: search, mode: "insensitive" } } },
                ]
            });
        }

        const purchaseOrders = await db.purchaseOrder.findMany({
            where: whereClause,
            include: {
                supplier: { select: { id: true, companyName: true } },
                user: { select: { id: true, name: true } },
                items: {
                    include: {
                        product: { select: { id: true, name: true, sku: true, unit: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(purchaseOrders);
    } catch (error) {
        console.error("[PO_GET]", error);
        return NextResponse.json({ error: "Failed to fetch purchase orders" }, { status: 500 });
    }
}

// POST /api/purchase-orders — create a new PO
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validated = createPoSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validated.error.flatten() },
                { status: 400 }
            );
        }

        const { supplierId, issueDate, paymentDate, deliveryDate, discountAmount, notes, items } =
            validated.data;
        let { userId } = validated.data;

        // If no userId provided, default to the first user
        if (!userId) {
            const defaultUser = await db.user.findFirst();
            if (!defaultUser) {
                return NextResponse.json({ error: "No users found in database" }, { status: 500 });
            }
            userId = defaultUser.id;
        }

        // ── Calculate totals ────────────────────────────────────────────────────
        let itemsWithTotals = items.map((item) => ({
            ...item,
            totalPrice: Number((item.quantity * item.unitPrice).toFixed(8)),
        }));

        const subtotal = Number(
            itemsWithTotals.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(8)
        );
        const vatAmount = Number(((subtotal - discountAmount) * VAT_RATE).toFixed(8));
        const grandTotal = Number((subtotal - discountAmount + vatAmount).toFixed(8));

        // ── Create PO inside a transaction with PO number lock ──────────────────
        const purchaseOrder = await db.$transaction(async (tx) => {
            // Generate PO number safely inside the transaction
            const poNumber = await generatePoNumber(tx);

            // Verify supplier and user exist
            const [supplier, user] = await Promise.all([
                tx.supplier.findUnique({ where: { id: supplierId } }),
                tx.user.findUnique({ where: { id: userId } }),
            ]);

            if (!supplier) throw new Error("Supplier not found");
            if (!user) throw new Error("User not found");

            // Verify all PROVIDED product IDs exist
            const productIds = items
                .filter((i) => i.productId)
                .map((i) => i.productId as string);

            if (productIds.length > 0) {
                const products = await tx.product.findMany({
                    where: { id: { in: productIds } },
                    select: { id: true, name: true, unit: true },
                });
                const foundIds = new Set(products.map(p => p.id));
                const missingIds = productIds.filter(id => !foundIds.has(id));

                if (missingIds.length > 0) {
                    throw new Error(`Products not found: ${missingIds.join(", ")}`);
                }

                // Snapshot ชื่อสินค้าลงใน itemName เพื่อใช้งานหากสินค้าถูกลบในอนาคต
                const productMap = new Map(products.map(p => [p.id, p]));
                itemsWithTotals = itemsWithTotals.map((item) => {
                    if (item.productId && !item.itemName) {
                        const prod = productMap.get(item.productId);
                        if (prod) return { ...item, itemName: prod.name };
                    }
                    return item;
                });
            }

            return tx.purchaseOrder.create({
                data: {
                    poNumber,
                    userId,
                    supplierId,
                    issueDate: new Date(issueDate),
                    paymentDate: paymentDate ? new Date(paymentDate) : null,
                    deliveryDate: new Date(deliveryDate),
                    subtotal,
                    discountAmount,
                    vatAmount,
                    grandTotal,

                    notes,
                    status: "DRAFT",
                    items: {
                        create: itemsWithTotals.map((item) => ({
                            productId: item.productId,
                            itemName: item.itemName,
                            itemType: item.itemType,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            totalPrice: item.totalPrice,
                        })),
                    },
                    productionOrder: {
                        create: {
                            status: "PENDING"
                        }
                    }
                },
                include: {
                    supplier: true,
                    user: { select: { id: true, name: true, email: true } },
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });
        }, {
            maxWait: 5000, // default is 2000
            timeout: 15000, // default is 5000
        });

        return NextResponse.json(purchaseOrder, { status: 201 });
    } catch (error) {
        console.error("[PO_POST]", error);
        const message = error instanceof Error ? error.message : "Failed to create purchase order";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
