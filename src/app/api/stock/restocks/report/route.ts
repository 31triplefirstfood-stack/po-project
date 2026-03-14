import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const restocks = await db.stockRestock.findMany({
            include: {
                stockItem: {
                    select: {
                        name: true,
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

        return NextResponse.json(restocks);
    } catch (error) {
        console.error("[STOCK_RESTOCKS_REPORT_GET]", error);
        return NextResponse.json({ error: "Failed to fetch stock restock report" }, { status: 500 });
    }
}
