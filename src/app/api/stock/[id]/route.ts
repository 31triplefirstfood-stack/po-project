import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const stockItemSchema = z.object({
    name: z.string().min(1, "ชื่อวัตถุดิบจำเป็นต้องระบุ"),
    imageUrl: z.string().url("URL รูปภาพไม่ถูกต้อง").optional().or(z.literal("")),
    unit: z.string().min(1, "หน่วยจำเป็นต้องระบุ"),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const stockItem = await db.stockItem.findUnique({
            where: { id },
            include: {
                restocks: {
                    orderBy: { date: "desc" },
                },
                usages: {
                    orderBy: { date: "desc" },
                },
            },
        });

        if (!stockItem) {
            return NextResponse.json({ error: "Stock item not found" }, { status: 404 });
        }

        return NextResponse.json(stockItem);
    } catch (error) {
        console.error("[STOCK_GET_BY_ID]", error);
        return NextResponse.json({ error: "Failed to fetch stock item" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validated = stockItemSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validated.error.flatten() },
                { status: 400 }
            );
        }

        const stockItem = await db.stockItem.update({
            where: { id },
            data: {
                name: validated.data.name,
                imageUrl: validated.data.imageUrl || null,
                unit: validated.data.unit,
            },
        });

        return NextResponse.json(stockItem);
    } catch (error) {
        console.error("[STOCK_PUT]", error);
        return NextResponse.json({ error: "Failed to update stock item" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await db.stockItem.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[STOCK_DELETE]", error);
        return NextResponse.json({ error: "Failed to delete stock item" }, { status: 500 });
    }
}
