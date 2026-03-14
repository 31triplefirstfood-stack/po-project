"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import StockUsageReportTemplate from "@/components/pdf/StockUsageReportTemplate";

interface UsageReportItem {
    id: string;
    date: string;
    quantity: number;
    checkerName: string | null;
    checkedAt: string | null;
    stockItem: {
        name: string;
        imageUrl: string | null;
        currentQty: number;
        unit: string;
    };
}

export default function StockUsageReportPage() {
    const [items, setItems] = useState<UsageReportItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const PDFViewer = dynamic(
        () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
        {
            ssr: false,
            loading: () => (
                <div className="flex h-[100dvh] items-center justify-center bg-muted/10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ),
        }
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/stock/usages/report");
                if (!res.ok) throw new Error("Failed to load report");
                setItems(await res.json());
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-[100dvh] items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="h-[100dvh] w-full bg-white">
            <PDFViewer width="100%" height="100%" className="border-none">
                <StockUsageReportTemplate items={items} />
            </PDFViewer>
        </div>
    );
}
