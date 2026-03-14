import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateProductionNumber } from "@/lib/production-number";
import { z } from "zod";
import { ProductionStatus } from "@prisma/client";

const createProductionOrderSchema = z.object({
    purchaseOrderId: z.string().min(1, "Purchase Order ID is required"),
    extraRequestQty: z.number().min(0).optional(),
    problemNote: z.string().optional(),
});

const updateProductionOrderSchema = z.object({
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "PROBLEM"]).optional(),
    problemNote: z.string().optional(),
    extraRequestQty: z.number().min(0).optional(),
    stockDeducted: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") as ProductionStatus | null;
        const search = searchParams.get("search") ?? "";

        const productionOrders = await db.productionOrder.findMany({
            where: {
                ...(status && { status }),
                ...(search && {
                    OR: [
                        { id: { contains: search, mode: "insensitive" } },
                        { purchaseOrder: { poNumber: { contains: search, mode: "insensitive" } } },
                        { purchaseOrder: { supplier: { companyName: { contains: search, mode: "insensitive" } } } },
                    ],
                }),
            },
            include: {
                purchaseOrder: {
                    include: {
                        supplier: { select: { id: true, companyName: true } },
                        user: { select: { id: true, name: true } },
                        items: {
                            include: {
                                product: { select: { id: true, name: true, sku: true, unit: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(productionOrders);
    } catch (error) {
        console.error("[PRODUCTION_GET]", error);
        return NextResponse.json({ error: "Failed to fetch production orders" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validated = createProductionOrderSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validated.error.flatten() },
                { status: 400 }
            );
        }

        const { purchaseOrderId, extraRequestQty, problemNote } = validated.data;

        const productionOrder = await db.$transaction(async (tx) => {
            const purchaseOrder = await tx.purchaseOrder.findUnique({
                where: { id: purchaseOrderId },
                include: {
                    productionOrder: true,
                },
            });

            if (!purchaseOrder) {
                throw new Error("Purchase Order not found");
            }

            if (purchaseOrder.productionOrder) {
                throw new Error("Production Order already exists for this Purchase Order");
            }

            const productionNumber = await generateProductionNumber(tx);

            return tx.productionOrder.create({
                data: {
                    id: productionNumber,
                    purchaseOrderId,
                    status: "PENDING",
                    extraRequestQty,
                    problemNote,
                    stockDeducted: false,
                },
                include: {
                    purchaseOrder: {
                        include: {
                            supplier: true,
                            user: { select: { id: true, name: true } },
                            items: {
                                include: {
                                    product: true,
                                },
                            },
                        },
                    },
                },
            });
        }, {
            maxWait: 5000,
            timeout: 15000,
        });

        return NextResponse.json(productionOrder, { status: 201 });
    } catch (error) {
        console.error("[PRODUCTION_POST]", error);
        const message = error instanceof Error ? error.message : "Failed to create production order";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
