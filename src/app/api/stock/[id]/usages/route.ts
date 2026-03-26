import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const usageSchema = z.object({
    quantity: z.number().positive("จำนวนต้องมากกว่า 0"),
    date: z.string().datetime(),
    checkerName: z.string().optional(),
    note: z.string().optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const usages = await db.stockUsage.findMany({
            where: { stockItemId: id },
            orderBy: { date: "desc" },
            include: {
                stockItem: {
                    select: {
                        name: true,
                        unit: true,
                        imageUrl: true,
                    },
                },
            },
        });

        return NextResponse.json(usages);
    } catch (error) {
        console.error("[USAGES_GET]", error);
        return NextResponse.json({ error: "Failed to fetch usages" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validated = usageSchema.safeParse(body);

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

        if (stockItem.currentQty.lessThan(new Prisma.Decimal(validated.data.quantity))) {
            return NextResponse.json(
                { error: "จำนวนคงเหลือไม่เพียงพอ" },
                { status: 400 }
            );
        }

        const usage = await db.$transaction(async (tx) => {
            const newUsage = await tx.stockUsage.create({
                data: {
                    stockItemId: id,
                    quantity: new Prisma.Decimal(validated.data.quantity),
                    date: new Date(validated.data.date),
                    checkerName: validated.data.checkerName || null,
                    note: validated.data.note || null,
                },
            });

            await tx.stockItem.update({
                where: { id },
                data: {
                    currentQty: {
                        decrement: new Prisma.Decimal(validated.data.quantity),
                    },
                },
            });

            return newUsage;
        });

        return NextResponse.json(usage, { status: 201 });
    } catch (error) {
        console.error("[USAGES_POST]", error);
        return NextResponse.json({ error: "Failed to create usage" }, { status: 500 });
    }
}
