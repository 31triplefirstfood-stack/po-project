"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, X, Package, Image, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { useToast } from "@/hooks/use-toast";

const stockItemSchema = z.object({
    name: z.string().min(1, "กรุณาระบุชื่อวัตถุดิบ"),
    imageUrl: z.string().url("URL รูปภาพไม่ถูกต้อง").optional().or(z.literal("")),
    unit: z.string().min(1, "กรุณาระบุหน่วย"),
});

type StockItemFormValues = z.infer<typeof stockItemSchema>;

interface StockItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    stockItemToEdit?: any;
}

export function StockItemModal({ isOpen, onClose, onSuccess, stockItemToEdit }: StockItemModalProps) {
    const { toast } = useToast();
    const isEditing = !!stockItemToEdit;

    const form = useForm<StockItemFormValues>({
        resolver: zodResolver(stockItemSchema) as any,
        defaultValues: {
            name: "",
            imageUrl: "",
            unit: "",
        } as StockItemFormValues,
    });

    useEffect(() => {
        if (isOpen) {
            if (stockItemToEdit) {
                form.reset({
                    name: stockItemToEdit.name || "",
                    imageUrl: stockItemToEdit.imageUrl || "",
                    unit: stockItemToEdit.unit || "",
                });
            } else {
                form.reset({
                    name: "",
                    imageUrl: "",
                    unit: "",
                });
            }
        }
    }, [isOpen, stockItemToEdit, form]);

    const onSubmit = async (data: StockItemFormValues) => {
        try {
            const url = isEditing ? `/api/stock/${stockItemToEdit.id}` : "/api/stock";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Failed to save stock item");
            }

            toast({
                title: isEditing ? "แก้ไขข้อมูลสำเร็จ" : "บันทึกข้อมูลสำเร็จ",
                description: isEditing ? "แก้ไขข้อมูลวัตถุดิบเรียบร้อยแล้ว" : "เพิ่มวัตถุดิบใหม่เรียบร้อยแล้ว",
                className: "bg-green-50 border-green-200 text-green-800",
            });

            onSuccess();
            onClose();
            form.reset();
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
            <DialogContent className="sm:max-w-[500px] bg-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        {isEditing ? "แก้ไขวัตถุดิบ" : "เพิ่มวัตถุดิบใหม่"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                                        <Package className="w-4 h-4" />
                                        ชื่อวัตถุดิบ
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="เช่น น้ำตาล, แป้ง, น้ำมัน"
                                            {...field}
                                            className="border-gray-300"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="imageUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                                        <Image className="w-4 h-4" />
                                        URL รูปภาพ (ไม่บังคับ)
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="https://example.com/image.jpg"
                                            {...field}
                                            className="border-gray-300"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="unit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                                        <Ruler className="w-4 h-4" />
                                        หน่วย
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="เช่น กก., ลิตร, ชิ้น"
                                            {...field}
                                            className="border-gray-300"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="border-gray-300"
                            >
                                <X className="w-4 h-4 mr-2" />
                                ยกเลิก
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.formState.isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        {isEditing ? "บันทึกการแก้ไข" : "เพิ่มวัตถุดิบ"}
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
