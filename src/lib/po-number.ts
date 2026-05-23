import { db } from "@/lib/db";
import { format } from "date-fns";

/**
 * Generates the next PO number in the format TAX{Year}-{Month}-B{Sequence}.
 * Computes the max sequence number for the entire year so that
 * the sequence number continues across months and resets yearly.
 *
 * Must be called inside a Prisma transaction.
 */
export async function generatePoNumber(
    tx: Omit<typeof db, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
    customDate?: Date
): Promise<string> {
    const referenceDate = customDate || new Date();
    const thaiYear = referenceDate.getFullYear() + 543;
    const month = format(referenceDate, "MM");
    
    // Prefix for searching all POs within the same month of the same year
    const monthPrefix = `TAX${thaiYear}-${month}-`;
    // Full prefix for the newly generated PO
    const fullPrefix = `TAX${thaiYear}-${month}-B`;

    // Fetch all PO numbers in the current month to find the highest sequence
    const allPosThisMonth = await tx.purchaseOrder.findMany({
        where: {
            poNumber: {
                startsWith: monthPrefix,
            },
        },
        select: {
            poNumber: true,
        },
    });

    let nextSequence = 1;

    if (allPosThisMonth.length > 0) {
        const sequences = allPosThisMonth.map((po) => {
            const parts = po.poNumber.split("-B");
            if (parts.length === 2) {
                const seq = parseInt(parts[1], 10);
                return isNaN(seq) ? 0 : seq;
            }
            return 0;
        });
        const maxSequence = Math.max(...sequences);
        nextSequence = maxSequence + 1;
    }

    const sequence = String(nextSequence).padStart(3, "0");
    return `${fullPrefix}${sequence}`;
}
