import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, direction } = body;

        if (!id || !direction || (direction !== "up" && direction !== "down")) {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        // Get all items in their current order
        const items = await db.stockItem.findMany({
            orderBy: [
                { sortOrder: "asc" },
                { name: "asc" }
            ]
        });

        const targetIndex = items.findIndex(item => item.id === id);
        if (targetIndex === -1) {
            return NextResponse.json({ error: "Stock item not found" }, { status: 404 });
        }

        // Swap target index with targetIndex - 1 (for up) or targetIndex + 1 (for down)
        let swapIndex = -1;
        if (direction === "up" && targetIndex > 0) {
            swapIndex = targetIndex - 1;
        } else if (direction === "down" && targetIndex < items.length - 1) {
            swapIndex = targetIndex + 1;
        }

        if (swapIndex !== -1) {
            const targetItem = items[targetIndex];
            const swapItem = items[swapIndex];

            // Perform swap in a transaction
            await db.$transaction([
                db.stockItem.update({
                    where: { id: targetItem.id },
                    data: { sortOrder: swapItem.sortOrder }
                }),
                db.stockItem.update({
                    where: { id: swapItem.id },
                    data: { sortOrder: targetItem.sortOrder }
                })
            ]);
            
            // To ensure they don't get stuck with equal sortOrder in case of any duplicate/default 0:
            if (Number(targetItem.sortOrder) === Number(swapItem.sortOrder)) {
                // Assign new unique sequential sort orders to all items
                await db.$transaction(
                    items.map((item, idx) => {
                        let newOrder = idx;
                        if (idx === targetIndex) newOrder = swapIndex;
                        else if (idx === swapIndex) newOrder = targetIndex;
                        return db.stockItem.update({
                            where: { id: item.id },
                            data: { sortOrder: newOrder }
                        });
                    })
                );
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[STOCK_REORDER_POST]", error);
        return NextResponse.json({ error: "Failed to reorder stock items" }, { status: 500 });
    }
}
