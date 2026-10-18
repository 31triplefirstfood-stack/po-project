import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getMonthlyRange } from '@/lib/monthly-po-export';

export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    let issueDate;
    try {
        issueDate = getMonthlyRange(Number(params.get('year')), Number(params.get('month')));
    } catch {
        return NextResponse.json({ error: 'เดือนหรือปีไม่ถูกต้อง' }, { status: 400 });
    }
    try {
        // Include every status and production stage, independent of list filters.
        const orders = await db.purchaseOrder.findMany({
            where: { issueDate },
            include: {
                supplier: true,
                items: { include: { product: true }, orderBy: { id: 'asc' } },
            },
            orderBy: [{ poNumber: 'asc' }, { id: 'asc' }],
        });
        return NextResponse.json(orders, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        console.error('[PO_MONTHLY_EXPORT]', error);
        return NextResponse.json({ error: 'ไม่สามารถโหลด PO รายเดือนได้ กรุณาลองใหม่' }, { status: 500 });
    }
}
