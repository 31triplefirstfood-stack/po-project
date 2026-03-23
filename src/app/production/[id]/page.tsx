"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Factory, FileText, Package, Clock, CheckCircle, AlertTriangle, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import NavTabs from "@/components/NavTabs";
import { cn, formatPoNumber } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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
        subtotal: number;
        vatAmount: number;
        discountAmount: number;

        notes: string | null;
        supplier: {
            companyName: string;
            contactPerson: string | null;
            phone: string | null;
            address: string | null;
        };
        user: {
            name: string;
        };
        items: {
            id: string;
            product: { 
                name: string;
                sku: string;
                unit: string;
            } | null;
            itemName?: string;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
        }[];
    } | null;
    poNumber?: string | null;
    customerName?: string | null;
    productName?: string | null;
    quantity?: number | null;
}

export default function ProductionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [production, setProduction] = useState<ProductionOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState("");
    const [problemNote, setProblemNote] = useState("");

    const fetchProduction = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/production-orders/${params.id}`);
            if (!res.ok) throw new Error("Failed to fetch production order");
            const data = await res.json();
            setProduction(data);
            setStatus(data.status);
            setProblemNote(data.problemNote || "");
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not load production order.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) {
            fetchProduction();
        }
    }, [params.id]);

    const handleUpdateStatus = async () => {
        try {
            const res = await fetch(`/api/production-orders/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    status,
                    ...(status === "PROBLEM" && { problemNote })
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to update");
            }

            toast({
                title: "Success",
                description: "Production order updated successfully",
            });
            fetchProduction();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Could not update production order",
            });
        }
    };

    const getStatusConfig = (status: string) => {
        const configs = {
            PENDING: { 
                label: "รอผลิต", 
                color: "bg-yellow-100 text-yellow-700 border-yellow-200",
                icon: Clock,
                gradient: "from-yellow-500 to-amber-500"
            },
            IN_PROGRESS: { 
                label: "กำลังผลิต", 
                color: "bg-blue-100 text-blue-700 border-blue-200",
                icon: PlayCircle,
                gradient: "from-blue-500 to-indigo-500"
            },
            COMPLETED: { 
                label: "เสร็จสิ้น", 
                color: "bg-green-100 text-green-700 border-green-200",
                icon: CheckCircle,
                gradient: "from-green-500 to-emerald-500"
            },
            PROBLEM: { 
                label: "มีปัญหา", 
                color: "bg-red-100 text-red-700 border-red-200",
                icon: AlertTriangle,
                gradient: "from-red-500 to-rose-500"
            },
        };
        return configs[status as keyof typeof configs] || configs.PENDING;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--po-bg)]">
                <Header />
                <NavTabs />
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <Factory className="w-12 h-12 animate-spin mx-auto text-emerald-500 mb-4" />
                        <p className="text-gray-500">Loading production order...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!production) {
        return (
            <div className="min-h-screen bg-[var(--po-bg)]">
                <Header />
                <NavTabs />
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                        <p className="text-gray-500">Production order not found</p>
                        <Button onClick={() => router.push("/production")} className="mt-4">
                            กลับไปหน้ารายการ
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const statusConfig = getStatusConfig(production.status);
    const StatusIcon = statusConfig.icon;

    return (
        <div className="min-h-screen bg-[var(--po-bg)] pb-20">
            <Header />
            <NavTabs />

            <div className="max-w-5xl mx-auto px-4 space-y-6">
                <Button
                    variant="outline"
                    onClick={() => router.push("/production")}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    กลับไปหน้ารายการ
                </Button>

                {(() => {
                    const totalQty = production.purchaseOrder 
                        ? production.purchaseOrder.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
                        : Number(production.quantity || 0);

                    return (
                        <div className={cn("bg-gradient-to-r text-white p-6 rounded-xl shadow-lg", statusConfig.gradient)}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <Factory className="w-8 h-8" />
                                        <div>
                                            <div className="text-sm opacity-90">เลขที่การผลิต</div>
                                            <div className="text-2xl font-bold font-mono">{production.id}</div>
                                        </div>
                                    </div>
                                    <div className="h-10 w-px bg-white/20 mx-2 hidden sm:block"></div>
                                    <div className="hidden sm:block">
                                        <div className="text-sm opacity-90">จำนวนผลิตทั้งหมด</div>
                                        <div className="text-2xl font-bold font-mono">{totalQty.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                                        <StatusIcon className="w-5 h-5" />
                                        <span className="font-bold">{statusConfig.label}</span>
                                    </div>
                                    <div className="sm:hidden text-right">
                                        <div className="text-[10px] opacity-80 uppercase font-bold">จำนวนผลิตทั้งหมด</div>
                                        <div className="text-lg font-bold font-mono">{totalQty.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-violet-600" />
                            <h2 className="text-lg font-bold text-gray-800">ข้อมูล PO อ้างอิง</h2>
                        </div>
                        <div className="space-y-3">
                            <div className="bg-violet-50 p-3 rounded-lg border border-violet-100">
                                <div className="text-xs text-violet-600 font-semibold mb-1">เลข PO</div>
                                <div className="font-bold text-gray-800">
                                    {production.purchaseOrder ? formatPoNumber(production.purchaseOrder.poNumber) : production.poNumber || "-"}
                                </div>
                            </div>
                            {production.purchaseOrder ? (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                            <div className="text-xs text-orange-600 font-semibold mb-1">วันที่สั่ง</div>
                                            <div className="font-bold text-gray-800 text-sm">
                                                {format(new Date(production.purchaseOrder.issueDate), "dd/MM/yyyy")}
                                            </div>
                                        </div>
                                        <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                            <div className="text-xs text-red-600 font-semibold mb-1">วันส่ง</div>
                                            <div className="font-bold text-red-600 text-sm">
                                                {format(new Date(production.purchaseOrder.deliveryDate), "dd/MM/yyyy")}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <div className="text-xs text-gray-600 font-semibold mb-1">ลูกค้า</div>
                                        <div className="font-bold text-gray-800">{production.purchaseOrder.supplier.companyName}</div>
                                        {production.purchaseOrder.supplier.contactPerson && (
                                            <div className="text-sm text-gray-600 mt-1">ผู้ติดต่อ: {production.purchaseOrder.supplier.contactPerson}</div>
                                        )}
                                        {production.purchaseOrder.supplier.phone && (
                                            <div className="text-sm text-gray-600">โทร: {production.purchaseOrder.supplier.phone}</div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <div className="text-xs text-gray-600 font-semibold mb-1">ลูกค้า</div>
                                    <div className="font-bold text-gray-800">{production.customerName || "-"}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                            <Factory className="w-5 h-5 text-emerald-600" />
                            <h2 className="text-lg font-bold text-gray-800">จัดการสถานะ</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">สถานะการผลิต</label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PENDING">รอผลิต</SelectItem>
                                        <SelectItem value="IN_PROGRESS">กำลังผลิต</SelectItem>
                                        <SelectItem value="COMPLETED">เสร็จสิ้น</SelectItem>
                                        <SelectItem value="PROBLEM">มีปัญหา</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {status === "PROBLEM" && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">หมายเหตุปัญหา</label>
                                    <Textarea
                                        value={problemNote}
                                        onChange={(e) => setProblemNote(e.target.value)}
                                        placeholder="ระบุปัญหาที่พบ..."
                                        rows={3}
                                    />
                                </div>
                            )}

                            <Button 
                                onClick={handleUpdateStatus}
                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                            >
                                บันทึกการเปลี่ยนแปลง
                            </Button>

                            {production.startedAt && (
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <div className="text-xs text-blue-600 font-semibold mb-1">เริ่มผลิตเมื่อ</div>
                                    <div className="text-sm text-gray-800">
                                        {format(new Date(production.startedAt), "dd/MM/yyyy HH:mm")}
                                    </div>
                                </div>
                            )}

                            {production.completedAt && (
                                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                    <div className="text-xs text-green-600 font-semibold mb-1">เสร็จสิ้นเมื่อ</div>
                                    <div className="text-sm text-gray-800">
                                        {format(new Date(production.completedAt), "dd/MM/yyyy HH:mm")}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                        <Package className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-800">รายการสินค้า / วัตถุดิบ</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">รายการ</th>
                                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">SKU</th>
                                    <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">จำนวน</th>
                                    <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">หน่วย</th>
                                    <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">ราคา/หน่วย</th>
                                    <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">รวม</th>
                                </tr>
                            </thead>
                            <tbody>
                                {production.purchaseOrder ? (
                                    production.purchaseOrder.items.map((item, idx) => (
                                        <tr key={item.id} className={cn("border-b border-gray-100", idx % 2 === 0 ? "bg-gray-50" : "bg-white")}>
                                            <td className="py-3 px-4 text-sm text-gray-800">
                                                {item.product?.name || item.itemName || "Unknown"}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                                                {item.product?.sku || "-"}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right font-bold text-gray-800">
                                                {Number(item.quantity).toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right text-gray-600">
                                                {item.product?.unit || "-"}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right text-gray-600 font-mono">
                                                {Number(item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right font-bold text-gray-800 font-mono">
                                                {Number(item.totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <td className="py-3 px-4 text-sm text-gray-800 font-bold">
                                            {production.productName || "เส้น 50 กิโล"}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                                            -
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right font-bold text-emerald-600">
                                            {Number(production.quantity || 1).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right text-gray-600">
                                            ชุด/กระสอบ
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right text-gray-600 font-mono">
                                            -
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right font-bold text-gray-800 font-mono">
                                            -
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-gray-100 font-bold">
                                <tr>
                                    <td colSpan={5} className="py-3 px-4 text-right text-sm">รวมทั้งหมด:</td>
                                    <td className="py-3 px-4 text-right text-lg text-emerald-700 font-mono">
                                        {production.purchaseOrder 
                                            ? `฿${Number(production.purchaseOrder.grandTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                            : "-"
                                        }
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {production.purchaseOrder?.notes && (
                    <div className="bg-amber-50 rounded-xl shadow-sm p-6 border border-amber-200">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                            <h3 className="font-bold text-amber-800">หมายเหตุจาก PO</h3>
                        </div>
                        <p className="text-gray-700 text-sm">{production.purchaseOrder.notes}</p>
                    </div>
                )}

                {production.problemNote && (
                    <div className="bg-red-50 rounded-xl shadow-sm p-6 border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <h3 className="font-bold text-red-800">ปัญหาที่พบ</h3>
                        </div>
                        <p className="text-gray-700 text-sm">{production.problemNote}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
