"use client";

import { useEffect, useState } from "react";
import { ClipboardMinus, FileText, Package, Plus, Receipt, Trash2, Warehouse } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import NavTabs from "@/components/NavTabs";
import { StockItemModal } from "@/components/StockItemModal";
import { GlobalRestockModal } from "@/components/GlobalRestockModal";
import { GlobalUsageModal } from "@/components/GlobalUsageModal";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface StockItem {
    id: string;
    name: string;
    imageUrl: string | null;
    unit: string;
    currentQty: number;
    createdAt: string;
    updatedAt: string;
    restocks: any[];
    _count: {
        restocks: number;
        usages: number;
    };
}

export default function StockPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<StockItem | undefined>(undefined);
    const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
    const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);

    const fetchStockItems = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/stock");
            if (res.ok) {
                setStockItems(await res.json());
            }
        } catch (error) {
            console.error("Failed to fetch stock items", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStockItems();
    }, []);

    const handleAddNew = () => {
        setEditingItem(undefined);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(undefined);
    };

    const handleDeleteItem = async (item: StockItem) => {
        const isConfirmed = window.confirm(`ต้องการลบวัตถุดิบ "${item.name}" ใช่หรือไม่?`);
        if (!isConfirmed) return;

        try {
            const res = await fetch(`/api/stock/${item.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const json = await res.json().catch(() => null);
                throw new Error(json?.error || "Failed to delete stock item");
            }

            toast({
                title: "ลบวัตถุดิบสำเร็จ",
                description: `ลบ ${item.name} เรียบร้อยแล้ว`,
                className: "bg-green-50 border-green-200 text-green-800",
            });

            fetchStockItems();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "เกิดข้อผิดพลาด",
                description: error.message,
            });
        }
    };

    const getLastRestockInfo = (item: StockItem) => {
        if (item.restocks && item.restocks.length > 0) {
            const lastRestock = item.restocks[0];
            return `${format(new Date(lastRestock.date), "dd/MM/yyyy")} (${Number(lastRestock.quantity).toLocaleString()} ${item.unit})`;
        }
        return "-";
    };


    const stockItemOptions = stockItems.map((item) => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        currentQty: Number(item.currentQty),
    }));

    return (
        <div className="min-h-screen bg-[var(--po-bg)] pb-20">
            <Header />
            <NavTabs />

            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-10 space-y-4 sm:space-y-6">
                <div className="bg-[#1a3dbf] text-white p-4 rounded-lg flex flex-col gap-4 shadow-md">
                    {/* Header Controls */}
                    <div className="flex items-center gap-2">
                        <Warehouse className="w-5 h-5" />
                        <span className="font-bold text-base sm:text-lg">จัดการสต็อกวัตถุดิบ (Stock Management)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2">
                        <Button size="sm" className="bg-white text-[#1a3dbf] hover:bg-gray-100 border-none font-bold shadow-sm" onClick={handleAddNew}>
                            <Plus className="mr-2 h-4 w-4" /> เพิ่มวัตถุดิบใหม่
                        </Button>
                        <Button size="sm" className="bg-blue-500 text-white hover:bg-blue-600 border-none font-bold shadow-sm" onClick={() => setIsRestockModalOpen(true)}>
                            <Receipt className="mr-2 h-4 w-4" /> เพิ่มสต็อกวัตถุดิบ
                        </Button>
                        <Button size="sm" className="bg-purple-500 text-white hover:bg-purple-600 border-none font-bold shadow-sm" onClick={() => setIsUsageModalOpen(true)}>
                            <ClipboardMinus className="mr-2 h-4 w-4" /> เบิกใช้วัตถุดิบ
                        </Button>
                        <Button size="sm" className="bg-amber-400 text-[#1a3dbf] hover:bg-amber-300 border-none font-bold shadow-sm" onClick={() => router.push("/stock/reports/usage")}>
                            <FileText className="mr-2 h-4 w-4" /> ดูประวัติการใช้
                        </Button>
                        <Button size="sm" className="bg-emerald-400 text-[#1a3dbf] hover:bg-emerald-300 border-none font-bold shadow-sm" onClick={() => router.push("/stock/reports/restock")}>
                            <FileText className="mr-2 h-4 w-4" /> ดูประวัติเติมสต็อก
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center py-10">
                            <div className="flex justify-center items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span className="text-gray-500">กำลังโหลด...</span>
                            </div>
                        </div>
                    ) : stockItems.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">ยังไม่มีข้อมูลวัตถุดิบ</div>
                    ) : stockItems.map((item) => {
                        // Recipe Calculation (Same logic as in production page)
                        const recipeIngredients = ["แป้ง", "เกลือ", "สารกันบูด", "น้ำมัน", "โซเดียมใบคาร์บอเนต", "โซเดียมไบคาร์บอเนต", "สีผสมอาหาร"];
                        const isRecipeItem = recipeIngredients.some(ing => item.name.includes(ing));
                        let totalProducible: number | null = null;
                        
                        if (item.name.includes("แป้ง")) {
                            totalProducible = Math.floor(Number(item.currentQty) * (78 / 22.5));
                        } else if (item.name.includes("เกลือ")) {
                            totalProducible = Math.floor(Number(item.currentQty) * (78 / 0.5));
                        } else if (item.name.includes("สารกันบูด")) {
                            totalProducible = Math.floor(Number(item.currentQty) * (78 / 0.3));
                        } else if (item.name.includes("น้ำมัน")) {
                            totalProducible = Math.floor(Number(item.currentQty) * (78 / 1.5));
                        } else if (item.name.includes("โซเดียมใบคาร์บอเนต") || item.name.includes("โซเดียมไบคาร์บอเนต")) {
                            totalProducible = Math.floor(Number(item.currentQty) * (78 / 0.5));
                        } else if (item.name.includes("สีผสมอาหาร")) {
                            totalProducible = Math.floor(Number(item.currentQty) * (78 / 3));
                        }

                        return (
                            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative group flex flex-col sm:flex-row items-stretch">
                                <div className="w-full sm:w-52 h-48 sm:h-auto bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center overflow-hidden shrink-0">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Package className="w-16 h-16 text-gray-300" />
                                    )}
                                </div>

                                <div className="flex-1 p-5 sm:p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold tracking-wide text-blue-600 uppercase">ชื่อวัตถุดิบ</p>
                                            <h3 className="text-xl font-bold text-gray-800 break-words">{item.name}</h3>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">วันที่เติมล่าสุด</p>
                                            <p className="text-base font-medium text-gray-700">{getLastRestockInfo(item)}</p>
                                        </div>

                                        <div className="flex gap-6 items-stretch lg:col-span-2">
                                            <div className="bg-green-50 border border-green-100 rounded-2xl px-6 py-5 flex flex-col justify-center flex-1 transition-all hover:bg-green-100/50">
                                                <p className="text-sm font-bold tracking-wide text-green-800 uppercase whitespace-nowrap">จำนวนคงเหลือ</p>
                                                <div className="flex items-baseline gap-2 mt-2">
                                                    <p className="text-3xl font-black text-green-700">{Number(item.currentQty).toLocaleString()}</p>
                                                    <p className="text-lg font-bold text-green-600/80">{item.unit}</p>
                                                </div>
                                            </div>
                                            {isRecipeItem && totalProducible !== null && (
                                                <div className="bg-blue-50 border border-blue-100 rounded-2xl px-6 py-5 flex flex-col justify-center flex-1 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)] transition-all hover:bg-blue-100/50">
                                                    <p className="text-sm font-bold tracking-wide text-blue-800 uppercase flex items-center gap-2 whitespace-nowrap">
                                                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-pulse"></span>
                                                        จำนวนที่ผลิตได้จริง (ทั้งหมด)
                                                    </p>
                                                    <div className="flex items-baseline gap-2 mt-2">
                                                        <p className="text-3xl font-black text-blue-700">{totalProducible.toLocaleString()}</p>
                                                        <p className="text-lg font-bold text-blue-600/80">ห่อ</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <button
                                    type="button"
                                    className="w-full sm:w-16 flex items-center justify-center bg-white hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors sm:border-l border-t sm:border-t-0 border-gray-100 shrink-0 p-4 sm:p-0"
                                    onClick={() => handleDeleteItem(item)}
                                >
                                    <Trash2 className="h-6 w-6" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <StockItemModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={fetchStockItems}
                stockItemToEdit={editingItem}
            />

            <GlobalRestockModal
                isOpen={isRestockModalOpen}
                onClose={() => setIsRestockModalOpen(false)}
                onSuccess={fetchStockItems}
                stockItems={stockItemOptions}
            />

            <GlobalUsageModal
                isOpen={isUsageModalOpen}
                onClose={() => setIsUsageModalOpen(false)}
                onSuccess={fetchStockItems}
                stockItems={stockItemOptions}
            />
        </div>
    );
}
