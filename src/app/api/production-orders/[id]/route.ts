import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const updateProductionOrderSchema = z.object({
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "PROBLEM"]).optional(),
    problemNote: z.string().optional(),
    extraRequestQty: z.number().min(0).optional(),
    stockDeducted: z.boolean().optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const productionOrder = await db.productionOrder.findUnique({
            where: { id },
            include: {
                purchaseOrder: {
                    include: {
                        supplier: true,
                        user: { select: { id: true, name: true, email: true } },
                        items: {
                            include: {
                                product: true,
                            },
                        },
                    },
                },
            },
        });

        if (!productionOrder) {
            return NextResponse.json({ error: "Production order not found" }, { status: 404 });
        }

        return NextResponse.json(productionOrder);
    } catch (error) {
        console.error("[PRODUCTION_GET_ID]", error);
        return NextResponse.json({ error: "Failed to fetch production order" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validated = updateProductionOrderSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validated.error.flatten() },
                { status: 400 }
            );
        }

        const updateData: any = { ...validated.data };

        if (validated.data.status === "IN_PROGRESS" && !updateData.startedAt) {
            updateData.startedAt = new Date();
        }

        if (validated.data.status === "COMPLETED") {
            if (!updateData.completedAt) updateData.completedAt = new Date();

            const currentOrder = await db.productionOrder.findUnique({
                where: { id },
                select: { stockDeducted: true, quantity: true }
            });

            if (currentOrder && !currentOrder.stockDeducted) {
                const qty = Number(currentOrder.quantity || 1);
                const scalingFactor = qty / 78;

                const ingredients = [
                    { name: "แป้ง", standardAmount: 22.5 },
                    { name: "เกลือ", standardAmount: 0.5 },
                    { name: "สารกันบูด", standardAmount: 0.3 },
                    { name: "น้ำมัน", standardAmount: 1.5 },
                ];

                const transactions: any[] = [];
                const foundIngredients: string[] = [];

                for (const ing of ingredients) {
                    const item = await db.stockItem.findFirst({
                        where: { name: { contains: ing.name, mode: "insensitive" } }
                    });

                    if (item) {
                        const usageAmount = ing.standardAmount * scalingFactor;
                        transactions.push(
                            db.stockUsage.create({
                                data: {
                                    stockItemId: item.id,
                                    quantity: new Prisma.Decimal(usageAmount),
                                    date: new Date(),
                                    checkerName: "ระบบ (อัตโนมัติ)",
                                }
                            })
                        );
                        transactions.push(
                            db.stockItem.update({
                                where: { id: item.id },
                                data: {
                                    currentQty: { decrement: new Prisma.Decimal(usageAmount) }
                                }
                            })
                        );
                        foundIngredients.push(ing.name);
                    }
                }

                if (transactions.length > 0) {
                    await db.$transaction([
                        ...transactions,
                        db.productionOrder.update({
                            where: { id },
                            data: { stockDeducted: true }
                        })
                    ]);
                    updateData.stockDeducted = true;
                }
            }
        }

        const productionOrder = await db.productionOrder.update({
            where: { id },
            data: updateData,
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

        return NextResponse.json(productionOrder);
    } catch (error) {
        console.error("[PRODUCTION_PUT]", error);
        const message = error instanceof Error ? error.message : "Failed to update production order";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await db.productionOrder.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Production order deleted successfully" });
    } catch (error) {
        console.error("[PRODUCTION_DELETE]", error);
        return NextResponse.json({ error: "Failed to delete production order" }, { status: 500 });
    }
}
