import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { PoStatus } from "@prisma/client";

const updatePoSchema = z.object({
    status: z.nativeEnum(PoStatus).optional(),
    deliveryDate: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
    notes: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

// GET /api/purchase-orders/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        const po = await db.purchaseOrder.findUnique({
            where: { id },
            include: {
                supplier: true,
                user: { select: { id: true, name: true, email: true, role: true } },
                items: {
                    include: {
                        product: true,
                    },
                    orderBy: { id: "asc" },
                },
            },
        });

        if (!po) {
            return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
        }

        return NextResponse.json(po);
    } catch (error) {
        console.error("[PO_GET_ID]", error);
        return NextResponse.json({ error: "Failed to fetch purchase order" }, { status: 500 });
    }
}

// PATCH /api/purchase-orders/[id] — update status or delivery date
export async function PATCH(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validated = updatePoSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validated.error.flatten() },
                { status: 400 }
            );
        }

        // Enforce valid status transitions
        const current = await db.purchaseOrder.findUnique({ where: { id }, select: { status: true } });
        if (!current) {
            return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
        }

        if (validated.data.status) {
            const allowedTransitions: Record<PoStatus, PoStatus[]> = {
                DRAFT: ["APPROVED", "CANCELLED"],
                APPROVED: ["SENT", "CANCELLED"],
                SENT: ["CANCELLED"],
                CANCELLED: [],
            };

            const allowed = allowedTransitions[current.status];
            if (!allowed.includes(validated.data.status)) {
                return NextResponse.json(
                    {
                        error: `Cannot transition from ${current.status} to ${validated.data.status}`,
                    },
                    { status: 422 }
                );
            }
        }

        const po = await db.purchaseOrder.update({
            where: { id },
            data: {
                ...(validated.data.status && { status: validated.data.status }),
                ...(validated.data.deliveryDate && { deliveryDate: new Date(validated.data.deliveryDate) }),
                ...(validated.data.notes !== undefined && { notes: validated.data.notes }),
            },
            include: {
                supplier: { select: { id: true, companyName: true } },
                user: { select: { id: true, name: true } },
                items: { include: { product: true } },
            },
        });

        return NextResponse.json(po);
    } catch (error) {
        console.error("[PO_PATCH]", error);
        return NextResponse.json({ error: "Failed to update purchase order" }, { status: 500 });
    }
}

// DELETE /api/purchase-orders/[id] — only DRAFT POs can be deleted
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        const po = await db.purchaseOrder.findUnique({ where: { id }, select: { status: true } });
        if (!po) {
            return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
        }

        // Allow deleting POs of any status as per user request
        // if (po.status !== "DRAFT") {
        //     return NextResponse.json(
        //         { error: "Only DRAFT purchase orders can be deleted" },
        //         { status: 422 }
        //     );
        // }

        // PoItems are cascade-deleted via schema onDelete: Cascade
        await db.purchaseOrder.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[PO_DELETE]", error);
        return NextResponse.json({ error: "Failed to delete purchase order" }, { status: 500 });
    }
}

// ── PUT Logic for Full Update ──
const VAT_RATE = 0.07;

const poItemSchema = z
    .object({
        productId: z.string().optional(),
        itemName: z.string().optional(),
        itemType: z.enum(["STANDARD", "MANUAL", "OTHER"]).default("STANDARD"),
        quantity: z.number().positive("Quantity must be positive"),
        unitPrice: z.number().min(0, "Unit price must be non-negative"),
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

const updateFullPoSchema = z.object({
    supplierId: z.string().min(1, "Supplier is required"),
    issueDate: z.string().datetime({ offset: true }).or(z.string().date()),
    deliveryDate: z.string().datetime({ offset: true }).or(z.string().date()),
    shippingCost: z.number().min(0).default(0),
    items: z.array(poItemSchema).min(1, "At least one item is required"),
});

// PUT /api/purchase-orders/[id] — Full update of PO and Items
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validated = updateFullPoSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validated.error.flatten() },
                { status: 400 }
            );
        }

        const { supplierId, issueDate, deliveryDate, shippingCost, items } = validated.data;

        // Check if PO exists
        const existingPo = await db.purchaseOrder.findUnique({ where: { id } });
        if (!existingPo) {
            return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
        }

        // Calculate totals
        const itemsWithTotals = items.map((item) => ({
            ...item,
            totalPrice: Number((item.quantity * item.unitPrice).toFixed(8)),
        }));

        const subtotal = Number(
            itemsWithTotals.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(8)
        );
        // Using existing discountAmount from DB if we don't allow editing it here? 
        // For now assume discount is 0 or preserving? Schema didn't include discountAmount in the form logic much.
        // Let's assume 0 for now or fetch existing. The form doesn't seem to have discount field.
        const discountAmount = Number(existingPo.discountAmount || 0);

        const vatAmount = Number(((subtotal - discountAmount) * VAT_RATE).toFixed(8));
        const grandTotal = Number((subtotal - discountAmount + vatAmount + shippingCost).toFixed(8));

        const updatedPo = await db.$transaction(async (tx) => {
            // 1. Update PO details
            const po = await tx.purchaseOrder.update({
                where: { id },
                data: {
                    supplierId,
                    issueDate: new Date(issueDate),
                    deliveryDate: new Date(deliveryDate),
                    shippingCost,
                    subtotal,
                    vatAmount,
                    grandTotal,
                    // notes? if needed
                },
            });

            // 2. Delete existing items
            await tx.poItem.deleteMany({
                where: { poId: id },
            });

            // 3. Create new items
            await tx.poItem.createMany({
                data: itemsWithTotals.map((item) => ({
                    poId: id,
                    productId: item.productId,
                    itemName: item.itemName,
                    itemType: item.itemType,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice,
                })),
            });

            return po;
        }, {
            maxWait: 5000,
            timeout: 15000,
        });

        return NextResponse.json(updatedPo);

    } catch (error) {
        console.error("[PO_PUT]", error);
        return NextResponse.json({ error: "Failed to update purchase order" }, { status: 500 });
    }
}
