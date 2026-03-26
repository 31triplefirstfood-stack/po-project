"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ProductionPOTemplate from "@/components/pdf/ProductionTemplate";

// Same interface as GET /api/production-orders/[id]
interface ProductionOrder {
    id: string;
    createdAt: string;
    poNumber: string | null;
    productName: string | null;
    quantity: number | null;
    customerName: string | null;
    purchaseOrder?: {
        poNumber: string;
        deliveryDate: string;
        supplier: {
            companyName: string;
            contactPerson: string | null;
            phone: string | null;
            address: string | null;
        };
        items: {
            product: { name: string; unit: string } | null;
            itemName?: string;
            quantity: number;
            unitPrice: number;
        }[];
    } | null;
}

export default function ProductionPdfPage() {
    const { id } = useParams();
    const router = useRouter();
    const [production, setProduction] = useState<ProductionOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const PDFViewer = dynamic(
        () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
        {
            ssr: false,
            loading: () => (
                <div className="flex bg-[var(--po-bg)] h-[100dvh] items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                </div>
            ),
        }
    );

    useEffect(() => {
        const fetchProduction = async () => {
            try {
                const res = await fetch(`/api/production-orders/${id}`);
                if (!res.ok) throw new Error("Failed to load Production Order");
                const data = await res.json();
                setProduction(data);
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not fetch Production Order details.",
                });
                router.push("/production");
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchProduction();
        }
    }, [id, router, toast]);

    if (isLoading) {
        return (
            <div className="flex bg-[var(--po-bg)] h-[100dvh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (!production) {
        return <div className="p-10 text-center">Development Error: Order Not Found</div>;
    }

    // Mapping Data for PDF Template
    const mapPdfData = () => {
        if (production.purchaseOrder) {
            const po = production.purchaseOrder;
            const items = po.items.map(item => ({
                productName: item.product?.name ?? item.itemName ?? '(ไม่ระบุชื่อสินค้า)',
                quantity: Number(item.quantity) || 0,
                unit: item.product?.unit ?? 'ห่อ',
                unitPrice: (item as any).unitPrice || 0, // Extracting from DB
            }));
            const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

            return {
                id: production.id,
                createdAt: production.createdAt,
                targetDate: po.deliveryDate,
                poNumber: po.poNumber,
                items,
                customer: {
                    companyName: po.supplier.companyName,
                    contactPerson: po.supplier.contactPerson || '',
                    phone: po.supplier.phone || '',
                    address: po.supplier.address || '',
                },
                totalQuantity
            };
        } else {
            const totalQuantity = Number(production.quantity) || 1;
            return {
                id: production.id,
                createdAt: production.createdAt,
                targetDate: production.createdAt,
                poNumber: production.poNumber || null,
                items: [
                    {
                        productName: production.productName || 'เส้น 50 กิโล',
                        quantity: totalQuantity,
                        unit: 'ชุด/กระสอบ',
                        unitPrice: 0
                    }
                ],
                customer: {
                    companyName: production.customerName || '',
                    contactPerson: '',
                    phone: '',
                    address: '',
                },
                totalQuantity
            };
        }
    };

    const pdfData = mapPdfData();

    return (
        <div className="flex flex-col h-[100dvh] w-full bg-[#525659]">
            <div className="flex items-center justify-between shrink-0 p-4 bg-white shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => router.push("/production")}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> กลับไปหน้ารายการคิวผลิต
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-800">
                            เอกสารสั่งผลิต: {production.id}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full relative">
                <PDFViewer width="100%" height="100%" className="w-full h-full border-none">
                    <ProductionPOTemplate data={pdfData} />
                </PDFViewer>
            </div>
        </div>
    );
}
