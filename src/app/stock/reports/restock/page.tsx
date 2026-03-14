"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import StockRestockReportTemplate from "@/components/pdf/StockRestockReportTemplate";

interface RestockReportItem {
    id: string;
    receiptNumber: string;
    quantity: number;
    date: string;
    stockItem: {
        name: string;
        unit: string;
        currentQty: number;
    };
}

export default function StockRestockReportPage() {
    const [items, setItems] = useState<RestockReportItem[]>([]);
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
                const res = await fetch("/api/stock/restocks/report");
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
                <StockRestockReportTemplate items={items} />
            </PDFViewer>
        </div>
    );
}
