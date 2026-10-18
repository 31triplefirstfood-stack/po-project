"use client";

import { useRef, useState, type ComponentProps } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { buildPoArchive, getMonthlyRange, selectArchiveNames } from '@/lib/monthly-po-export';
import { formatPoNumber } from '@/lib/utils';
import { prepareFileSave } from '@/lib/file-save';
import type POTemplate from '@/components/pdf/POTemplate';

type PdfData = ComponentProps<typeof POTemplate>['data'];
interface ExportOrder extends Omit<PdfData, 'items'> {
    id: string;
    items: { itemName?: string | null; quantity: number | string; unitPrice: number | string;
        product: { name: string; unit: string } | null }[];
}

export default function MonthlyPoExport() {
    const now = new Date();
    const [open, setOpen] = useState(false);
    const [month, setMonth] = useState(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Bangkok', month: 'numeric' }).format(now));
    const [year, setYear] = useState(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Bangkok', year: 'numeric' }).format(now));
    const [progress, setProgress] = useState('');
    const busy = useRef(false);
    const { toast } = useToast();

    async function download() {
        if (busy.current) return;
        busy.current = true;
        setProgress('กำลังโหลดรายการ PO…');
        try {
            getMonthlyRange(Number(year), Number(month));
            const target = await prepareFileSave({ name: `PO-${Number(year) + 543}-${month.padStart(2, '0')}.zip`, mimeType: 'application/zip', extension: '.zip' });
            if (!target) return;
            const response = await fetch(`/api/purchase-orders/monthly-export?year=${year}&month=${month}`, { cache: 'no-store' });
            if (!response.ok) throw new Error('ไม่สามารถโหลด PO ได้ กรุณาลองใหม่');
            const orders: ExportOrder[] = await response.json();
            if (!orders.length) {
                toast({ title: 'ไม่พบ PO ในเดือนที่เลือก' });
                return;
            }
            const [{ pdf }, { default: Template }] = await Promise.all([
                import('@react-pdf/renderer'), import('@/components/pdf/POTemplate'),
            ]);
            const files: { name: string; data: Uint8Array }[] = [];
            const names = selectArchiveNames(orders.map(order => ({ original: order.poNumber, display: formatPoNumber(order.poNumber) })));
            for (const [index, order] of orders.entries()) {
                setProgress(`กำลังสร้าง PDF ${index + 1} / ${orders.length} ใบ`);
                const data: PdfData = {
                    ...order,
                    poNumber: formatPoNumber(order.poNumber),
                    items: order.items.map(item => ({
                        productName: item.product?.name ?? item.itemName ?? '(ไม่ระบุชื่อสินค้า)',
                        quantity: Number(item.quantity),
                        unitPrice: Number(item.unitPrice),
                        unit: item.product?.unit ?? '-',
                    })),
                };
                const blob = await pdf(<Template data={data} />).toBlob();
                files.push({ name: names[index], data: new Uint8Array(await blob.arrayBuffer()) });
            }
            setProgress('กำลังเตรียมไฟล์ ZIP…');
            const archive = buildPoArchive(files);
            const result = await target.save(new Blob([archive], { type: 'application/zip' }));
            toast({ title: `สร้างไฟล์ครบ ${orders.length} ใบแล้ว`, description: result === 'saved' ? 'บันทึก ZIP ในตำแหน่งที่เลือกแล้ว' : 'ส่งไฟล์ ZIP ให้เบราว์เซอร์ดาวน์โหลดแล้ว' });
            setOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'ดาวน์โหลดไม่สำเร็จ',
                description: error instanceof Error ? error.message : 'กรุณาลองใหม่' });
        } finally {
            busy.current = false;
            setProgress('');
        }
    }

    return <>
        <Button onClick={() => setOpen(true)} className="bg-white text-purple-700 hover:bg-purple-50 font-bold border border-transparent shadow-sm flex items-center gap-1.5 text-xs sm:text-sm">
            <Download className="w-4 h-4" /> ดาวน์โหลด PO รายเดือน
        </Button>
        <Dialog open={open} onOpenChange={value => { if (!busy.current) setOpen(value); }}>
            <DialogContent className="sm:max-w-md bg-white text-slate-900 border-violet-200 shadow-2xl" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                <DialogHeader>
                    <DialogTitle>ดาวน์โหลด PO รายเดือน</DialogTitle>
                    <DialogDescription className="text-slate-600">เลือกตามวันที่สั่งซื้อ รวมทุกสถานะและทุกขั้นตอนการผลิต ดาวน์โหลดเป็น ZIP ภายในมี PDF แยกตามเลข PO</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 rounded-lg border border-violet-100 bg-violet-50 p-4">
                    <label className="text-sm space-y-2">เดือน
                        <select aria-label="เดือน" value={month} onChange={e => setMonth(e.target.value)} disabled={!!progress} className="border border-slate-300 text-slate-900 rounded-md w-full h-10 px-2 bg-white">
                            {Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1)}>{new Intl.DateTimeFormat('th-TH', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, i, 1)))}</option>)}
                        </select>
                    </label>
                    <label className="text-sm space-y-2">ปี พ.ศ.
                        <Input className="bg-white text-slate-900 border-slate-300" aria-label="ปี พ.ศ." type="number" min={2443} max={2743} value={year ? Number(year) + 543 : ''} disabled={!!progress} onChange={e => setYear(e.target.value ? String(Number(e.target.value) - 543) : '')} />
                    </label>
                </div>
                <p role="status" aria-live="polite" className="text-sm text-gray-600">{progress || 'PDF ใช้รูปแบบเดียวกับหน้าเปิดดู PO กรุณาเปิดหน้านี้ไว้จนสร้างไฟล์ครบ'}</p>
                <p className="text-xs text-slate-600">กดปุ่มด้านล่างเพื่อเลือกที่บันทึกไฟล์ หากเบราว์เซอร์ไม่รองรับ จะใช้ตำแหน่งดาวน์โหลดตามการตั้งค่าเบราว์เซอร์</p>
                <Button className="bg-violet-700 hover:bg-violet-800 text-white" disabled={!!progress || !year} onClick={download}>
                    {progress ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : <Download className="mr-2 w-4 h-4" />}
                    {progress ? 'กำลังเตรียมไฟล์…' : 'เลือกที่บันทึกและดาวน์โหลด ZIP'}
                </Button>
            </DialogContent>
        </Dialog>
    </>;
}
