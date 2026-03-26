"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Eye, Trash2, RefreshCw, Factory, PlayCircle, Clock, Edit } from "lucide-react";
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
import Header from "@/components/Header";
import NavTabs from "@/components/NavTabs";
import { cn, formatPoNumber } from "@/lib/utils";

function DatePickerInput({ date, setDate }: { date: Date | undefined, setDate: (d: Date | undefined) => void }) {
    return <Input type="date" value={date ? format(date, "yyyy-MM-dd") : ""} onChange={(e) => setDate(e.target.value ? new Date(e.target.value) : undefined)} />;
}

interface ProductionOrder {
    id: string;
    status: string;
    problemNote: string | null;
    extraRequestQty: number | null;
    stockDeducted: boolean;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    purchaseOrder?: {
        id: string;
        poNumber: string;
        issueDate: string;
        deliveryDate: string;
        grandTotal: number;
        supplier: {
            companyName: string;
        };
        items: {
            product: { name: string } | null;
            itemName?: string;
            quantity: number;
        }[];
    } | null;
    poNumber?: string | null;
    customerName?: string | null;
    productName?: string | null;
    quantity?: number | null;
}

export default function ProductionPage() {
    const [productions, setProductions] = useState<ProductionOrder[]>([]);
    const [filteredProductions, setFilteredProductions] = useState<ProductionOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [productionToDelete, setProductionToDelete] = useState<string | null>(null);

    const [filterDate, setFilterDate] = useState<Date | undefined>();
    const [filterSearch, setFilterSearch] = useState("");
    const [filterMonth, setFilterMonth] = useState("all");
    const [filterYear, setFilterYear] = useState("all");

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

    const fetchProductions = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/production-orders");
            if (!res.ok) throw new Error("Failed to fetch production orders");
            const data: ProductionOrder[] = await res.json();
            
            // Only keep PENDING and IN_PROGRESS
            const activeProductions = data.filter(p => p.status === "PENDING" || p.status === "IN_PROGRESS");
            setProductions(activeProductions);
            setFilteredProductions(activeProductions);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not load production orders.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProductions();
    }, []);

    useEffect(() => {
        let result = productions;
        
        if (filterSearch) {
            result = result.filter(prod => 
                prod.id.toLowerCase().includes(filterSearch.toLowerCase()) ||
                (prod.purchaseOrder && formatPoNumber(prod.purchaseOrder.poNumber).toLowerCase().includes(filterSearch.toLowerCase())) ||
                (prod.purchaseOrder && prod.purchaseOrder.supplier.companyName.toLowerCase().includes(filterSearch.toLowerCase())) ||
                (prod.poNumber && prod.poNumber.toLowerCase().includes(filterSearch.toLowerCase())) ||
                (prod.customerName && prod.customerName.toLowerCase().includes(filterSearch.toLowerCase()))
            );
        }
        
        if (filterDate) {
            const dateStr = format(filterDate, "yyyy-MM-dd");
            result = result.filter(prod => prod.createdAt.startsWith(dateStr));
        }
        
        if (filterYear !== "all") {
            result = result.filter(prod => new Date(prod.createdAt).getFullYear() === Number(filterYear));
        }
        
        if (filterMonth !== "all") {
            result = result.filter(prod => (new Date(prod.createdAt).getMonth() + 1) === Number(filterMonth));
        }
        
        setFilteredProductions(result);
    }, [productions, filterSearch, filterDate, filterMonth, filterYear]);

    const resetFilters = () => {
        setFilterSearch("");
        setFilterDate(undefined);
        setFilterMonth("all");
        setFilterYear("all");
    };

    const handleDeleteProduction = async () => {
        if (!productionToDelete) return;
        try {
            const res = await fetch(`/api/production-orders/${productionToDelete}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to delete production order");
            }

            toast({
                title: "Success",
                description: "Production order deleted successfully",
            });
            fetchProductions();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Could not delete production order",
            });
        } finally {
            setProductionToDelete(null);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/production-orders/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to update status");
            }

            toast({
                title: "Success",
                description: "Status updated successfully",
            });
            fetchProductions();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Could not update status",
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            PENDING: { label: "รอผลิต", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
            IN_PROGRESS: { label: "กำลังผลิต", color: "bg-blue-100 text-blue-700 border-blue-200" },
            COMPLETED: { label: "เสร็จสิ้น", color: "bg-green-100 text-green-700 border-green-200" },
            PROBLEM: { label: "มีปัญหา", color: "bg-red-100 text-red-700 border-red-200" },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
        return (
            <span className={cn("px-3 py-1 rounded-full text-xs font-bold border", config.color)}>
                {config.label}
            </span>
        );
    };

    const formatProdNumber = (id: string, dateStr: string) => {
        const date = new Date(dateStr);
        const beYear = date.getFullYear() + 543;
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const suffix = id.slice(-3).toUpperCase();
        return `PROD-${beYear}${mm}${dd}-${suffix}`;
    };

    const renderCard = (prod: ProductionOrder) => {
        const totalQty = prod.purchaseOrder 
            ? prod.purchaseOrder.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
            : Number(prod.quantity || 0);

        // Standard Ingredients Calculation
        const scalingFactor = totalQty / 78;
        const ingredients = [
            { name: "แป้ง", qty: (22.5 * scalingFactor).toLocaleString(undefined, { maximumFractionDigits: 1 }) },
            { name: "สีผสมอาหาร", qty: (3 * scalingFactor).toLocaleString(undefined, { maximumFractionDigits: 1 }) },
        ];

        const issueDate = prod.purchaseOrder?.issueDate ? new Date(prod.purchaseOrder.issueDate) : new Date(prod.createdAt);
        const deliveryDate = prod.purchaseOrder?.deliveryDate ? new Date(prod.purchaseOrder.deliveryDate) : new Date(prod.createdAt);

        return (
            <div key={prod.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-200 flex flex-col group mb-4">
                {/* ── CARD HEADER ── */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-3 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl -mr-4 -mt-4"></div>
                    <div className="relative z-10">
                        <div className="text-[10px] text-teal-100 uppercase tracking-wider font-semibold">เลขการผลิต</div>
                        <div className="font-bold font-mono tracking-tight text-lg">{formatProdNumber(prod.id, prod.createdAt)}</div>
                    </div>
                    <div className="text-right relative z-10">
                        <div className="text-xl font-bold font-mono leading-none">{totalQty.toLocaleString()}</div>
                        <div className="text-[10px] text-teal-100 opacity-90 mt-0.5">จำนวนผลิต</div>
                    </div>
                </div>

                {/* ── CARD CONTENT ── */}
                <div className="p-4 space-y-3 flex-1">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-orange-50 p-2 rounded-lg border border-orange-100">
                            <span className="text-orange-600/70 text-[10px] font-bold uppercase block mb-0.5">วันที่สั่งซื้อ</span>
                            <span className="font-bold text-gray-800 text-xs sm:text-sm">{format(issueDate, "dd/MM/yyyy")}</span>
                        </div>
                        <div className="bg-red-50 p-2 rounded-lg border border-red-100 text-right">
                            <span className="text-red-500/70 text-[10px] font-bold uppercase block mb-0.5">วันที่จัดส่ง</span>
                            <span className="font-bold text-red-600 text-xs sm:text-sm">{format(deliveryDate, "dd/MM/yyyy")}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-2 sm:items-end">
                        <div className="pt-1">
                            <span className="text-gray-400 text-[10px] font-bold uppercase block mb-1">ลูกค้า (Customer)</span>
                            <div className="font-semibold text-gray-800 text-sm line-clamp-1">{prod.purchaseOrder?.supplier.companyName || prod.customerName || "-"}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className={cn(
                                "px-3 py-1 rounded-md text-xs font-bold border", 
                                prod.status === "PENDING" ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-blue-100 text-blue-700 border-blue-200"
                            )}>
                                {prod.status === "PENDING" ? "รอการผลิต" : "กำลังผลิต"}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-2 mt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-gray-400 text-[10px] font-bold uppercase block mb-1">ตัวอย่างรายการ</span>
                                <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-2 rounded-md">
                                    {prod.purchaseOrder ? (
                                        prod.purchaseOrder.items.slice(0, 2).map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center px-1">
                                                <span className="truncate max-w-[70%]">- {item.product?.name || item.itemName}</span>
                                                <span className="font-mono text-gray-500">x{Number(item.quantity).toLocaleString()}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex justify-between items-center px-1">
                                            <span className="truncate max-w-[70%]">- {prod.productName || "เส้น 50 กิโล"}</span>
                                            <span className="font-mono text-gray-500">x{Number(prod.quantity || 0).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-400 text-[10px] font-bold uppercase block mb-1 text-right">จำนวนวัตถุดิบ</span>
                                <div className="text-xs text-red-600 space-y-1 bg-red-50/50 p-2 rounded-md">
                                    {ingredients.map((ing, idx) => (
                                        <div key={idx} className="flex justify-between items-center px-1">
                                            <span className="text-gray-500 font-semibold">{ing.name}</span>
                                            <span className="font-mono font-bold">{ing.qty}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── CARD FOOTER / ACTIONS ── */}
                <div className="bg-gray-50 p-3 flex flex-col gap-2 border-t border-gray-100">
                    <Button 
                        size="sm" 
                        className={cn(
                            "w-full h-9 font-bold shadow-sm transition-all active:scale-[0.98]",
                            prod.status === "PENDING" 
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                        )}
                        onClick={() => handleUpdateStatus(prod.id, prod.status === "PENDING" ? "IN_PROGRESS" : "COMPLETED")}
                    >
                        {prod.status === "PENDING" ? (
                            <><PlayCircle className="w-4 h-4 mr-2" /> เริ่มการผลิต</>
                        ) : (
                            <><RefreshCw className="w-4 h-4 mr-2" /> ผลิตเสร็จสิ้น</>
                        )}
                    </Button>

                    <div className="grid grid-cols-3 gap-2">
                        <Link href={`/production/${prod.id}/pdf`} className="w-full">
                            <Button variant="outline" size="sm" className="w-full border-gray-200 text-gray-700 hover:bg-white hover:text-blue-600 h-8 text-xs font-semibold shadow-sm">
                                <Eye className="w-3.5 h-3.5 mr-1" /> ดู
                            </Button>
                        </Link>
                        
                        <Link href={prod.purchaseOrder ? `/purchase-orders/create?edit=${prod.purchaseOrder.id}` : "#"} className="w-full">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full border-gray-200 text-gray-700 hover:bg-white hover:text-amber-600 h-8 text-xs font-semibold shadow-sm"
                            >
                                <Edit className="w-3.5 h-3.5 mr-1" /> แก้ไข
                            </Button>
                        </Link>

                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-700 h-8 text-xs font-semibold shadow-sm"
                            onClick={() => setProductionToDelete(prod.id)}
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> ลบ
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    const pendingList = filteredProductions.filter(p => p.status === "PENDING");
    const inProgressList = filteredProductions.filter(p => p.status === "IN_PROGRESS");

    return (
        <div className="min-h-screen bg-[var(--po-bg)] pb-20">
            <Header />
            <NavTabs />

            <div className="max-w-6xl mx-auto px-4 space-y-4 sm:space-y-6">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-3 sm:p-4 rounded-lg shadow-md flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Factory className="w-5 h-5" />
                        <span className="font-bold text-center sm:text-left text-lg">รายการคิวผลิต</span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 items-end">
                    <div className="col-span-1 sm:col-span-3">
                        <label className="text-xs text-gray-500 mb-1 block">ค้นหา (Search)</label>
                        <Input placeholder="เลข PROD, PO, ลูกค้า..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} className="bg-gray-50 border-gray-200" />
                    </div>
                    <div className="col-span-1 sm:col-span-3">
                        <label className="text-xs text-gray-500 mb-1 block">วันที่ (Date)</label>
                        <DatePickerInput date={filterDate} setDate={setFilterDate} />
                    </div>
                    <div className="col-span-1 sm:col-span-3">
                        <label className="text-xs text-gray-500 mb-1 block">เดือน (Month)</label>
                        <Select value={filterMonth} onValueChange={setFilterMonth}>
                            <SelectTrigger className="bg-gray-50 border-gray-200">
                                <SelectValue placeholder="ทุกเดือน" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกเดือน</SelectItem>
                                {monthOptions.map(m => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="col-span-1 sm:col-span-3 flex gap-2">
                        <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white shadow-sm" onClick={resetFilters}>
                            <RefreshCw className="mr-2 h-4 w-4" /> รีเซ็ต
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start">
                    {/* ขาซ้าย: รอผลิต */}
                    <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2 shadow-sm">
                            <Clock className="w-5 h-5 text-yellow-600" />
                            <h2 className="text-yellow-800 font-bold text-lg">รอผลิต (Pending)</h2>
                            <span className="bg-yellow-200 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full ml-auto">
                                {pendingList.length} รายการ
                            </span>
                        </div>
                        {isLoading ? (
                            <div className="text-center py-6 text-yellow-600 opacity-50"><RefreshCw className="animate-spin h-5 w-5 mx-auto" /></div>
                        ) : pendingList.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 bg-white rounded-lg border border-dashed border-gray-200 backdrop-blur-sm">
                                ไม่มีคิวรอผลิต
                            </div>
                        ) : (
                            pendingList.map(renderCard)
                        )}
                    </div>

                    {/* ขาขวา: กำลังผลิต */}
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2 shadow-sm">
                            <PlayCircle className="w-5 h-5 text-blue-600" />
                            <h2 className="text-blue-800 font-bold text-lg">กำลังผลิต (In Progress)</h2>
                            <span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-1 rounded-full ml-auto">
                                {inProgressList.length} รายการ
                            </span>
                        </div>
                        {isLoading ? (
                            <div className="text-center py-6 text-blue-600 opacity-50"><RefreshCw className="animate-spin h-5 w-5 mx-auto" /></div>
                        ) : inProgressList.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 bg-white rounded-lg border border-dashed border-gray-200 backdrop-blur-sm">
                                ไม่มีกําลังผลิต
                            </div>
                        ) : (
                            inProgressList.map(renderCard)
                        )}
                    </div>
                </div>
            </div>

            <AlertDialog open={!!productionToDelete} onOpenChange={(open) => !open && setProductionToDelete(null)}>
                <AlertDialogContent className="bg-white rounded-xl shadow-xl border-0 max-w-md">
                    <AlertDialogHeader className="flex flex-col items-center text-center space-y-4 pt-6">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
                            <Trash2 className="w-8 h-8 text-red-600" />
                        </div>
                        <AlertDialogTitle className="text-xl font-bold text-gray-900">
                            ยืนยันการลบรายการ?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 text-base leading-relaxed max-w-sm mx-auto">
                            การกระทำนี้ไม่สามารถย้อนกลับได้
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex justify-center gap-3 w-full pb-6 px-6">
                        <AlertDialogCancel className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 h-10 rounded-lg transition-all font-medium">
                            ยกเลิก
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteProduction}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0 h-10 rounded-lg shadow-md hover:shadow-lg transition-all font-bold"
                        >
                            ลบ
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
