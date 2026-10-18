"use client";

import { useRef, useState, type ComponentProps } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getPoPdfFilename, prepareFileSave } from '@/lib/file-save';
import type POTemplate from '@/components/pdf/POTemplate';

export default function PoPdfDownload({ data }: ComponentProps<typeof POTemplate>) {
    const [loading, setLoading] = useState(false);
    const busy = useRef(false);
    const { toast } = useToast();

    async function download() {
        if (busy.current) return;
        busy.current = true;
        setLoading(true);
        try {
            const name = getPoPdfFilename(data.poNumber);
            const target = await prepareFileSave({ name, mimeType: 'application/pdf', extension: '.pdf' });
            if (!target) return;
            const [{ pdf }, { default: Template }] = await Promise.all([
                import('@react-pdf/renderer'), import('@/components/pdf/POTemplate'),
            ]);
            const blob = await pdf(<Template data={data} />).toBlob();
            const result = await target.save(blob);
            toast({ title: result === 'saved' ? 'บันทึก PDF แล้ว' : 'ส่ง PDF ให้เบราว์เซอร์ดาวน์โหลดแล้ว', description: name });
        } catch (error) {
            toast({ variant: 'destructive', title: 'บันทึก PDF ไม่สำเร็จ',
                description: error instanceof Error ? error.message : 'กรุณาลองใหม่' });
        } finally {
            busy.current = false;
            setLoading(false);
        }
    }

    return <Button disabled={loading} onClick={download} className="bg-violet-700 hover:bg-violet-800 text-white">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
        {loading ? 'กำลังบันทึก…' : 'ดาวน์โหลด PDF'}
    </Button>;
}
