import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const restockSchema = z.object({
    receiptNumber: z.string().min(1, "เลขใบเสร็จจำเป็นต้องระบุ"),
    quantity: z.number().positive("จำนวนต้องมากกว่า 0"),
    date: z.string().datetime(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const restocks = await db.stockRestock.findMany({
            where: { stockItemId: id },
            orderBy: { date: "desc" },
            include: {
                stockItem: {
                    select: {
                        name: true,
                        unit: true,
                        currentQty: true,
                    },
                },
            },
        });

        return NextResponse.json(restocks);
    } catch (error) {
        console.error("[RESTOCKS_GET]", error);
        return NextResponse.json({ error: "Failed to fetch restocks" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validated = restockSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validated.error.flatten() },
                { status: 400 }
            );
        }

        const stockItem = await db.stockItem.findUnique({
            where: { id },
        });

        if (!stockItem) {
            return NextResponse.json({ error: "Stock item not found" }, { status: 404 });
        }

        const restock = await db.$transaction(async (tx) => {
            const newRestock = await tx.stockRestock.create({
                data: {
                    stockItemId: id,
                    receiptNumber: validated.data.receiptNumber,
                    quantity: new Prisma.Decimal(validated.data.quantity),
                    date: new Date(validated.data.date),
                },
            });

            await tx.stockItem.update({
                where: { id },
                data: {
                    currentQty: {
                        increment: new Prisma.Decimal(validated.data.quantity),
                    },
                },
            });

            return newRestock;
        });

        return NextResponse.json(restock, { status: 201 });
    } catch (error) {
        console.error("[RESTOCKS_POST]", error);
        return NextResponse.json({ error: "Failed to create restock" }, { status: 500 });
    }
}
