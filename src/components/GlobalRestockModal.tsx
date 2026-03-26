"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar as CalendarIcon, Loader2, Package, Receipt, Save, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const restockSchema = z.object({
    stockItemId: z.string().min(1, "กรุณาเลือกวัตถุดิบ"),
    receiptNumber: z.string().optional(),
    quantity: z.coerce.number().min(0).optional(),
    date: z.date(),
});

type RestockFormValues = z.infer<typeof restockSchema>;

interface StockItemOption {
    id: string;
    name: string;
    unit: string;
}

interface GlobalRestockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    stockItems: StockItemOption[];
}

export function GlobalRestockModal({ isOpen, onClose, onSuccess, stockItems }: GlobalRestockModalProps) {
    const { toast } = useToast();

    const form = useForm<RestockFormValues>({
        resolver: zodResolver(restockSchema) as any,
        defaultValues: {
            stockItemId: "",
            receiptNumber: "",
            quantity: "" as any,
            date: new Date(),
        },
    });

    const selectedStockItemId = form.watch("stockItemId");
    const selectedStockItem = useMemo(
        () => stockItems.find((item) => item.id === selectedStockItemId),
        [stockItems, selectedStockItemId]
    );

    useEffect(() => {
        if (!isOpen) return;
        form.reset({
            stockItemId: "",
            receiptNumber: "",
            quantity: "" as any,
            date: new Date(),
        });
    }, [isOpen, form]);

    const onSubmit = async (data: RestockFormValues) => {
        try {
            const res = await fetch(`/api/stock/${data.stockItemId}/restocks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    receiptNumber: data.receiptNumber || "-",
                    quantity: data.quantity || 0,
                    date: data.date.toISOString(),
                }),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Failed to save restock");
            }

            toast({
                title: "บันทึกการเติมสต็อกสำเร็จ",
                description: "เพิ่มรายการเติมสต็อกเรียบร้อยแล้ว",
                className: "bg-green-50 border-green-200 text-green-800",
            });

            onSuccess();
            onClose();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "เกิดข้อผิดพลาด",
                description: error.message,
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[560px] bg-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-blue-600" />
                        เพิ่มสต็อกวัตถุดิบ
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="stockItemId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                                        <Package className="w-4 h-4" />
                                        ชื่อวัตถุดิบ
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full border-gray-300">
                                                <SelectValue placeholder="เลือกวัตถุดิบ" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {stockItems.map((item) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormItem>
                                <FormLabel className="text-gray-700 font-medium">หน่วย</FormLabel>
                                <Input value={selectedStockItem?.unit || "-"} disabled className="border-gray-300 bg-gray-50" />
                            </FormItem>

                            <FormField
                                control={form.control}
                                name="receiptNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700 font-medium">เลขใบเสร็จ</FormLabel>
                                        <FormControl>
                                            <Input placeholder="เช่น INV-001" {...field} className="border-gray-300" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700 font-medium">จำนวน</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="0" {...field} value={field.value ?? ""} className="border-gray-300" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700 font-medium">วันที่</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full justify-start pl-3 text-left font-normal border-gray-300",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? format(field.value, "dd/MM/yyyy") : <span>เลือกวันที่</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={onClose} className="border-gray-300">
                                <X className="w-4 h-4 mr-2" />
                                ยกเลิก
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        บันทึกการเติมสต็อก
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
