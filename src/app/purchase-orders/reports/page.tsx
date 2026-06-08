"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import CustomerOrderReportTemplate, { CustomerOrderSummaryItem } from "@/components/pdf/CustomerOrderReportTemplate";

interface PurchaseOrder {
    id: string;
    poNumber: string;
    status: string;
    issueDate: string;
    paymentDate?: string | null;
    deliveryDate: string;
    grandTotal: number;
    supplier: {
        companyName: string;
    };
    items: {
        product: { name: string } | null;
        itemName?: string;
        quantity: number;
        unit: string;
    }[];
}

export default function CustomerOrderReportsPage() {
    const router = useRouter();
    const [pos, setPos] = useState<PurchaseOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Default report configurations
    const [reportType, setReportType] = useState<"daily" | "monthly">("daily");
    const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

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
        const fetchPOs = async () => {
            try {
                const res = await fetch("/api/purchase-orders");
                if (!res.ok) throw new Error("Failed to load POs");
                const data = await res.json();
                setPos(data);
            } catch (error) {
                console.error("[REPORTS_FETCH_POS_ERROR]", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPOs();
    }, []);

    // Filter POs & format them for report consumption
    const reportItems = useMemo(() => {
        const filtered = pos.filter((po) => {
            const dateStr = po.issueDate.substring(0, 10); // "YYYY-MM-DD"
            if (reportType === "daily") {
                return dateStr === selectedDate;
            } else {
                return dateStr.substring(0, 7) === selectedMonth; // "YYYY-MM"
            }
        });

        return filtered.map((po) => {
            const itemsStr = po.items
                .map((item) => {
                    const name = item.product?.name || item.itemName || "สินค้า";
                    return `${name} (${Number(item.quantity).toLocaleString()} ${item.unit || "ห่อ"})`;
                })
                .join(", ");
            const totalQty = po.items.reduce((s, i) => s + Number(i.quantity || 0), 0);

            // Format PO number using standard logic if needed
            // e.g. PO-XXXX
            let formattedPoNumber = po.poNumber;
            if (po.poNumber && !po.poNumber.startsWith("PO-") && po.poNumber.length === 6) {
                formattedPoNumber = `PO-${po.poNumber}`;
            }

            return {
                id: po.id,
                poNumber: formattedPoNumber,
                customerName: po.supplier.companyName,
                issueDate: po.issueDate,
                itemsSummary: itemsStr,
                totalQty,
                grandTotal: Number(po.grandTotal),
            } as CustomerOrderSummaryItem;
        });
    }, [pos, reportType, selectedDate, selectedMonth]);

    // Period labels for the PDF report headers
    const displayPeriod = useMemo(() => {
        try {
            if (reportType === "daily") {
                return format(parseISO(selectedDate), "d MMMM yyyy", { locale: th });
            } else {
                return format(parseISO(selectedMonth + "-01"), "MMMM yyyy", { locale: th });
            }
        } catch (e) {
            return "";
        }
    }, [reportType, selectedDate, selectedMonth]);

    if (isLoading) {
        return (
            <div className="flex h-[100dvh] items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[100dvh] w-full bg-white">
            <div className="p-4 border-b flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gray-50">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => router.push('/purchase-orders')} className="border-gray-300">
                        <ArrowLeft className="w-4 h-4 mr-2" /> ย้อนกลับ
                    </Button>
                    <div className="font-bold text-lg text-gray-800">รายงานสรุปยอดสั่งซื้อลูกค้า</div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    {/* Toggle Report Type */}
                    <div className="flex bg-white p-1 rounded-lg border border-gray-200">
                        <button 
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${reportType === 'daily' ? 'bg-purple-50 shadow-sm text-purple-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                            onClick={() => setReportType('daily')}
                        >
                            รายงานรายวัน
                        </button>
                        <button 
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${reportType === 'monthly' ? 'bg-purple-50 shadow-sm text-purple-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                            onClick={() => setReportType('monthly')}
                        >
                            รายงานรายเดือน
                        </button>
                    </div>

                    {/* Date Selector input based on Report Type */}
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                        <Calendar className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium text-gray-500">
                            {reportType === 'daily' ? 'เลือกวันที่:' : 'เลือกเดือน:'}
                        </span>
                        {reportType === 'daily' ? (
                            <input 
                                type="date" 
                                className="text-sm font-bold text-gray-800 border-none focus:ring-0 cursor-pointer bg-transparent"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        ) : (
                            <input 
                                type="month" 
                                className="text-sm font-bold text-gray-800 border-none focus:ring-0 cursor-pointer bg-transparent"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            />
                        )}
                    </div>
                </div>
            </div>
            
            {/* Embedded PDF Viewer */}
            <div className="flex-1">
                <PDFViewer width="100%" height="100%" className="border-none">
                    <CustomerOrderReportTemplate 
                        reportType={reportType} 
                        displayPeriod={displayPeriod} 
                        items={reportItems} 
                    />
                </PDFViewer>
            </div>
        </div>
    );
}
