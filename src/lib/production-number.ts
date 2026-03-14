import { db } from "@/lib/db";
import { format } from "date-fns";

/**
 * Generates the next Production Order number in the format PROD-YYYYMMDD-XXX.
 * Uses a similar pattern to PO number generation.
 * 
 * Must be called inside a Prisma transaction.
 */
export async function generateProductionNumber(
    tx: Omit<typeof db, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">
): Promise<string> {
    const now = new Date();
    const thaiYear = now.getFullYear() + 543;
    const month = format(now, "MM");
    const day = format(now, "dd");
    const datePart = `${thaiYear}${month}${day}`;

    const prefix = `PROD-${datePart}-`;

    const lastProduction = await tx.productionOrder.findFirst({
        where: {
            id: {
                startsWith: prefix,
            },
        },
        orderBy: {
            id: "desc",
        },
        select: {
            id: true,
        },
    });

    let nextSequence = 1;

    if (lastProduction) {
        const parts = lastProduction.id.split("-");
        if (parts.length === 3) {
            const lastSequence = parseInt(parts[2], 10);
            if (!isNaN(lastSequence)) {
                nextSequence = lastSequence + 1;
            }
        }
    }

    const sequence = String(nextSequence).padStart(3, "0");
    return `${prefix}${sequence}`;
}
