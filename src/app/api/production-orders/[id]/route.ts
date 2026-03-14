import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

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
