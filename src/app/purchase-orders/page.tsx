"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Eye, Trash2, Edit, Search, FileSpreadsheet, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import Header from "@/components/Header";
import NavTabs from "@/components/NavTabs";
import { cn, formatPoNumber } from "@/lib/utils";

// Mock DatePicker if not exists, or I will use standard input type date for speed
function DatePickerInput({ date, setDate }: { date: Date | undefined, setDate: (d: Date | undefined) => void }) {
    return <Input type="date" value={date ? format(date, "yyyy-MM-dd") : ""} onChange={(e) => setDate(e.target.value ? new Date(e.target.value) : undefined)} />;
}

interface PurchaseOrder {
    id: string;
    poNumber: string;
    status: string;
    issueDate: string;
    paymentDate?: string | null;
    deliveryDate: string;
    grandTotal: number;
    shippingCost: number;
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

export default function PurchaseOrdersPage() {
    const [pos, setPos] = useState<PurchaseOrder[]>([]);
    const [filteredPos, setFilteredPos] = useState<PurchaseOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [poToCancel, setPoToCancel] = useState<string | null>(null);

    const handleCancelPo = async () => {
        if (!poToCancel) return;
        try {
            const res = await fetch(`/api/purchase-orders/${poToCancel}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to delete PO");
            }

            toast({
                title: "Success",
                description: "Purchase order has been deleted successfully",
            });
            fetchPOs();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Could not delete purchase order",
            });
        } finally {
            setPoToCancel(null);
        }
    };



    // Filters
    const [searchType, setSearchType] = useState("all");
    const [filterDate, setFilterDate] = useState<Date | undefined>();
    const [filterPo, setFilterPo] = useState("");
    const [filterCustomer, setFilterCustomer] = useState("");
    const [filterMonth, setFilterMonth] = useState("all");
    const [filterYear, setFilterYear] = useState("all");

    // Generate year options dynamically (last 5 years + current)
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

    const fetchPOs = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/purchase-orders");
            if (!res.ok) throw new Error("Failed to fetch POs");
            const data = await res.json();
            const normalizedData = data.map((po: PurchaseOrder) => ({
                ...po,
                poNumber: formatPoNumber(po.poNumber),
            }));
            setPos(normalizedData);
            setFilteredPos(normalizedData);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not load purchase orders.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPOs();
    }, []);

    // Filter Logic
    useEffect(() => {
        let result = pos;
        if (filterPo) {
            result = result.filter(po => po.poNumber.toLowerCase().includes(filterPo.toLowerCase()));
        }
        if (filterCustomer) {
            result = result.filter(po => po.supplier.companyName.toLowerCase().includes(filterCustomer.toLowerCase()));
        }
        if (filterDate) {
            const dateStr = format(filterDate, "yyyy-MM-dd");
            result = result.filter(po => po.issueDate.startsWith(dateStr));
        }
        if (filterYear !== "all") {
            result = result.filter(po => new Date(po.issueDate).getFullYear() === Number(filterYear));
        }
        if (filterMonth !== "all") {
            result = result.filter(po => (new Date(po.issueDate).getMonth() + 1) === Number(filterMonth));
        }
        setFilteredPos(result);
    }, [pos, filterPo, filterCustomer, filterDate, filterMonth, filterYear]);

    const resetFilters = () => {
        setFilterPo("");
        setFilterCustomer("");
        setFilterDate(undefined);
        setFilterMonth("all");
        setFilterYear("all");
    };

    return (
        <div className="min-h-screen bg-[var(--po-bg)] pb-20">
            <Header />
            <NavTabs />

            <div className="max-w-6xl mx-auto px-4 space-y-4 sm:space-y-6">

                {/* ── Header Bar (Purple) ── */}
                <div className="bg-[#8b5cf6] text-white p-3 sm:p-4 rounded-lg sm:rounded-t-lg flex flex-col sm:flex-row items-center justify-between shadow-md gap-3 sm:gap-0">
                    <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5" />
                        <span className="font-bold text-center sm:text-left">รายการ PO ทั้งหมด (All PO List)</span>
                    </div>
                    <Button size="sm" className="bg-[#10b981] hover:bg-[#059669] text-white border-none w-full sm:w-auto shadow-sm">
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> <span className="truncate">บันทึกข้อมูลลง Google Sheet</span>
                    </Button>
                </div>

                {/* ── Filters ── */}
                <div className="bg-white p-4 rounded-lg sm:rounded-b-lg shadow-sm border border-gray-100 sm:border-t-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 items-end">
                    {/* Row 1: existing filters */}
                    <div className="col-span-1 sm:col-span-2">
                        <label className="text-xs text-gray-500 mb-1 block">ค้นหาแบบ (Type)</label>
                        <Select value={searchType} onValueChange={setSearchType}>
                            <SelectTrigger className="bg-gray-50 border-gray-200">
                                <SelectValue placeholder="ทั้งหมด" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทั้งหมด</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                        <label className="text-xs text-gray-500 mb-1 block">วันที่ (Date)</label>
                        <DatePickerInput date={filterDate} setDate={setFilterDate} />
                    </div>
                    <div className="col-span-1 sm:col-span-3">
                        <label className="text-xs text-gray-500 mb-1 block">เลข PO (Number)</label>
                        <Input placeholder="ค้นหาเลข PO..." value={filterPo} onChange={e => setFilterPo(e.target.value)} className="bg-gray-50 border-gray-200" />
                    </div>
                    <div className="col-span-1 sm:col-span-3">
                        <label className="text-xs text-gray-500 mb-1 block">ชื่อลูกค้า (Customer)</label>
                        <Input placeholder="ค้นหาลูกค้า..." value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)} className="bg-gray-50 border-gray-200" />
                    </div>
                    <div className="col-span-1 sm:col-span-2 md:col-span-2">
                        <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white shadow-sm" onClick={resetFilters}>
                            <RefreshCw className="mr-2 h-4 w-4" /> รีเซ็ต
                        </Button>
                    </div>

                    {/* Row 2: Month / Year filters */}
                    <div className="col-span-1 sm:col-span-2 md:col-span-6">
                        <label className="text-xs text-gray-500 mb-1 block">กรองตามเดือน (Month)</label>
                        <Select value={filterMonth} onValueChange={setFilterMonth}>
                            <SelectTrigger className="bg-gray-50 border-gray-200">
                                <SelectValue placeholder="ทุกเดือน" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกเดือน (All Months)</SelectItem>
                                {monthOptions.map(m => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="col-span-1 sm:col-span-2 md:col-span-6">
                        <label className="text-xs text-gray-500 mb-1 block">กรองตามปี (Year)</label>
                        <Select value={filterYear} onValueChange={setFilterYear}>
                            <SelectTrigger className="bg-gray-50 border-gray-200">
                                <SelectValue placeholder="ทุกปี" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกปี (All Years)</SelectItem>
                                {yearOptions.map(y => (
                                    <SelectItem key={y} value={y}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* ── PO List Cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {isLoading ? (
                        <div className="col-span-1 md:col-span-2 text-center py-10">
                            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                            <span className="text-gray-500 font-medium">Loading data...</span>
                        </div>
                    ) : filteredPos.length === 0 ? (
                        <div className="col-span-1 md:col-span-2 text-center py-10 text-gray-400 bg-white rounded-lg border border-dashed border-gray-200">
                            <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-20" />
                            ไม่พบรายการ (No POs found)
                        </div>
                    ) : (
                        filteredPos.map((po) => (
                            <div key={po.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-200 flex flex-col group">
                                {/* Card Header */}
                                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-3 flex justify-between items-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl -mr-4 -mt-4"></div>
                                    <div className="relative z-10">
                                        <div className="text-[10px] text-violet-200 uppercase tracking-wider font-semibold">เลข PO</div>
                                        <div className="font-bold font-mono tracking-tight text-lg">{formatPoNumber(po.poNumber)}</div>
                                    </div>
                                    <div className="text-right relative z-10">
                                        <div className="text-xl font-bold font-mono leading-none">{Number(po.grandTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        <div className="text-[10px] text-violet-200 opacity-90 mt-0.5">บาท (THB)</div>
                                    </div>
                                </div>
                                {/* Card Content */}
                                <div className="p-4 space-y-3 flex-1">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="bg-orange-50 p-2 rounded-lg border border-orange-100">
                                            <span className="text-orange-600/70 text-[10px] font-bold uppercase block mb-0.5">วันที่สั่งซื้อ</span>
                                            <span className="font-bold text-gray-800 text-xs sm:text-sm">{format(new Date(po.issueDate), "dd/MM/yyyy")}</span>
                                        </div>
                                        <div className="bg-red-50 p-2 rounded-lg border border-red-100 text-right">
                                            <span className="text-red-500/70 text-[10px] font-bold uppercase block mb-0.5">วันที่จัดส่ง</span>
                                            <span className="font-bold text-red-600 text-xs sm:text-sm">{format(new Date(po.deliveryDate), "dd/MM/yyyy")}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-2 sm:items-end">
                                        <div className="pt-1">
                                            <span className="text-gray-400 text-[10px] font-bold uppercase block mb-1">ลูกค้า (Customer)</span>
                                            <div className="font-semibold text-gray-800 text-sm line-clamp-1">{po.supplier.companyName}</div>
                                        </div>
                                        <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100 text-right sm:min-w-[160px]">
                                            <span className="text-emerald-600/70 text-[10px] font-bold uppercase block mb-0.5">วันที่ชำระ</span>
                                            <span className="font-bold text-emerald-700 text-xs sm:text-sm">{po.paymentDate ? format(new Date(po.paymentDate), "dd/MM/yyyy") : "-"}</span>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-100 pt-2 mt-2">
                                        <span className="text-gray-400 text-[10px] font-bold uppercase block mb-1">ตัวอย่างรายการสินค้า</span>
                                        <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-2 rounded-md">
                                            {po.items.slice(0, 3).map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center px-1">
                                                    <span className="truncate max-w-[70%]">- {item.product?.name || item.itemName || "Unknown"}</span>
                                                    <span className="font-mono text-gray-500">x{Number(item.quantity).toLocaleString()}</span>
                                                </div>
                                            ))}
                                            {po.items.length > 3 && <div className="text-[10px] text-center text-gray-400 italic pt-1">...และอื่นๆอีก {po.items.length - 3} รายการ</div>}
                                        </div>
                                    </div>
                                </div>
                                {/* Card Footer / Actions */}
                                <div className="bg-gray-50 p-3 grid grid-cols-3 gap-2 border-t border-gray-100">
                                    <Link href={`/purchase-orders/${po.id}`} className="w-full">
                                        <Button variant="outline" size="sm" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 h-8 text-xs font-semibold shadow-sm">
                                            <Eye className="w-3.5 h-3.5 mr-1" /> ดู
                                        </Button>
                                    </Link>
                                    <Link href={`/purchase-orders/create?edit=${po.id}`} className="w-full">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 h-8 text-xs font-semibold shadow-sm"
                                        >
                                            <Edit className="w-3.5 h-3.5 mr-1" /> แก้ไข
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 h-8 text-xs font-semibold shadow-sm"
                                        onClick={() => setPoToCancel(po.id)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5 mr-1" /> ลบ
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div >

            <AlertDialog open={!!poToCancel} onOpenChange={(open) => !open && setPoToCancel(null)}>
                <AlertDialogContent className="bg-white rounded-xl shadow-xl border-0 max-w-md">
                    <AlertDialogHeader className="flex flex-col items-center text-center space-y-4 pt-6">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
                            <Trash2 className="w-8 h-8 text-red-600" />
                        </div>
                        <AlertDialogTitle className="text-xl font-bold text-gray-900">
                            ยืนยันการลบรายการ?
                            <br />
                            <span className="text-sm font-normal text-gray-500">(Confirm Delete)</span>
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 text-base leading-relaxed max-w-sm mx-auto">
                            การกระทำนี้ไม่สามารถย้อนกลับได้ ข้อมูล PO จะถูก <span className="font-bold text-red-600">"ลบถาวร"</span>
                            <br />
                            <span className="text-xs text-gray-400 mt-1 block">
                                (This action cannot be undone. The PO will be permanently deleted.)
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex justify-center gap-3 sm:justify-center w-full pb-6 px-6">
                        <AlertDialogCancel className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 h-10 rounded-lg transition-all font-medium">
                            ไม่, เก็บไว้ (Keep it)
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancelPo}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0 h-10 rounded-lg shadow-md hover:shadow-lg transition-all font-bold"
                        >
                            ตกลง, ลบเลย (Yes, Delete)
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


        </div >
    );
}
