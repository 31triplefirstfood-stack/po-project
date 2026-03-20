"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Plus, Trash2, Save, X, RefreshCw, FileText, CheckCircle, Loader2, Edit, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ProductCombobox } from "@/components/ProductCombobox";
import { OrderSummaryModal } from "@/components/OrderSummaryModal";

// ── Schema ──────────────────────────────────────────────────────────────────
const itemSchema = z.object({
    productId: z.string().optional(),
    productName: z.string().optional(),
    quantity: z.coerce.number().int().min(0), // Allow 0, will filter out later
    unitPrice: z.coerce.number().min(0),
    unit: z.string().optional(),
});

const poSchema = z.object({
    supplierId: z.string().min(1, "Supplier/Customer is required"),
    issueDate: z.date(),
    paymentDate: z.date().nullable(),
    deliveryDate: z.date(),
    standardItems: z.array(itemSchema),
    manualItems: z.array(itemSchema),
    otherItems: z.array(itemSchema),
});

type PoFormValues = z.infer<typeof poSchema>;

interface Supplier {
    id: string;
    companyName: string;
    regularPrice: number;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    defaultPrice: number;
    unit: string;
}

interface PurchaseOrderFormProps {
    initialData?: any;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function PurchaseOrderForm({ initialData, onSuccess, onCancel }: PurchaseOrderFormProps) {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [reviewData, setReviewData] = useState<PoFormValues | null>(null);

    // ── Constants ──
    const ALLOWED_PRODUCT_NAMES = ["บะหมี่ลวกเส้น", "ข้าวซอยลวกเส้นสด", "หยกเส้นลวก"];
    const restrictedProducts = products.filter(p => ALLOWED_PRODUCT_NAMES.includes(p.name));

    // ── Form Setup ──
    const form = useForm<PoFormValues>({
        resolver: zodResolver(poSchema) as any,
        defaultValues: {
            supplierId: "",
            issueDate: new Date(),
            paymentDate: null,
            deliveryDate: new Date(),
            standardItems: [{ productId: "", quantity: "" as any, unitPrice: 0, unit: "", productName: "" }],
            manualItems: [{ productId: "", quantity: "" as any, unitPrice: 0, unit: "", productName: "" }],
            otherItems: [],
        },
    });

    const { control, handleSubmit, setValue, watch, reset } = form;

    const { fields: standardFields, append: appendStandard, remove: removeStandard } = useFieldArray({
        control,
        name: "standardItems",
    });

    const { fields: manualFields, append: appendManual, remove: removeManual } = useFieldArray({
        control,
        name: "manualItems",
    });

    const { fields: otherFields, append: appendOther, remove: removeOther } = useFieldArray({
        control,
        name: "otherItems",
    });

    // Watch supplierId to trigger price recalculation
    const selectedSupplierId = watch("supplierId");
    const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

    // ── Fetch Data ──
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Only fetch if not already loaded? Or always fetch to be fresh?
                // Better fetch to get latest products/suppliers
                const [suppRes, prodRes] = await Promise.all([
                    fetch("/api/suppliers"),
                    fetch("/api/products"),
                ]);

                if (suppRes.ok && prodRes.ok) {
                    const suppData = await suppRes.json();
                    const prodData: Product[] = await prodRes.json();
                    setSuppliers(suppData);
                    setProducts(prodData);
                } else {
                    console.error("Failed to fetch data", {
                        suppliers: { ok: suppRes.ok, status: suppRes.status, statusText: suppRes.statusText },
                        products: { ok: prodRes.ok, status: prodRes.status, statusText: prodRes.statusText }
                    });
                }
            } catch (error) {
                console.error("Failed to load data", error);
            }
        };
        fetchData();
    }, []);

    // ── Initialize Form with Initial Data ──
    // ── Initialize Form with Initial Data or Defaults ──
    useEffect(() => {
        if (products.length > 0) {
            const targetNames = ["บะหมี่ลวกเส้น", "ข้าวซอยลวกเส้นสด", "หยกเส้นลวก"];

            // Helper to get product info
            const getProduct = (name: string) => products.find(p => p.name === name);

            // Helper to create field structure
            const createField = (name: string, type: "standard" | "manual", existingItems: any[]) => {
                const prod = getProduct(name);
                const existing = existingItems.find(i =>
                    (i.productId && prod && i.productId === prod.id) ||
                    (i.productName === name)
                );

                let unitPrice = 0;
                if (existing) {
                    unitPrice = existing.unitPrice;
                } else if (prod) {
                    if (type === "standard") {
                        // Estimate price if not set? Or wait for calculation
                        unitPrice = (Number(prod.defaultPrice) / 2) / 1.07;
                    } else {
                        unitPrice = Number(prod.defaultPrice);
                    }
                }

                return {
                    productId: prod?.id || "",
                    productName: name, // Force name even if product not found?
                    quantity: existing ? existing.quantity : ("" as any),
                    unitPrice: unitPrice,
                    unit: prod?.unit || existing?.unit || "",
                    // itemType, etc handled by submit
                };
            };

            const initialItems = initialData?.items || [];
            const stdItems = initialItems.filter((i: any) => i.itemType === "STANDARD");
            const manItems = initialItems.filter((i: any) => i.itemType === "MANUAL");

            const newStandard = targetNames.map(name => createField(name, "standard", stdItems));
            const newManual = targetNames.map(name => createField(name, "manual", manItems));

            // Other items: keep as is from initialData
            const other = initialItems.filter((i: any) => i.itemType === "OTHER").map((i: any) => ({
                productId: i.productId || "",
                productName: i.product?.name || i.itemName,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                unit: i.product?.unit || "",
            }));

            // Only reset if we need to? Or just do it once when products/initialData loaded
            // We need to be careful not to overwrite user input if they are typing.
            // This Effect runs on [initialData, products] which changes rarely (load time).

            // We should use reset() to set values.
            const currentValues = form.getValues();

            // Check if we already initialized to avoid resetting user work?
            // But existing items logic handles preservation if we passed currentValues instead of initialItems...
            // BUT this effect is properly for INITIAL LOADS.

            reset({
                supplierId: initialData?.supplierId || "",
                issueDate: initialData ? new Date(initialData.issueDate) : new Date(),
                paymentDate: initialData?.paymentDate ? new Date(initialData.paymentDate) : null,
                deliveryDate: initialData ? new Date(initialData.deliveryDate) : new Date(),
                standardItems: newStandard,
                manualItems: newManual,
                otherItems: other,
            });
        }
    }, [initialData, products, reset]); // Removed suppliers to avoid reset on supplier load alone? logic needs products mostly.

    // ── React to Supplier Change: Update Standard Item Prices ──
    // Note: Only update prices if user explicitly changes supplier, OR if it's a new form.
    // If editing existing form, do we want to re-calc prices immediately?
    // Probably NOT, unless user changes supplier.
    // But how to track if "user changed" vs "initial load"?
    // useWatch returns value.
    // We can compare with initialData.
    useEffect(() => {
        if (selectedSupplier && products.length > 0) {
            // If editing, and supplier is same as initial, DON'T recalc.
            if (initialData && selectedSupplier.id === initialData.supplierId) {
                return;
            }

            // Otherwise, recalc standard items
            const currentStandardItems = form.getValues("standardItems");
            // Check if items actually have products to avoid useless updates on empty rows
            const hasItems = currentStandardItems.some(i => i.productId);
            if (!hasItems) return;

            const updatedItems = currentStandardItems.map(item => {
                let basePrice = 0;
                // If item has no product, skip price update (or 0)
                if (!item.productId) return item;

                if (selectedSupplier.regularPrice > 0) {
                    basePrice = Number(selectedSupplier.regularPrice);
                } else {
                    const product = products.find(p => p.id === item.productId);
                    if (product) {
                        basePrice = Number(product.defaultPrice);
                    }
                }

                const newPrice = (basePrice / 2) / 1.07;

                return {
                    ...item,
                    unitPrice: newPrice
                };
            });

            // Use setValue to avoid full reset? or setValue("standardItems", ...)
            // We need to be careful not to infinite loop if dependencies trigger it.
            // Logic seems to rely on selectedSupplier changing.
            if (JSON.stringify(currentStandardItems) !== JSON.stringify(updatedItems)) {
                setValue("standardItems", updatedItems);
                if (selectedSupplier.regularPrice > 0) {
                    toast({
                        description: `Updated prices for ${selectedSupplier.companyName} (Base: ${selectedSupplier.regularPrice})`,
                    });
                }
            }
        }
    }, [selectedSupplier, products, setValue, toast, initialData]);


    // ── Logic ──
    const handleProductSelect = (
        type: "standard" | "manual" | "other",
        index: number,
        productId: string
    ) => {
        const product = products.find((p) => p.id === productId);
        if (product) {
            const fieldPrefix = type === "standard" ? "standardItems" : type === "manual" ? "manualItems" : "otherItems";
            setValue(`${fieldPrefix}.${index}.productId`, productId);
            setValue(`${fieldPrefix}.${index}.productName`, product.name);
            setValue(`${fieldPrefix}.${index}.unit`, product.unit);

            if (type === "standard") {
                let basePrice = Number(product.defaultPrice);
                if (selectedSupplier && selectedSupplier.regularPrice > 0) {
                    basePrice = Number(selectedSupplier.regularPrice);
                }
                const calculatedPrice = (basePrice / 2) / 1.07;
                setValue(`${fieldPrefix}.${index}.unitPrice`, calculatedPrice);
            } else if (type !== "manual") {
                setValue(`${fieldPrefix}.${index}.unitPrice`, Number(product.defaultPrice));
            }
        }
    };

    // ── Totals Calculation ──
    const standardItems = watch("standardItems");
    const manualItems = watch("manualItems");
    const otherItems = watch("otherItems");


    const calculateTotal = (items: any[]) =>
        items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);

    const calculateQuantity = (items: any[]) =>
        items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    const subtotal = calculateTotal(standardItems) + calculateTotal(manualItems) + calculateTotal(otherItems);
    const totalQuantity = calculateQuantity(standardItems) + calculateQuantity(manualItems) + calculateQuantity(otherItems);

    const vatRate = 0.07;
    const vatAmount = subtotal * vatRate;
    const grandTotal = subtotal + vatAmount;

    // ── Handlers ──
    const handleReview = (data: PoFormValues) => {
        const validStandard = data.standardItems.filter(i => i.productId && i.quantity > 0);
        const validManual = data.manualItems.filter(i => (i.productId || i.productName) && i.quantity > 0);
        const validOther = data.otherItems.filter(i => (i.productId || i.productName) && i.quantity > 0);

        if (validStandard.length === 0 && validManual.length === 0 && validOther.length === 0) {
            toast({ variant: "destructive", title: "Error", description: "Please add at least one item." });
            return;
        }

        setReviewData(data);
        setIsReviewOpen(true);
    };

    const handleFinalSubmit = async () => {
        const data = form.getValues();
        setIsReviewOpen(false);

        try {
            setIsLoading(true);

            const validStandard = data.standardItems.filter(i => i.productId && i.quantity > 0);
            const validManual = data.manualItems.filter(i => (i.productId || i.productName) && i.quantity > 0);
            const validOther = data.otherItems.filter(i => (i.productId || i.productName) && i.quantity > 0);

            const mapItem = (i: any, type: string) => ({
                productId: i.productId || undefined,
                itemName: i.productName || undefined,
                itemType: type,
                quantity: Number(i.quantity),
                unitPrice: Number(i.unitPrice),
            });

            const payloadItems = [
                ...validStandard.map(i => mapItem(i, "STANDARD")),
                ...validManual.map(i => mapItem(i, "MANUAL")),
                ...validOther.map(i => mapItem(i, "OTHER")),
            ];

            const payload = {
                supplierId: data.supplierId,
                issueDate: data.issueDate,
                paymentDate: data.paymentDate,
                deliveryDate: data.deliveryDate,
                items: payloadItems,
            };

            const url = initialData ? `/api/purchase-orders/${initialData.id}` : "/api/purchase-orders";
            const method = initialData ? "PUT" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok) {
                console.error("API Error Response:", json);
                let errorMessage = json.error || "Failed";
                if (json.details && typeof json.details === 'object') {
                    const detailsStr = json.details.fieldErrors
                        ? JSON.stringify(json.details.fieldErrors)
                        : JSON.stringify(json.details);
                    errorMessage += ` Details: ${detailsStr}`;
                }
                throw new Error(errorMessage);
            }

            toast({ title: "Success", description: initialData ? "PO Updated!" : `PO ${json.poNumber} Created!` });

            if (onSuccess) {
                onSuccess();
            } else {
                window.location.href = "/purchase-orders";
            }

        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const getSupplierName = (id: string) => {
        const s = suppliers.find(sup => sup.id === id);
        return s ? s.companyName : "Unknown";
    };

    return (
        <>
            <Form {...form}>
                <form onSubmit={handleSubmit(handleReview, (errors) => {
                    toast({ variant: "destructive", title: "Validation Error", description: "Please check required fields." });
                })} className="space-y-8">

                    {/* ── General Info Card ── */}
                    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4 sm:gap-6 items-end relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <div className="col-span-1 sm:col-span-2 md:col-span-3">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">เลข PO (Auto)</label>
                            <div className="flex items-center h-10 px-3 bg-blue-50 border border-blue-100 rounded-md text-blue-700 font-bold font-mono text-lg shadow-sm">
                                {initialData ? initialData.poNumber : "AUTO-GEN"}
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-3">
                            <FormField
                                control={control}
                                name="issueDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col space-y-1.5">
                                        <FormLabel className="text-xs font-bold text-gray-500 uppercase tracking-wider">วันที่สั่งซื้อ (Issue Date)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                                onChange={(event) => {
                                                    const value = event.target.value;
                                                    if (value) {
                                                        field.onChange(new Date(`${value}T00:00:00`));
                                                    }
                                                }}
                                                className="h-10 border-gray-200 bg-white"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="col-span-1 md:col-span-3">
                            <FormField
                                control={control}
                                name="paymentDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col space-y-1.5">
                                        <FormLabel className="text-xs font-bold text-amber-600 uppercase tracking-wider">วันที่ชำระ (Payment Date)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                                onChange={(event) => {
                                                    const value = event.target.value;
                                                    field.onChange(value ? new Date(`${value}T00:00:00`) : null);
                                                }}
                                                className="h-10 border-amber-200 text-amber-700 bg-white"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="col-span-1 md:col-span-3">
                            <FormField
                                control={control}
                                name="deliveryDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col space-y-1.5">
                                        <FormLabel className="text-xs font-bold text-red-500 uppercase tracking-wider">วันที่จัดส่ง (Delivery)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                                onChange={(event) => {
                                                    const value = event.target.value;
                                                    if (value) {
                                                        field.onChange(new Date(`${value}T00:00:00`));
                                                    }
                                                }}
                                                className="h-10 border-red-200 text-red-600 bg-white"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="col-span-1 sm:col-span-2 md:col-span-3">
                            <FormField
                                control={control}
                                name="supplierId"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-xs font-bold text-gray-500 uppercase tracking-wider">ลูกค้า (Customer)</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="border-gray-200 h-10 bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium">
                                                    <SelectValue placeholder="เลือกรายชื่อลูกค้า..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {suppliers.map((s) => (
                                                    <SelectItem key={s.id} value={s.id} className="cursor-pointer focus:bg-blue-50">
                                                        {s.companyName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* ── Standard Items (Blue) ── */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <Box className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 leading-tight">สินค้ามาตรฐาน</h3>
                                <p className="text-xs text-gray-400">Standard Items (ราคาตามระบบ)</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Table Header */}
                            <div className="bg-gray-50/80 border-b border-gray-200 py-3 px-4 hidden md:grid grid-cols-12 gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider items-center">
                                <div className="col-span-5 text-left pl-2">รายการสินค้า</div>
                                <div className="col-span-2 text-center">จำนวน</div>
                                <div className="col-span-2 text-right pr-4">ราคา/หน่วย</div>
                                <div className="col-span-2 text-right pr-4">รวม (บาท)</div>
                                <div className="col-span-1"></div>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {standardFields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-y-3 gap-x-4 items-center p-3 sm:p-4 hover:bg-blue-50/30 transition-colors group relative">

                                        {/* Mobile Label */}
                                        <div className="md:hidden text-xs font-bold text-gray-400 uppercase mb-1">รายการสินค้า</div>
                                        <div className="col-span-1 md:col-span-5">
                                            <div className="h-10 flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-gray-700 font-medium select-none text-sm sm:text-base truncate">
                                                {form.watch(`standardItems.${index}.productName`)}
                                                <input type="hidden" {...form.register(`standardItems.${index}.productId`)} />
                                                <input type="hidden" {...form.register(`standardItems.${index}.productName`)} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 md:contents">
                                            <div className="col-span-1 md:col-span-2">
                                                <div className="md:hidden text-xs font-bold text-gray-400 uppercase mb-1">จำนวน</div>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        step="1"
                                                        {...form.register(`standardItems.${index}.quantity`)}
                                                        defaultValue=""
                                                        className="text-center h-10 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                                                        placeholder="0"
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                                        {form.watch(`standardItems.${index}.unit`) || ""}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="col-span-1 md:col-span-2 text-right">
                                                <div className="md:hidden text-xs font-bold text-gray-400 uppercase mb-1">ราคา/หน่วย</div>
                                                <div className="h-10 flex items-center justify-end pr-4 font-mono text-sm text-gray-600 bg-gray-50 rounded-md border border-transparent">
                                                    {Number(form.watch(`standardItems.${index}.unitPrice`) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                                                </div>
                                                <input type="hidden" {...form.register(`standardItems.${index}.unitPrice`)} />
                                            </div>
                                        </div>

                                        <div className="col-span-1 md:col-span-2 text-right pt-2 md:pt-0 border-t md:border-t-0 border-dashed border-gray-100 mt-2 md:mt-0 flex justify-between md:block items-center">
                                            <div className="md:hidden text-xs font-bold text-gray-500 uppercase">รวม</div>
                                            <div className="pr-4 text-blue-600 font-bold font-mono text-sm sm:text-base">
                                                {(Number(form.watch(`standardItems.${index}.quantity`) || 0) * Number(form.watch(`standardItems.${index}.unitPrice`) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                                            </div>
                                        </div>
                                        <div className="col-span-1 hidden md:flex justify-end">
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-3 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-400 italic">
                                * รายการมาตรฐานถูกกำหนดไว้คงที่ (Fixed Items)
                            </div>
                        </div>
                    </div>

                    {/* ── Manual Items (Orange) ── */}
                    <div className="space-y-4 pt-4 border-t border-dashed border-gray-200">
                        <div className="flex items-center gap-2 px-1">
                            <div className="bg-orange-100 p-2 rounded-lg">
                                <Edit className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 leading-tight">สินค้ากำหนดราคาเอง</h3>
                                <p className="text-xs text-gray-400">Manual Pricing (ปรับราคาได้อิสระ)</p>
                            </div>
                        </div>
                        <div className="bg-orange-50/50 rounded-xl shadow-sm border border-orange-100 overflow-hidden">
                            <div className="bg-orange-100/50 border-b border-orange-200 py-3 px-4 hidden md:grid grid-cols-12 gap-4 text-xs font-bold text-orange-700 uppercase tracking-wider items-center">
                                <div className="col-span-5 text-left pl-2">รายการสินค้า</div>
                                <div className="col-span-2 text-center">จำนวน</div>
                                <div className="col-span-2 text-right pr-4">ราคา/หน่วย</div>
                                <div className="col-span-2 text-right pr-4">รวม (บาท)</div>
                                <div className="col-span-1"></div>
                            </div>

                            <div className="divide-y divide-orange-100">
                                {manualFields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-y-3 gap-x-4 items-center p-3 sm:p-4 hover:bg-orange-100/30 transition-colors">

                                        {/* Mobile Label */}
                                        <div className="md:hidden text-xs font-bold text-orange-400 uppercase mb-1">รายการสินค้า</div>
                                        <div className="col-span-1 md:col-span-5">
                                            <div className="h-10 flex items-center px-3 bg-white border border-orange-200 rounded-md text-orange-800 font-medium select-none text-sm sm:text-base truncate">
                                                {form.watch(`manualItems.${index}.productName`)}
                                                <input type="hidden" {...form.register(`manualItems.${index}.productId`)} />
                                                <input type="hidden" {...form.register(`manualItems.${index}.productName`)} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 md:contents">
                                            <div className="col-span-1 md:col-span-2">
                                                <div className="md:hidden text-xs font-bold text-orange-400 uppercase mb-1">จำนวน</div>
                                                <Input type="number" min="0" step="1" {...form.register(`manualItems.${index}.quantity`)} className="text-center h-10 border-orange-200 focus:border-orange-400 focus:ring-orange-200 bg-white" />
                                            </div>
                                            <div className="col-span-1 md:col-span-2">
                                                <div className="md:hidden text-xs font-bold text-orange-400 uppercase mb-1">ราคา/หน่วย</div>
                                                <Input type="number" step="0.00000001" {...form.register(`manualItems.${index}.unitPrice`)} className="text-right pr-8 h-10 border-orange-200 focus:border-orange-400 focus:ring-orange-200 bg-white font-mono" />
                                            </div>
                                        </div>

                                        <div className="col-span-1 md:col-span-2 text-right pt-2 md:pt-0 border-t md:border-t-0 border-dashed border-orange-200 mt-2 md:mt-0 flex justify-between md:block items-center">
                                            <div className="md:hidden text-xs font-bold text-orange-400 uppercase">รวม</div>
                                            <div className="pr-4 text-orange-600 font-bold font-mono text-sm sm:text-base">
                                                {(Number(form.watch(`manualItems.${index}.quantity`) || 0) * Number(form.watch(`manualItems.${index}.unitPrice`) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                                            </div>
                                        </div>
                                        <div className="hidden md:flex col-span-1 justify-end">
                                            {/* Fixed items */}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-3 bg-orange-50/50 border-t border-orange-100 text-center text-xs text-orange-400 italic">
                                * รายการพิเศษถูกกำหนดไว้คงที่ (Fixed Items)
                            </div>
                        </div>
                    </div>

                    {/* ── Other Items (Purple) ── */}
                    <div className="space-y-4 pt-4 border-t border-dashed border-gray-200">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <div className="bg-purple-100 p-2 rounded-lg">
                                    <Plus className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 leading-tight">รายการอื่นๆ</h3>
                                    <p className="text-xs text-gray-400">Other Items (นอกระบบ)</p>
                                </div>
                            </div>
                            <Button type="button" size="sm" variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50" onClick={() => appendOther({ productId: "", quantity: "" as any, unitPrice: 0 })}>
                                + เพิ่มรายการ
                            </Button>
                        </div>

                        {otherFields.length > 0 && (
                            <div className="bg-purple-50/50 rounded-xl shadow-sm border border-purple-100 overflow-hidden">
                                <div className="bg-purple-100/50 border-b border-purple-200 py-3 px-4 hidden md:grid grid-cols-12 gap-4 text-xs font-bold text-purple-700 uppercase tracking-wider items-center">
                                    <div className="col-span-5 text-left pl-2">รายการสินค้า</div>
                                    <div className="col-span-2 text-center">จำนวน</div>
                                    <div className="col-span-2 text-right pr-4">ราคา/หน่วย</div>
                                    <div className="col-span-2 text-right pr-4">รวม</div>
                                    <div className="col-span-1"></div>
                                </div>
                                <div className="divide-y divide-purple-100">
                                    {otherFields.map((field, index) => (
                                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-y-3 gap-x-4 items-center p-3 sm:p-4 hover:bg-purple-100/30 transition-colors">

                                            <div className="md:hidden text-xs font-bold text-purple-400 uppercase mb-1">ชื่อสินค้า</div>
                                            <div className="col-span-1 md:col-span-5">
                                                <Input
                                                    {...form.register(`otherItems.${index}.productName`)}
                                                    className="h-10 border-purple-200 focus:border-purple-400 focus:ring-purple-200 bg-white text-sm"
                                                    placeholder="ระบุชื่อสินค้า..."
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 md:contents">
                                                <div className="col-span-1 md:col-span-2">
                                                    <div className="md:hidden text-xs font-bold text-purple-400 uppercase mb-1">จำนวน</div>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        {...form.register(`otherItems.${index}.quantity`)}
                                                        className="text-center h-10 border-purple-200 focus:border-purple-400 focus:ring-purple-200 bg-white"
                                                    />
                                                </div>
                                                <div className="col-span-1 md:col-span-2">
                                                    <div className="md:hidden text-xs font-bold text-purple-400 uppercase mb-1">ราคา/หน่วย</div>
                                                    <Input type="number" step="0.00000001" {...form.register(`otherItems.${index}.unitPrice`)} className="text-right pr-8 h-10 border-purple-200 focus:border-purple-400 focus:ring-purple-200 bg-white font-mono" />
                                                </div>
                                            </div>

                                            <div className="col-span-1 md:col-span-2 text-right pt-2 md:pt-0 border-t md:border-t-0 border-dashed border-purple-200 mt-2 md:mt-0 flex justify-between md:block items-center">
                                                <div className="md:hidden text-xs font-bold text-purple-400 uppercase">รวม</div>
                                                <div className="pr-4 text-purple-600 font-bold font-mono text-sm sm:text-base">
                                                    {(Number(form.watch(`otherItems.${index}.quantity`) || 0) * Number(form.watch(`otherItems.${index}.unitPrice`) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                                                </div>
                                            </div>
                                            <div className="col-span-1 md:col-span-1 flex justify-end">
                                                <Button type="button" variant="ghost" size="icon" className="text-purple-300 hover:text-red-500 hover:bg-red-50" onClick={() => removeOther(index)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>



                    {/* ── Footer Summary ── */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl text-white p-4 sm:p-6 shadow-lg transform transition-all hover:scale-[1.005] duration-300">
                        <div className="flex items-center gap-3 mb-4 sm:mb-6 border-b border-white/20 pb-4">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-none">สรุปยอดรวม</h3>
                                <p className="text-xs opacity-70 mt-1">Order Summary</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10 flex flex-col justify-between h-20 sm:h-24">
                                <div className="text-xs text-blue-100 uppercase tracking-wider font-semibold">ยอดรวมสินค้า</div>
                                <div className="font-bold text-xl sm:text-2xl font-mono tracking-tight">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10 flex flex-col justify-between h-20 sm:h-24">
                                <div className="text-xs text-blue-100 uppercase tracking-wider font-semibold">VAT (7%)</div>
                                <div className="font-bold text-xl sm:text-2xl font-mono tracking-tight">{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10 flex flex-col justify-between h-20 sm:h-24">
                                <div className="text-xs text-blue-100 uppercase tracking-wider font-semibold">จำนวนรวม (ชิ้น)</div>
                                <div className="font-bold text-xl sm:text-2xl font-mono tracking-tight">{totalQuantity.toLocaleString()}</div>
                            </div>
                            <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg p-3 sm:p-4 text-blue-900 flex flex-col justify-between h-20 sm:h-24 shadow-lg relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 bg-white/30 rounded-full w-20 h-20 blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                                <div className="text-xs font-extrabold uppercase tracking-wider z-10">ยอดสุทธิ (Net Total)</div>
                                <div className="font-bold text-2xl sm:text-3xl font-mono tracking-tight z-10">{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</div>
                            </div>
                        </div>
                    </div>

                    {/* ── Action Buttons ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2 sticky bottom-0 bg-white/95 backdrop-blur-sm p-4 -mx-4 md:mx-0 border-t border-gray-100 z-10 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)] rounded-b-lg">
                        <div className="flex gap-2 order-2 sm:order-1">
                            {onCancel && (
                                <Button type="button" variant="outline" className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50 font-bold" onClick={onCancel}>
                                    ยกเลิก
                                </Button>
                            )}
                            <Button type="button" variant="outline" className="flex-1 border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-50" onClick={() => reset()}>
                                <RefreshCw className="mr-2 h-4 w-4" /> รีเซ็ต
                            </Button>
                        </div>
                        <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-md shadow-emerald-200 order-1 sm:order-2 h-11" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : <><CheckCircle className="mr-2 h-4 w-4" /> บันทึกคำสั่งซื้อ (Save Order) </>}
                        </Button>
                    </div>

                </form >
            </Form >

            <OrderSummaryModal
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                onConfirm={handleFinalSubmit}
                data={reviewData || form.getValues()}
                getSupplierName={getSupplierName}
                grandTotal={grandTotal}
                subtotal={subtotal}
                vatAmount={vatAmount}
                totalQuantity={totalQuantity}
            />
        </>
    );
}
