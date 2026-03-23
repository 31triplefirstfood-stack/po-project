"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Eye, Trash2, Search, FileSpreadsheet, RefreshCw, Factory, PlayCircle, Clock, Check, ChevronsUpDown } from "lucide-react";
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
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
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

interface PurchaseOrder {
    id: string;
    poNumber: string;
    issueDate: string;
    deliveryDate: string;
    grandTotal: number;
    supplier: {
        id: string;
        companyName: string;
    };
    items: {
        product: { name: string } | null;
        itemName?: string;
        quantity: number;
    }[];
    productionOrder: any;
}

export default function ProductionPage() {
    const [productions, setProductions] = useState<ProductionOrder[]>([]);
    const [filteredProductions, setFilteredProductions] = useState<ProductionOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [productionToDelete, setProductionToDelete] = useState<string | null>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [suppliers, setSuppliers] = useState<{id: string, companyName: string}[]>([]);
    const [customerComboboxOpen, setCustomerComboboxOpen] = useState(false);
    const [availablePOs, setAvailablePOs] = useState<PurchaseOrder[]>([]);
    // Removed availablePOs and selectedPO states

    const [filterStatus, setFilterStatus] = useState("all");
    const [filterDate, setFilterDate] = useState<Date | undefined>();
    const [filterSearch, setFilterSearch] = useState("");
    const [filterMonth, setFilterMonth] = useState("all");
    const [filterYear, setFilterYear] = useState("all");

    // Creation State
    const [creationMode, setCreationMode] = useState<"manual">("manual"); // Changed to only "manual"
    const [manualData, setManualData] = useState({
        poNumber: "",
        customerName: "",
        productName: "",
        quantity: 1
    });

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
            const data = await res.json();
            setProductions(data);
            setFilteredProductions(data);
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


    const fetchSuppliers = async () => {
        try {
            const res = await fetch("/api/suppliers");
            if (res.ok) {
                const data = await res.json();
                setSuppliers(data);
            }
        } catch (error) {
            console.error("Failed to fetch suppliers", error);
        }
    };

    useEffect(() => {
        fetchProductions();
        fetchSuppliers();
    }, []);

    useEffect(() => {
        let result = productions;
        
        if (filterStatus !== "all") {
            result = result.filter(prod => prod.status === filterStatus);
        }
        
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
    }, [productions, filterStatus, filterSearch, filterDate, filterMonth, filterYear]);

    const resetFilters = () => {
        setFilterStatus("all");
        setFilterSearch("");
        setFilterDate(undefined);
        setFilterMonth("all");
        setFilterYear("all");
    };

    const handleCreateProduction = async () => {
        if (!manualData.poNumber) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please enter a PO Number",
            });
            return;
        }

        try {
            const payload = { 
                manualPoNumber: manualData.poNumber,
                customerName: manualData.customerName,
                productName: manualData.productName,
                quantity: manualData.quantity
            };

            const res = await fetch("/api/production-orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create production order");
            }

            toast({
                title: "Success",
                description: "Production order created successfully",
            });
            setShowCreateDialog(false);
            setManualData({ poNumber: "", customerName: "", productName: "", quantity: 1 });
            fetchProductions();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Could not create production order",
            });
        }
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

    return (
        <div className="min-h-screen bg-[var(--po-bg)] pb-20">
            <Header />
            <NavTabs />

            <div className="max-w-6xl mx-auto px-4 space-y-4 sm:space-y-6">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-3 sm:p-4 rounded-lg sm:rounded-t-lg flex flex-col sm:flex-row items-center justify-between shadow-md gap-3 sm:gap-0">
                    <div className="flex items-center gap-2">
                        <Factory className="w-5 h-5" />
                        <span className="font-bold text-center sm:text-left">รายการการผลิต (Production Orders)</span>
                    </div>
                    <Button 
                        size="sm" 
                        className="bg-white hover:bg-gray-100 text-emerald-700 border-none w-full sm:w-auto shadow-sm font-bold"
                        onClick={() => {
                            setShowCreateDialog(true);
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" /> สร้างใบการผลิต
                    </Button>
                </div>

                <div className="bg-white p-4 rounded-lg sm:rounded-b-lg shadow-sm border border-gray-100 sm:border-t-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 items-end">
                    <div className="col-span-1 sm:col-span-2">
                        <label className="text-xs text-gray-500 mb-1 block">สถานะ (Status)</label>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="bg-gray-50 border-gray-200">
                                <SelectValue placeholder="ทั้งหมด" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทั้งหมด (All)</SelectItem>
                                <SelectItem value="PENDING">รอผลิต</SelectItem>
                                <SelectItem value="IN_PROGRESS">กำลังผลิต</SelectItem>
                                <SelectItem value="COMPLETED">เสร็จสิ้น</SelectItem>
                                <SelectItem value="PROBLEM">มีปัญหา</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                        <label className="text-xs text-gray-500 mb-1 block">วันที่ (Date)</label>
                        <DatePickerInput date={filterDate} setDate={setFilterDate} />
                    </div>
                    <div className="col-span-1 sm:col-span-3">
                        <label className="text-xs text-gray-500 mb-1 block">ค้นหา (Search)</label>
                        <Input placeholder="เลข PROD, PO, ลูกค้า..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} className="bg-gray-50 border-gray-200" />
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
                    <div className="col-span-1 sm:col-span-2 md:col-span-2">
                        <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white shadow-sm" onClick={resetFilters}>
                            <RefreshCw className="mr-2 h-4 w-4" /> รีเซ็ต
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {isLoading ? (
                        <div className="col-span-1 md:col-span-2 text-center py-10">
                            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" />
                            <span className="text-gray-500 font-medium">Loading data...</span>
                        </div>
                    ) : filteredProductions.length === 0 ? (
                        <div className="col-span-1 md:col-span-2 text-center py-10 text-gray-400 bg-white rounded-lg border border-dashed border-gray-200">
                            <Factory className="w-10 h-10 mx-auto mb-2 opacity-20" />
                            ไม่พบรายการ (No production orders found)
                        </div>
                    ) : (
                        filteredProductions.map((prod) => {
                            const totalQty = prod.purchaseOrder 
                                ? prod.purchaseOrder.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
                                : Number(prod.quantity || 0);

                            return (
                                <div key={prod.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-200 flex flex-col group">
                                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-3 flex justify-between items-center relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl -mr-4 -mt-4"></div>
                                        <div className="relative z-10">
                                            <div className="text-[10px] text-emerald-200 uppercase tracking-wider font-semibold">เลขการผลิต</div>
                                            <div className="font-bold font-mono tracking-tight text-base">{prod.id}</div>
                                        </div>
                                        <div className="text-right relative z-10">
                                            <div className="text-xl font-bold font-mono leading-none">{totalQty.toLocaleString()}</div>
                                            <div className="text-[10px] text-emerald-200 opacity-90 mt-0.5">จำนวนผลิตทั้งหมด</div>
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-3 flex-1">
                                        <div className="flex justify-between items-center">
                                            <div className="bg-violet-50 p-2 rounded-lg border border-violet-100 flex-1 mr-2">
                                                <span className="text-violet-600/70 text-[10px] font-bold uppercase block mb-0.5">เลข PO อ้างอิง</span>
                                                <span className="font-bold text-gray-800 text-sm">
                                                    {prod.purchaseOrder ? formatPoNumber(prod.purchaseOrder.poNumber) : prod.poNumber || "-"}
                                                </span>
                                            </div>
                                            <div>
                                                {getStatusBadge(prod.status)}
                                            </div>
                                        </div>

                                        {prod.purchaseOrder ? (
                                            <>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div className="bg-orange-50 p-2 rounded-lg border border-orange-100">
                                                        <span className="text-orange-600/70 text-[10px] font-bold uppercase block mb-0.5">วันที่สั่ง</span>
                                                        <span className="font-bold text-gray-800 text-xs">{format(new Date(prod.purchaseOrder.issueDate), "dd/MM/yyyy")}</span>
                                                    </div>
                                                    <div className="bg-red-50 p-2 rounded-lg border border-red-100 text-right">
                                                        <span className="text-red-500/70 text-[10px] font-bold uppercase block mb-0.5">วันส่ง</span>
                                                        <span className="font-bold text-red-600 text-xs">{format(new Date(prod.purchaseOrder.deliveryDate), "dd/MM/yyyy")}</span>
                                                    </div>
                                                </div>

                                                <div className="pt-1">
                                                    <span className="text-gray-400 text-[10px] font-bold uppercase block mb-1">ลูกค้า (Customer)</span>
                                                    <div className="font-semibold text-gray-800 text-sm line-clamp-1">{prod.purchaseOrder.supplier.companyName}</div>
                                                </div>

                                                <div className="border-t border-gray-100 pt-2 mt-2">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-gray-400 text-[10px] font-bold uppercase">รายการสินค้า</span>
                                                        <span className="text-[10px] font-bold text-emerald-600 uppercase">รวม: {totalQty.toLocaleString()}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-2 rounded-md">
                                                        {prod.purchaseOrder.items.slice(0, 3).map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-center px-1">
                                                                <span className="truncate max-w-[70%]">- {item.product?.name || item.itemName || "Unknown"}</span>
                                                                <span className="font-mono text-gray-500">x{Number(item.quantity).toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                        {prod.purchaseOrder.items.length > 3 && <div className="text-[10px] text-center text-gray-400 italic pt-1">...และอื่นๆอีก {prod.purchaseOrder.items.length - 3} รายการ</div>}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="pt-1">
                                                    <span className="text-gray-400 text-[10px] font-bold uppercase block mb-1">ลูกค้า (Customer)</span>
                                                    <div className="font-semibold text-gray-800 text-sm line-clamp-1">{prod.customerName || "-"}</div>
                                                </div>

                                                <div className="border-t border-gray-100 pt-2 mt-2">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-gray-400 text-[10px] font-bold uppercase">รายการผลิต</span>
                                                        <span className="text-[10px] font-bold text-emerald-600 uppercase">รวม: {totalQty.toLocaleString()}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-2 rounded-md">
                                                        <div className="flex justify-between items-center px-1">
                                                            <span className="truncate max-w-[70%]">- {prod.productName || "เส้น 50 กิโล"}</span>
                                                            <span className="font-bold text-emerald-600">x{Number(prod.quantity || 1).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                <div className="bg-gray-50 p-3 grid grid-cols-3 gap-2 border-t border-gray-100">
                                    <Link href={`/production/${prod.id}`} className="w-full">
                                        <Button variant="outline" size="sm" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 h-8 text-xs font-semibold shadow-sm">
                                            <Eye className="w-3.5 h-3.5 mr-1" /> ดู
                                        </Button>
                                    </Link>
                                    {prod.status === "PENDING" && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 h-8 text-xs font-semibold shadow-sm"
                                            onClick={() => handleUpdateStatus(prod.id, "IN_PROGRESS")}
                                        >
                                            <PlayCircle className="w-3.5 h-3.5 mr-1" /> เริ่ม
                                        </Button>
                                    )}
                                    {prod.status === "IN_PROGRESS" && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 h-8 text-xs font-semibold shadow-sm"
                                            onClick={() => handleUpdateStatus(prod.id, "COMPLETED")}
                                        >
                                            <Clock className="w-3.5 h-3.5 mr-1" /> เสร็จ
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 h-8 text-xs font-semibold shadow-sm"
                                        onClick={() => setProductionToDelete(prod.id)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5 mr-1" /> ลบ
                                    </Button>
                                </div>
                            </div>
                            );
                        })
                    )}
                </div>
            </div>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>สร้างใบการผลิต (Create Production Order)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">เลขที่ PO</label>
                                <Input 
                                    placeholder="เช่น PO-2024-001" 
                                    value={manualData.poNumber} 
                                    onChange={e => setManualData({...manualData, poNumber: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">ชื่อลูกค้า / บริษัท</label>
                                <Popover open={customerComboboxOpen} onOpenChange={setCustomerComboboxOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={customerComboboxOpen}
                                            className="w-full justify-between font-normal bg-white border-gray-200"
                                        >
                                            {manualData.customerName || <span className="text-muted-foreground">ระบุชื่อลูกค้า หรือเลือกจากรายการ...</span>}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white" align="start">
                                        <Command>
                                            <CommandInput 
                                                placeholder="พิมพ์ชื่อลูกค้าใหม่ หรือค้นหา..." 
                                                className="h-9"
                                                onValueChange={(val) => setManualData({...manualData, customerName: val})}
                                            />
                                            <CommandList>
                                                <CommandEmpty>พิมพ์ชื่อเพื่อใช้งานชื่อใหม่ได้เลย</CommandEmpty>
                                                <CommandGroup heading="รายชื่อลูกค้าเดิม">
                                                    {suppliers.map((s) => (
                                                        <CommandItem
                                                            key={s.id}
                                                            value={s.companyName}
                                                            onSelect={(currentValue) => {
                                                                setManualData({
                                                                    ...manualData, 
                                                                    customerName: currentValue === manualData.customerName ? "" : currentValue
                                                                });
                                                                setCustomerComboboxOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    manualData.customerName === s.companyName ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {s.companyName}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <label className="text-sm font-medium mb-1 block">รายการผลิต</label>
                                    <Input 
                                        placeholder="ระบุรายการสินค้า..."
                                        value={manualData.productName} 
                                        onChange={e => setManualData({...manualData, productName: e.target.value})}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-sm font-medium mb-1 block">จำนวน (ชุด/กระสอบ)</label>
                                    <Input 
                                        type="number"
                                        placeholder="ระบุจำนวน..."
                                        value={manualData.quantity} 
                                        onChange={e => setManualData({...manualData, quantity: Number(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                                <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                                    * ระบบจะหักวัตถุดิบ (แป้ง) อัตโนมัติเมื่อกดเสร็จสิ้น โดยใช้สูตร: <br/>
                                    <span className="font-bold underline">จำนวน x (14.24 * 78) / 22.5</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            ยกเลิก
                        </Button>
                        <Button onClick={handleCreateProduction} className="bg-emerald-600 hover:bg-emerald-700">
                            สร้าง
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                    <AlertDialogFooter className="flex justify-center gap-3 sm:justify-center w-full pb-6 px-6">
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
