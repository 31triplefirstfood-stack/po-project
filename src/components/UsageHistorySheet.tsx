"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Package, Loader2, UserCheck } from "lucide-react";
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

const usageSchema = z.object({
    quantity: z.coerce.number().positive("จำนวนต้องมากกว่า 0"),
    date: z.date(),
    checkerName: z.string().optional(),
    checkedAt: z.date().optional(),
});

type UsageFormValues = z.infer<typeof usageSchema>;

interface UsageHistorySheetProps {
    isOpen: boolean;
    onClose: () => void;
    stockItem: any;
    onUpdate: () => void;
}

export function UsageHistorySheet({ isOpen, onClose, stockItem, onUpdate }: UsageHistorySheetProps) {
    const { toast } = useToast();
    const [usages, setUsages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<UsageFormValues>({
        resolver: zodResolver(usageSchema) as any,
        defaultValues: {
            quantity: 0,
            date: new Date(),
            checkerName: "",
            checkedAt: undefined,
        },
    });

    const fetchUsages = async () => {
        if (!stockItem?.id) return;
        try {
            setIsLoading(true);
            const res = await fetch(`/api/stock/${stockItem.id}/usages`);
            if (res.ok) {
                setUsages(await res.json());
            }
        } catch (error) {
            console.error("Failed to fetch usages", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && stockItem?.id) {
            fetchUsages();
            form.reset({
                quantity: 0,
                date: new Date(),
                checkerName: "",
                checkedAt: undefined,
            });
        }
    }, [isOpen, stockItem?.id]);

    const onSubmit = async (data: UsageFormValues) => {
        try {
            const res = await fetch(`/api/stock/${stockItem.id}/usages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    quantity: data.quantity,
                    date: data.date.toISOString(),
                    checkerName: data.checkerName || undefined,
                    checkedAt: data.checkedAt ? data.checkedAt.toISOString() : undefined,
                }),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Failed to save usage");
            }

            toast({
                title: "บันทึกการเบิกสำเร็จ",
                description: "บันทึกการเบิกวัตถุดิบเรียบร้อยแล้ว",
                className: "bg-green-50 border-green-200 text-green-800",
            });

            form.reset({
                quantity: 0,
                date: new Date(),
                checkerName: "",
                checkedAt: undefined,
            });
            fetchUsages();
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
            <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        ประวัติการเบิกใช้: {stockItem?.name}
                    </SheetTitle>
                    <p className="text-sm text-gray-500">
                        คงเหลือปัจจุบัน: <span className="font-bold text-blue-600">{Number(stockItem?.currentQty || 0).toLocaleString()}</span> {stockItem?.unit}
                    </p>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            บันทึกการเบิกใช้
                        </h3>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                        control={form.control}
                                        name="quantity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm">จำนวนที่เบิก</FormLabel>
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
                                                <FormLabel className="text-sm">วันที่เบิก</FormLabel>
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

                                <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                        control={form.control}
                                        name="checkerName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm flex items-center gap-2">
                                                    <UserCheck className="w-3 h-3" />
                                                    ผู้ตรวจสอบ (ไม่บังคับ)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ชื่อผู้ตรวจสอบ" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="checkedAt"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm">วันที่ตรวจสอบ (ไม่บังคับ)</FormLabel>
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

                                <Button
                                    type="submit"
                                    disabled={form.formState.isSubmitting}
                                    className="bg-blue-600 hover:bg-blue-700 w-full"
                                >
                                    {form.formState.isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            กำลังบันทึก...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4 mr-2" />
                                            บันทึกการเบิก
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800 mb-3">รายการทั้งหมด</h3>
                        {isLoading ? (
                            <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
                        ) : usages.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">ยังไม่มีรายการเบิกใช้</div>
                        ) : (
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>วันที่เบิก</TableHead>
                                            <TableHead className="text-right">จำนวนที่เบิก</TableHead>
                                            <TableHead>หน่วย</TableHead>
                                            <TableHead>ผู้ตรวจสอบ</TableHead>
                                            <TableHead>วันที่ตรวจ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {usages.map((usage) => (
                                            <TableRow key={usage.id}>
                                                <TableCell>{format(new Date(usage.date), "dd/MM/yyyy")}</TableCell>
                                                <TableCell className="text-right font-semibold text-red-600">
                                                    -{Number(usage.quantity).toLocaleString()}
                                                </TableCell>
                                                <TableCell>{stockItem?.unit}</TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {usage.checkerName || "-"}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {usage.checkedAt ? format(new Date(usage.checkedAt), "dd/MM/yyyy") : "-"}
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
