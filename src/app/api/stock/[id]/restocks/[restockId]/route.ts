import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const restockUpdateSchema = z.object({
    receiptNumber: z.string().min(1, "เลขใบเสร็จจำเป็นต้องระบุ"),
    quantity: z.number().positive("จำนวนต้องมากกว่า 0"),
    date: z.string().datetime(),
});

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; restockId: string }> }
) {
    try {
        const { id, restockId } = await params;
        const body = await request.json();
        const validated = restockUpdateSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validated.error.flatten() },
                { status: 400 }
            );
        }

        const oldRestock = await db.stockRestock.findUnique({
            where: { id: restockId },
        });

        if (!oldRestock || oldRestock.stockItemId !== id) {
            return NextResponse.json({ error: "Restock not found" }, { status: 404 });
        }

        const updatedRestock = await db.$transaction(async (tx) => {
            const qtyDiff = new Prisma.Decimal(validated.data.quantity).minus(oldRestock.quantity);

            await tx.stockItem.update({
                where: { id },
                data: {
                    currentQty: {
                        increment: qtyDiff,
                    },
                },
            });

            return await tx.stockRestock.update({
                where: { id: restockId },
                data: {
                    receiptNumber: validated.data.receiptNumber,
                    quantity: new Prisma.Decimal(validated.data.quantity),
                    date: new Date(validated.data.date),
                },
            });
        });

        return NextResponse.json(updatedRestock);
    } catch (error) {
        console.error("[RESTOCK_PUT]", error);
        return NextResponse.json({ error: "Failed to update restock" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; restockId: string }> }
) {
    try {
        const { id, restockId } = await params;
        const restock = await db.stockRestock.findUnique({
            where: { id: restockId },
        });

        if (!restock || restock.stockItemId !== id) {
            return NextResponse.json({ error: "Restock not found" }, { status: 404 });
        }

        await db.$transaction(async (tx) => {
            await tx.stockItem.update({
                where: { id },
                data: {
                    currentQty: {
                        decrement: restock.quantity,
                    },
                },
            });

            await tx.stockRestock.delete({
                where: { id: restockId },
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[RESTOCK_DELETE]", error);
        return NextResponse.json({ error: "Failed to delete restock" }, { status: 500 });
    }
}
