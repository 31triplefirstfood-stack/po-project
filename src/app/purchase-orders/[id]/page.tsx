"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic"; // Added for dynamic import
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import POTemplate from "@/components/pdf/POTemplate";

interface POItem {
    id: string;
    quantity: number;
    unitPrice: number;
    itemName?: string | null;
    product: {
        name: string;
        unit: string;
    } | null;
}

interface PurchaseOrder {
    id: string;
    poNumber: string;
    status: string;
    issueDate: string;
    deliveryDate: string;
    supplier: {
        companyName: string;
        contactPerson: string;
        phone: string;
        email: string;
        address: string;
        taxId: string;
    };
    items: POItem[];
}

export default function PurchaseOrderDetailPage() {
    const { id } = useParams();
    const [po, setPo] = useState<PurchaseOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    // Dynamically import PDFViewer to avoid SSR issues
    const PDFViewer = dynamic(
        () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
        {
            ssr: false,
            loading: () => <div className="flex h-[800px] items-center justify-center border rounded-md bg-muted/10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>,
        }
    );

    const fetchPO = async () => {
        try {
            const res = await fetch(`/api/purchase-orders/${id}`);
            if (!res.ok) throw new Error("Failed to load PO");
            const data = await res.json();
            setPo(data);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not fetch Purchase Order details.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPO();
    }, [id]);

    const handleApprove = async () => {
        if (!confirm("Are you sure you want to approve this PO? It will be locked.")) return;
        try {
            const res = await fetch(`/api/purchase-orders/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "APPROVED" }),
            });
            if (!res.ok) throw new Error("Failed to update status");

            toast({ title: "Approved", description: "PO has been approved successfully." });
            fetchPO(); // Refresh
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Status update failed." });
        }
    };

    if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    if (!po) return <div className="p-10 text-center">PO Not Found</div>;

    // Transform data for PDF
    const pdfData = {
        poNumber: po.poNumber,
        issueDate: po.issueDate,
        deliveryDate: po.deliveryDate,
        supplier: po.supplier,
        items: po.items.map(item => ({
            productName: item.product?.name ?? item.itemName ?? '(ไม่ระบุชื่อสินค้า)',
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            unit: item.product?.unit ?? '-',
        })),
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "DRAFT": return <Badge variant="secondary">Draft</Badge>;
            case "APPROVED": return <Badge className="bg-blue-500">Approved</Badge>;
            case "SENT": return <Badge className="bg-green-500">Sent</Badge>;
            case "CANCELLED": return <Badge variant="destructive">Cancelled</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-4 w-full p-4 md:p-6 h-[100dvh] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/purchase-orders">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{po.poNumber}</h1>
                        <p className="text-muted-foreground text-sm">Created on {new Date(po.issueDate).toLocaleDateString()}</p>
                    </div>
                    {getStatusBadge(po.status)}
                </div>

                <div className="flex gap-2">
                    {po.status === 'DRAFT' && (
                        <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="mr-2 h-4 w-4" /> Approve PO
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 border rounded-lg overflow-hidden shadow-sm bg-white">
                <PDFViewer width="100%" height="100%" className="w-full h-full border-none">
                    <POTemplate data={pdfData} />
                </PDFViewer>
            </div>
        </div>
    );
}
