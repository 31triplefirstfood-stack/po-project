"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

interface StockItem {
    id: string;
    name: string;
    unit: string;
    currentQty: number;
    restocks: any[];
}

export default function StockRestockReportPage() {
    const router = useRouter();
    const [items, setItems] = useState<RestockReportItem[]>([]);
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"latest" | "all">("latest");
    const [selectedItemName, setSelectedItemName] = useState<string>("all");

    const uniqueItemNames = useMemo(() => {
        return stockItems.map(i => i.name).sort();
    }, [stockItems]);

    const PDFViewer = dynamic(
        () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
        {
            ssr: false,
            loading: () => (
                <div className="flex flex-1 items-center justify-center bg-muted/10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ),
        }
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [restockRes, stockRes] = await Promise.all([
                    fetch("/api/stock/restocks/report"),
                    fetch("/api/stock")
                ]);
                
                if (!restockRes.ok || !stockRes.ok) throw new Error("Failed to load data");
                
                setItems(await restockRes.json());
                setStockItems(await stockRes.json());
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const displayData = useMemo(() => {
        if (viewMode === "all") {
            let filtered = items;
            if (selectedItemName !== "all") {
                filtered = items.filter(i => i.stockItem.name === selectedItemName);
            }
            return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } else {
            // Latest mode: Show all materials from stockItems
            let filteredItems = stockItems;
            if (selectedItemName !== "all") {
                filteredItems = stockItems.filter(i => i.name === selectedItemName);
            }

            return filteredItems.map(si => {
                const latestFromHistory = items.find(i => i.stockItem.name === si.name);
                
                // If it exists in history, it should be the newest one because items is sorted by date desc
                if (latestFromHistory) {
                    return latestFromHistory;
                }

                // If not in history, create a placeholder
                return {
                    id: `placeholder-${si.id}`,
                    receiptNumber: "-",
                    quantity: 0,
                    date: new Date(0).toISOString(),
                    stockItem: {
                        name: si.name,
                        unit: si.unit,
                        currentQty: si.currentQty
                    }
                } as RestockReportItem;
            }).sort((a, b) => a.stockItem.name.localeCompare(b.stockItem.name));
        }
    }, [items, stockItems, viewMode, selectedItemName]);

    if (isLoading) {
        return (
            <div className="flex h-[100dvh] items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[100dvh] w-full bg-white">
            <div className="p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => router.push('/stock')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> ย้อนกลับ
                    </Button>
                    <div className="font-bold text-lg text-gray-800">รายงานประวัติการเติมสต็อก</div>
                </div>
                
                <div className="flex bg-white p-1 rounded-lg border border-gray-200">
                    <Select value={selectedItemName} onValueChange={setSelectedItemName}>
                        <SelectTrigger className="w-full sm:w-[180px] bg-white border-0 shadow-none focus:ring-0 mr-2 border-r rounded-none">
                            <SelectValue placeholder="ทุกวัตถุดิบ" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value="all">ทุกวัตถุดิบ</SelectItem>
                            {uniqueItemNames.map(name => (
                                <SelectItem key={name} value={name}>{name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <button 
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'latest' ? 'bg-blue-50 shadow-sm text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        onClick={() => setViewMode('latest')}
                    >
                        ดูล่าสุดของแต่ละวัตถุดิบ
                    </button>
                    <button 
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'all' ? 'bg-blue-50 shadow-sm text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        onClick={() => setViewMode('all')}
                    >
                        ดูประวัติแยกทั้งหมด
                    </button>
                </div>
            </div>
            <div className="flex-1">
                <PDFViewer width="100%" height="100%" className="border-none">
                    <StockRestockReportTemplate items={displayData} />
                </PDFViewer>
            </div>
        </div>
    );
}
