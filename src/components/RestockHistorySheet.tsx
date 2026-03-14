"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Edit, Trash2, Package, Receipt, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const restockSchema = z.object({
    receiptNumber: z.string().min(1, "กรุณาระบุเลขใบเสร็จ"),
    quantity: z.coerce.number().positive("จำนวนต้องมากกว่า 0"),
    date: z.date(),
});

type RestockFormValues = z.infer<typeof restockSchema>;

interface RestockHistorySheetProps {
    isOpen: boolean;
    onClose: () => void;
    stockItem: any;
    onUpdate: () => void;
}

export function RestockHistorySheet({ isOpen, onClose, stockItem, onUpdate }: RestockHistorySheetProps) {
    const { toast } = useToast();
    const [restocks, setRestocks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const form = useForm<RestockFormValues>({
        resolver: zodResolver(restockSchema) as any,
        defaultValues: {
            receiptNumber: "",
            quantity: 0,
            date: new Date(),
        },
    });

    const fetchRestocks = async () => {
        if (!stockItem?.id) return;
        try {
            setIsLoading(true);
            const res = await fetch(`/api/stock/${stockItem.id}/restocks`);
            if (res.ok) {
                setRestocks(await res.json());
            }
        } catch (error) {
            console.error("Failed to fetch restocks", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && stockItem?.id) {
            fetchRestocks();
            form.reset({
                receiptNumber: "",
                quantity: 0,
                date: new Date(),
            });
            setEditingId(null);
        }
    }, [isOpen, stockItem?.id]);

    const onSubmit = async (data: RestockFormValues) => {
        try {
            const url = editingId
                ? `/api/stock/${stockItem.id}/restocks/${editingId}`
                : `/api/stock/${stockItem.id}/restocks`;
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    date: data.date.toISOString(),
                }),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Failed to save restock");
            }

            toast({
                title: editingId ? "แก้ไขข้อมูลสำเร็จ" : "เพิ่มรายการสำเร็จ",
                description: editingId ? "แก้ไขรายการเติมสต็อกเรียบร้อยแล้ว" : "เพิ่มรายการเติมสต็อกเรียบร้อยแล้ว",
                className: "bg-green-50 border-green-200 text-green-800",
            });

            form.reset({
                receiptNumber: "",
                quantity: 0,
                date: new Date(),
            });
            setEditingId(null);
            fetchRestocks();
            onUpdate();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "เกิดข้อผิดพลาด",
                description: error.message,
            });
        }
    };

    const handleEdit = (restock: any) => {
        setEditingId(restock.id);
        form.reset({
            receiptNumber: restock.receiptNumber,
            quantity: Number(restock.quantity),
            date: new Date(restock.date),
        });
    };

    const handleDelete = async (restockId: string) => {
        if (!confirm("ต้องการลบรายการนี้หรือไม่?")) return;

        try {
            const res = await fetch(`/api/stock/${stockItem.id}/restocks/${restockId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Failed to delete restock");
            }

            toast({
                title: "ลบรายการสำเร็จ",
                description: "ลบรายการเติมสต็อกเรียบร้อยแล้ว",
                className: "bg-green-50 border-green-200 text-green-800",
            });

            fetchRestocks();
            onUpdate();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "เกิดข้อผิดพลาด",
                description: error.message,
            });
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        ประวัติเติมสต็อก: {stockItem?.name}
                    </SheetTitle>
                    <p className="text-sm text-gray-500">
                        คงเหลือปัจจุบัน: <span className="font-bold text-blue-600">{Number(stockItem?.currentQty || 0).toLocaleString()}</span> {stockItem?.unit}
                    </p>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            {editingId ? "แก้ไขรายการเติมสต็อก" : "เพิ่มรายการเติมสต็อก"}
                        </h3>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                                <FormField
                                    control={form.control}
                                    name="receiptNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm flex items-center gap-2">
                                                <Receipt className="w-3 h-3" />
                                                เลขใบเสร็จ
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="เช่น INV-001" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                        control={form.control}
                                        name="quantity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm">จำนวน</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" placeholder="0" {...field} />
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
                                                <FormLabel className="text-sm">วันที่</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? format(field.value, "dd/MM/yyyy") : <span>เลือกวันที่</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        disabled={form.formState.isSubmitting}
                                        className="bg-blue-600 hover:bg-blue-700 flex-1"
                                    >
                                        {form.formState.isSubmitting ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Plus className="w-4 h-4 mr-2" />
                                        )}
                                        {editingId ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}
                                    </Button>
                                    {editingId && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setEditingId(null);
                                                form.reset({
                                                    receiptNumber: "",
                                                    quantity: 0,
                                                    date: new Date(),
                                                });
                                            }}
                                        >
                                            ยกเลิก
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </Form>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800 mb-3">รายการทั้งหมด</h3>
                        {isLoading ? (
                            <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
                        ) : restocks.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">ยังไม่มีรายการเติมสต็อก</div>
                        ) : (
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>เลขใบเสร็จ</TableHead>
                                            <TableHead>วันที่</TableHead>
                                            <TableHead className="text-right">จำนวน</TableHead>
                                            <TableHead>หน่วย</TableHead>
                                            <TableHead className="text-right">จัดการ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {restocks.map((restock) => (
                                            <TableRow key={restock.id}>
                                                <TableCell className="font-mono text-sm">{restock.receiptNumber}</TableCell>
                                                <TableCell>{format(new Date(restock.date), "dd/MM/yyyy")}</TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {Number(restock.quantity).toLocaleString()}
                                                </TableCell>
                                                <TableCell>{stockItem?.unit}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex gap-1 justify-end">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEdit(restock)}
                                                            className="h-7 px-2"
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(restock.id)}
                                                            className="h-7 px-2 text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
