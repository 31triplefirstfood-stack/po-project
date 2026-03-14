import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const usages = await db.stockUsage.findMany({
            include: {
                stockItem: {
                    select: {
                        name: true,
                        imageUrl: true,
                        unit: true,
                        currentQty: true,
                    },
                },
            },
            orderBy: [
                { date: "desc" },
                { createdAt: "desc" },
            ],
        });

        return NextResponse.json(usages);
    } catch (error) {
        console.error("[STOCK_USAGES_REPORT_GET]", error);
        return NextResponse.json({ error: "Failed to fetch stock usage report" }, { status: 500 });
    }
}
