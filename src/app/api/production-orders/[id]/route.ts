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

        if (validated.data.status === "COMPLETED" && !updateData.completedAt) {
            updateData.completedAt = new Date();
        }

        if (validated.data.status === "IN_PROGRESS" || validated.data.status === "COMPLETED") {
            const currentOrder = await db.productionOrder.findUnique({
                where: { id },
                include: {
                    purchaseOrder: {
                        include: {
                            items: {
                                include: {
                                    product: true,
                                }
                            }
                        }
                    }
                }
            });

            if (currentOrder && !currentOrder.stockDeducted) {
                let qty = 1;
                const orderItemNames: string[] = [];

                if (currentOrder.purchaseOrder) {
                    qty = currentOrder.purchaseOrder.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
                    currentOrder.purchaseOrder.items.forEach(item => {
                        orderItemNames.push((item.product?.name || item.itemName || "").toLowerCase());
                    });
                } else {
                    qty = Number(currentOrder.quantity || 1);
                    orderItemNames.push((currentOrder.productName || "").toLowerCase());
                }

                const hasYellow = orderItemNames.some(name => name.includes("บะหมี่ลวกเส้น") || name.includes("ข้าวซอยลวกเส้นสด"));
                const hasGreen = orderItemNames.some(name => name.includes("หยกเส้นลวก"));

                // Fetch recipe items dynamically
                const stockItems = await db.stockItem.findMany({
                    where: {
                        recipeQty: { gt: 0 }
                    }
                });

                const transactions: any[] = [];

                for (const item of stockItems) {
                    const name = item.name.toLowerCase();
                    if (name.includes("สีเหลือง") && !hasYellow) continue;
                    if (name.includes("สีเขียว") && !hasGreen) continue;

                    const usageAmount = Number(item.recipeQty) * qty;

                    transactions.push(
                        db.stockUsage.create({
                            data: {
                                stockItemId: item.id,
                                quantity: new Prisma.Decimal(usageAmount),
                                date: new Date(),
                                checkerName: "ระบบ (อัตโนมัติ)",
                                note: `ตัดสต็อกอัตโนมัติสำหรับการผลิต ${currentOrder.id}`
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
        
        const productionOrder = await db.productionOrder.findUnique({
            where: { id },
            select: { purchaseOrderId: true }
        });

        if (productionOrder?.purchaseOrderId) {
            // Deleting the PurchaseOrder will cascade and delete the ProductionOrder
            await db.purchaseOrder.delete({
                where: { id: productionOrder.purchaseOrderId }
            });
        } else {
            await db.productionOrder.delete({
                where: { id },
            });
        }

        return NextResponse.json({ message: "Production order deleted successfully" });
    } catch (error) {
        console.error("[PRODUCTION_DELETE]", error);
        return NextResponse.json({ error: "Failed to delete production order" }, { status: 500 });
    }
}
