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
    price: number | null;
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
    const [filterMonth, setFilterMonth] = useState<string>("all");
    const [filterYear, setFilterYear] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("date-desc");

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 6 }, (_, i) => String(currentYear - i));

    const monthOptions = [
        { value: "1", label: "มกราคม (Jan)" },
        { value: "2", label: "กุมภาพันธ์ (Feb)" },
        { value: "3", label: "มีนาคม (Mar)" },
        { value: "4", label: "เมษายน (Apr)" },
        { value: "5", label: "พฤษภาคม (May)" },
        { value: "6", label: "มิถุนายน (Jun)" },
        { value: "7", label: "กรกฎาคม (Jul)" },
        { value: "8", label: "สิงหาคม (Aug)" },
        { value: "9", label: "กันยายน (Sep)" },
        { value: "10", label: "ตุลาคม (Oct)" },
        { value: "11", label: "พฤศจิกายน (Nov)" },
        { value: "12", label: "ธันวาคม (Dec)" },
    ];

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
        let filtered = items;

        // Apply Item Name filter
        if (selectedItemName !== "all") {
            filtered = filtered.filter(i => i.stockItem.name === selectedItemName);
        }

        // Apply Month & Year filter
        if (filterYear !== "all") {
            filtered = filtered.filter(i => new Date(i.date).getFullYear() === Number(filterYear));
        }
        if (filterMonth !== "all") {
            filtered = filtered.filter(i => (new Date(i.date).getMonth() + 1) === Number(filterMonth));
        }

        if (viewMode === "all") {
            // Sort according to sortBy selector
            return [...filtered].sort((a, b) => {
                if (sortBy === "date-desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
                if (sortBy === "date-asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
                if (sortBy === "name-asc") return a.stockItem.name.localeCompare(b.stockItem.name);
                if (sortBy === "name-desc") return b.stockItem.name.localeCompare(a.stockItem.name);
                if (sortBy === "price-desc") return Number(b.price || 0) - Number(a.price || 0);
                if (sortBy === "price-asc") return Number(a.price || 0) - Number(b.price || 0);
                if (sortBy === "qty-desc") return Number(b.quantity) - Number(a.quantity);
                if (sortBy === "qty-asc") return Number(a.quantity) - Number(b.quantity);
                return 0;
            });
        } else {
            // Latest mode: Show the latest restock record for each stock item for the selected period
            let filteredStockItems = stockItems;
            if (selectedItemName !== "all") {
                filteredStockItems = stockItems.filter(i => i.name === selectedItemName);
            }

            const latestItems = filteredStockItems.map(si => {
                const itemHistory = filtered.filter(i => i.stockItem.name === si.name);
                const latestFromHistory = itemHistory.length > 0 ? itemHistory[0] : null;
                
                if (latestFromHistory) {
                    return latestFromHistory;
                }

                // Placeholder if no restocks found in this period
                return {
                    id: `placeholder-${si.id}`,
                    receiptNumber: "-",
                    quantity: 0,
                    price: 0,
                    date: new Date(0).toISOString(),
                    stockItem: {
                        name: si.name,
                        unit: si.unit,
                        currentQty: si.currentQty
                    }
                } as RestockReportItem;
            });

            // Sort latestItems
            return latestItems.sort((a, b) => {
                if (sortBy === "name-asc") return a.stockItem.name.localeCompare(b.stockItem.name);
                if (sortBy === "name-desc") return b.stockItem.name.localeCompare(a.stockItem.name);
                if (sortBy === "date-desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
                if (sortBy === "date-asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
                if (sortBy === "price-desc") return Number(b.price || 0) - Number(a.price || 0);
                if (sortBy === "price-asc") return Number(a.price || 0) - Number(b.price || 0);
                if (sortBy === "qty-desc") return Number(b.quantity) - Number(a.quantity);
                if (sortBy === "qty-asc") return Number(a.quantity) - Number(b.quantity);
                return 0;
            });
        }
    }, [items, stockItems, viewMode, selectedItemName, filterMonth, filterYear, sortBy]);

    if (isLoading) {
        return (
            <div className="flex h-[100dvh] items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[100dvh] w-full bg-white">
            <div className="p-4 border-b flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-gray-50">
                <div className="flex items-center gap-4 shrink-0">
                    <Button variant="outline" onClick={() => router.push('/stock')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> ย้อนกลับ
                    </Button>
                    <div className="font-bold text-lg text-gray-800">รายงานประวัติการเติมสต็อก</div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center bg-white p-1 rounded-lg border border-gray-200">
                        <Select value={selectedItemName} onValueChange={setSelectedItemName}>
                            <SelectTrigger className="w-full sm:w-[150px] bg-white border-0 shadow-none focus:ring-0 mr-2 border-r rounded-none text-xs">
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
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'latest' ? 'bg-blue-50 shadow-sm text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                            onClick={() => setViewMode('latest')}
                        >
                            ดูล่าสุดของวัตถุดิบ
                        </button>
                        <button 
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'all' ? 'bg-blue-50 shadow-sm text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                            onClick={() => setViewMode('all')}
                        >
                            ดูประวัติทั้งหมด
                        </button>
                    </div>

                    <div className="flex bg-white px-2 py-1 rounded-lg border border-gray-200 gap-2 items-center text-xs">
                        <span className="text-gray-400 font-semibold">เดือน/ปี:</span>
                        <Select value={filterMonth} onValueChange={setFilterMonth}>
                            <SelectTrigger className="border-0 bg-transparent h-8 shadow-none focus:ring-0 w-24 text-xs">
                                <SelectValue placeholder="ทุกเดือน" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกเดือน</SelectItem>
                                {monthOptions.map(m => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterYear} onValueChange={setFilterYear}>
                            <SelectTrigger className="border-0 bg-transparent h-8 shadow-none focus:ring-0 w-24 text-xs">
                                <SelectValue placeholder="ทุกปี" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกปี</SelectItem>
                                {yearOptions.map(y => (
                                    <SelectItem key={y} value={y}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex bg-white px-2 py-1 rounded-lg border border-gray-200 gap-2 items-center text-xs">
                        <span className="text-gray-400 font-semibold">จัดเรียง:</span>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="border-0 bg-transparent h-8 shadow-none focus:ring-0 w-32 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="date-desc">วันที่ (ล่าสุด-เก่าสุด)</SelectItem>
                                <SelectItem value="date-asc">วันที่ (เก่าสุด-ล่าสุด)</SelectItem>
                                <SelectItem value="name-asc">ชื่อ (ก-ฮ)</SelectItem>
                                <SelectItem value="name-desc">ชื่อ (ฮ-ก)</SelectItem>
                                <SelectItem value="price-desc">ราคา (มาก-น้อย)</SelectItem>
                                <SelectItem value="price-asc">ราคา (น้อย-มาก)</SelectItem>
                                <SelectItem value="qty-desc">จำนวน (มาก-น้อย)</SelectItem>
                                <SelectItem value="qty-asc">จำนวน (น้อย-มาก)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
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
