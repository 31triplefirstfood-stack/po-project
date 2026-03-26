"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import StockUsageReportTemplate from "@/components/pdf/StockUsageReportTemplate";

interface UsageReportItem {
    id: string;
    date: string;
    quantity: number;
    checkerName: string | null;
    checkedAt: string | null;
    displayDate?: string;
    stockItem: {
        name: string;
        imageUrl: string | null;
        currentQty: number;
        unit: string;
    };
}

interface StockItem {
    id: string;
    name: string;
    unit: string;
    currentQty: number;
}

export default function StockUsageReportPage() {
    const router = useRouter();
    const [items, setItems] = useState<UsageReportItem[]>([]);
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"day" | "month">("day");
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
    const todayStr = format(new Date(), "yyyy-MM-dd");

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
                const [usageRes, stockRes] = await Promise.all([
                    fetch("/api/stock/usages/report"),
                    fetch("/api/stock")
                ]);

                if (!usageRes.ok || !stockRes.ok) throw new Error("Failed to load data");
                
                setItems(await usageRes.json());
                setStockItems(await stockRes.json());
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const aggregatedItems = useMemo(() => {
        const groups: Record<string, Record<string, UsageReportItem>> = {};
        
        // Define the period we're looking at
        const activePeriod = viewMode === "day" ? todayStr : selectedMonth;
        
        // Initialize groups with all stock items for the active period
        // This ensures every material shows up even with 0 usage
        groups[activePeriod] = {};
        stockItems.forEach(si => {
            groups[activePeriod][si.name] = {
                id: `placeholder-${activePeriod}-${si.id}`,
                date: viewMode === "day" ? todayStr : `${selectedMonth}-01`,
                quantity: 0,
                checkerName: "-",
                checkedAt: null,
                stockItem: {
                    name: si.name,
                    imageUrl: null,
                    currentQty: si.currentQty,
                    unit: si.unit
                }
            };
        });

        // Filter and add actual usage data
        const filteredItems = items.filter(item => {
            const date = parseISO(item.date);
            if (viewMode === "day") {
                return format(date, "yyyy-MM-dd") === todayStr;
            } else {
                return format(date, "yyyy-MM") === selectedMonth;
            }
        });

        filteredItems.forEach(item => {
            const matName = item.stockItem.name;
            if (groups[activePeriod][matName]) {
                groups[activePeriod][matName].quantity += Number(item.quantity);
                // In day view, we might want to keep the last checker name
                if (item.checkerName) {
                    groups[activePeriod][matName].checkerName = item.checkerName;
                }
            }
        });
        
        const result: UsageReportItem[] = [];
        const displayDate = viewMode === "day" 
            ? format(new Date(todayStr), "dd MMMM yyyy", { locale: th })
            : format(new Date(selectedMonth + "-01"), "MMMM yyyy", { locale: th });
            
        Object.values(groups[activePeriod])
            .sort((a, b) => a.stockItem.name.localeCompare(b.stockItem.name))
            .forEach(record => {
                result.push({
                    ...record,
                    displayDate
                });
            });
        
        return result;
    }, [items, stockItems, viewMode, selectedMonth, todayStr]);

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
                    <div className="font-bold text-lg text-gray-800">รายงานประวัติการใช้วัตถุดิบ</div>
                </div>
                
                <div className="flex bg-white p-1 rounded-lg border border-gray-200">
                    <button 
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'day' ? 'bg-purple-50 shadow-sm text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        onClick={() => setViewMode('day')}
                    >
                        รายงานวันนี้
                    </button>
                    <button 
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'month' ? 'bg-purple-50 shadow-sm text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        onClick={() => setViewMode('month')}
                    >
                        รายงานรายเดือน
                    </button>
                </div>

                {viewMode === 'month' && (
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                        <span className="text-sm font-medium text-gray-500">เลือกเดือน:</span>
                        <input 
                            type="month" 
                            className="text-sm font-bold text-gray-800 border-none focus:ring-0 cursor-pointer"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>
                )}
            </div>
            <div className="flex-1">
                <PDFViewer width="100%" height="100%" className="border-none">
                    <StockUsageReportTemplate items={aggregatedItems} viewMode={viewMode} />
                </PDFViewer>
            </div>
        </div>
    );
}
