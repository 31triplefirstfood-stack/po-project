import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const stockItemSchema = z.object({
    name: z.string().min(1, "ชื่อวัตถุดิบจำเป็นต้องระบุ"),
    imageUrl: z.string().url("URL รูปภาพไม่ถูกต้อง").optional().or(z.literal("")),
    unit: z.string().min(1, "หน่วยจำเป็นต้องระบุ"),
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") ?? "";

        const stockItems = await db.stockItem.findMany({
            where: search
                ? {
                    name: { contains: search, mode: "insensitive" },
                }
                : undefined,
            include: {
                restocks: {
                    orderBy: { date: "desc" },
                    take: 1,
                },
                _count: {
                    select: {
                        restocks: true,
                        usages: true,
                    },
                },
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json(stockItems);
    } catch (error) {
        console.error("[STOCK_GET]", error);
        return NextResponse.json({ error: "Failed to fetch stock items" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validated = stockItemSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validated.error.flatten() },
                { status: 400 }
            );
        }

        const stockItem = await db.stockItem.create({
            data: {
                name: validated.data.name,
                imageUrl: validated.data.imageUrl || null,
                unit: validated.data.unit,
                currentQty: 0,
            },
        });

        return NextResponse.json(stockItem, { status: 201 });
    } catch (error) {
        console.error("[STOCK_POST]", error);
        return NextResponse.json({ error: "Failed to create stock item" }, { status: 500 });
    }
}
