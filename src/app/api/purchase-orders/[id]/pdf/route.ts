import { renderToBuffer } from '@react-pdf/renderer';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import POTemplate from '@/components/pdf/POTemplate';
import { formatPoNumber } from '@/lib/utils';
import { getPoPdfFilename } from '@/lib/file-save';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const order = await db.purchaseOrder.findUnique({
            where: { id },
            include: { supplier: true, items: { include: { product: true }, orderBy: { id: 'asc' } } },
        });
        if (!order) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
        const data = {
            poNumber: formatPoNumber(order.poNumber),
            issueDate: order.issueDate.toISOString(),
            paymentDate: order.paymentDate?.toISOString() ?? null,
            deliveryDate: order.deliveryDate.toISOString(),
            supplier: {
                companyName: order.supplier.companyName,
                contactPerson: order.supplier.contactPerson ?? '', phone: order.supplier.phone ?? '',
                email: order.supplier.email ?? '', address: order.supplier.address ?? '', taxId: order.supplier.taxId ?? '',
            },
            items: order.items.map(item => ({
                productName: item.product?.name ?? item.itemName ?? '(ไม่ระบุชื่อสินค้า)',
                quantity: Number(item.quantity), unitPrice: Number(item.unitPrice), unit: item.product?.unit ?? '-',
            })),
        };
        const buffer = await renderToBuffer(POTemplate({ data }));
        const name = getPoPdfFilename(order.poNumber);
        return new NextResponse(new Uint8Array(buffer), { headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${name.replace(/[^\x20-\x7e]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(name)}`,
            'Cache-Control': 'no-store',
        } });
    } catch (error) {
        console.error('[PO_PDF]', error);
        return NextResponse.json({ error: 'ไม่สามารถสร้าง PDF ได้ กรุณาลองใหม่' }, { status: 500 });
    }
}
