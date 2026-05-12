"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PurchaseOrderForm } from "@/components/forms/PurchaseOrderForm";
import Header from "@/components/Header";
import NavTabs from "@/components/NavTabs";
import { Edit, Loader2 } from "lucide-react";

function CreatePurchaseOrderContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const editId = searchParams.get("edit");
    const [initialData, setInitialData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (editId) {
            setIsLoading(true);
            fetch(`/api/purchase-orders/${editId}`)
                .then(res => {
                    if (!res.ok) throw new Error("Failed to fetch");
                    return res.json();
                })
                .then(data => setInitialData(data))
                .catch(err => console.error(err))
                .finally(() => setIsLoading(false));
        }
    }, [editId]);

    if (editId && isLoading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /> Loading...</div>;
    }

    return (
        <div className="max-w-[1200px] mx-auto px-2 sm:px-4 mt-4 sm:mt-6 space-y-4 sm:space-y-6">
            {/* ── Create Order Form Header (Green) ── */}
            <div className="bg-[#10b981] text-white p-4 rounded-t-lg flex items-center gap-2 shadow-md">
                <div className="bg-white/20 p-1.5 rounded-md">
                    <Edit className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">{editId ? "แก้ไขออเดอร์" : "สร้างออเดอร์ใหม่"}</span>
            </div>

            <div className="-mt-6">
                <PurchaseOrderForm
                    initialData={initialData}
                    onSuccess={() => {
                        if (editId) {
                            router.push("/purchase-orders");
                        } else {
                            window.location.href = "/purchase-orders/create";
                        }
                    }}
                    onCancel={() => router.push("/purchase-orders")}
                />
            </div>
        </div>
    );
}

export default function CreatePurchaseOrderPage() {
    return (
        <div className="min-h-screen bg-[#F3F4F6] pb-20">
            <Header />
            <NavTabs />
            <Suspense fallback={<div>Loading...</div>}>
                <CreatePurchaseOrderContent />
            </Suspense>
        </div>
    );
}
