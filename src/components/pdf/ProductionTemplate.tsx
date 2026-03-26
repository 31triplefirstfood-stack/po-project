"use client";

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { formatPoNumber } from '@/lib/utils';
import { thaiBahtText } from '@/lib/thai-baht-text';

// Register Thai font
Font.register({
    family: 'Sarabun',
    fonts: [
        { src: '/fonts/Sarabun-Regular.ttf' },
        { src: '/fonts/Sarabun-Bold.ttf', fontWeight: 'bold' }
    ]
});

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Sarabun',
        color: '#333',
    },
    // Top Info Box matching Image
    infoBox: {
        backgroundColor: '#eef2ff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 30,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'center',
    },
    infoLabel: {
        width: 80,
        fontSize: 10,
        color: '#4b5563',
    },
    infoValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    infoValueBlue: {
        color: '#3b82f6',
        fontWeight: 'bold',
    },
    infoValueRed: {
        color: '#ef4444',
        fontWeight: 'bold',
    },

    // Table
    table: {
        width: '100%',
        marginBottom: 20,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingVertical: 10,
        marginBottom: 5,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f3f4f6',
    },
    colDesc: { width: '40%', fontSize: 10 },
    colQty: { width: '15%', textAlign: 'center', fontSize: 10 },
    colPrice: { width: '20%', textAlign: 'right', fontSize: 10 },
    colSubtotal: { width: '25%', textAlign: 'right', fontSize: 10, fontWeight: 'bold' },
    headerText: { color: '#6b7280', fontSize: 9, fontWeight: 'bold' },

    // Summary Section
    summaryContainer: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 10,
        color: '#4b5563',
    },
    summaryValue: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 10,
        alignItems: 'center',
    },
    grandTotalLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#3b82f6',
    },
    grandTotalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3b82f6',
    },

    // Ingredients Table Addon
    ingredientsContainer: {
        marginTop: 30,
        backgroundColor: '#f0fdf4',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    ingredientsHeader: {
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#86efac',
        paddingBottom: 5,
    },
    ingredientsHeaderText: {
        color: '#15803d',
        fontWeight: 'bold',
        fontSize: 11,
        textAlign: 'center',
    },
    ingTableRow: {
        flexDirection: 'row',
        paddingVertical: 6,
    },
    ingDesc: { width: '50%', fontSize: 10, color: '#166534' },
    ingQty: { width: '50%', textAlign: 'right', fontWeight: 'bold', color: '#166534' },
});

interface ProductionData {
    id: string;
    createdAt: string;
    targetDate: string;
    poNumber: string | null;
    items: {
        productName: string;
        quantity: number;
        unit: string;
        unitPrice: number;
    }[];
    customer: {
        companyName: string;
        contactPerson: string;
        phone: string;
        address: string;
    };
    totalQuantity: number;
}

const ProductionPOTemplate = ({ data }: { data: ProductionData }) => {
    const totalQty = data.totalQuantity;
    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const vatAmount = subtotal * 0.07;
    const grandTotal = subtotal + vatAmount;

    // Calculation formulas for ingredients
    const scalingFactor = totalQty / 78;
    const requirements = [
        { name: "แป้ง (Flour)", amount: 22.5 * scalingFactor, unit: "กิโลกรัม" },
        { name: "เกลือ (Salt)", amount: 0.5 * scalingFactor, unit: "กิโลกรัม" },
        { name: "สารกันบูด (Preservative)", amount: 0.3 * scalingFactor, unit: "กิโลกรัม" },
        { name: "น้ำมัน (Oil)", amount: 1.5 * scalingFactor, unit: "ลิตร" },
        { name: "โซเดียมใบคาร์บอเนต (Sodium Bicarbonate)", amount: 0.5 * scalingFactor, unit: "กรัม" },
    ];

    const formatThaiDate = (value?: string | null) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const createdDateText = formatThaiDate(data.createdAt);
    const targetDateText = formatThaiDate(data.targetDate);

    const pages = [
        { label: 'ต้นฉบับ/Original', isRawMaterials: false },
        { label: 'สำเนา/Copy', isRawMaterials: true },
    ];

    return (
        <Document>
            {pages.map((page, pageIndex) => (
                <Page key={pageIndex} size="A4" style={styles.page}>
                    {/* Header Box matching Image */}
                    <View style={styles.infoBox}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>เลข PO:  </Text>
                            <Text style={[styles.infoValue, styles.infoValueBlue]}>{data.poNumber ? formatPoNumber(data.poNumber) : "AUTO-GEN"}    </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>ลูกค้า:</Text>
                            <Text style={styles.infoValue}>{data.customer.companyName}    </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>วันที่สร้าง:</Text>
                            <Text style={styles.infoValue}>{createdDateText}    </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>วันที่จัดส่ง:</Text>
                            <Text style={[styles.infoValue, styles.infoValueRed]}>{targetDateText}     </Text>
                        </View>
                    </View>

                    {/* Table */}
                    <View style={styles.table}>
                        <View style={styles.tableHeaderRow}>
                            <Text style={[styles.colDesc, styles.headerText]}>สินค้า</Text>
                            <Text style={[styles.colQty, styles.headerText]}>จำนวน </Text>
                            <Text style={[styles.colPrice, styles.headerText]}>ราคา/หน่วย</Text>
                            <Text style={[styles.colSubtotal, styles.headerText]}>รวม</Text>
                        </View>
                        {data.items.map((item, index) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={styles.colDesc}>{item.productName}  </Text>
                                <Text style={styles.colQty}>{item.quantity}   </Text>
                                <Text style={styles.colPrice}>{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}   </Text>
                                <Text style={styles.colSubtotal}>{(item.quantity * item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}   </Text>
                            </View>
                        ))}
                    </View>

                    {/* Summary Section */}
                    <View style={styles.summaryContainer}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>จำนวนสินค้าทั้งหมดที่สั่งซื้อ (ห่อ):</Text>
                            <Text style={styles.summaryValue}>{totalQty}    </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>ราคาสินค้าก่อนภาษีมูลค่าเพิ่ม:</Text>
                            <Text style={styles.summaryValue}>{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท    </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>ภาษีมูลค่าเพิ่ม 7%:</Text>
                            <Text style={styles.summaryValue}>{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท    </Text>
                        </View>

                        <View style={styles.grandTotalRow}>
                            <Text style={styles.grandTotalLabel}>รายรับสุทธิ:</Text>
                            <Text style={styles.grandTotalValue}>{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท    </Text>
                        </View>
                    </View>

                    {/* Raw Materials - Only on Page 2 */}
                    {page.isRawMaterials && (
                        <View style={styles.ingredientsContainer}>
                            <View style={styles.ingredientsHeader}>
                                <Text style={styles.ingredientsHeaderText}>สรุปวัตถุดิบทั้งหมดที่ต้องใช้ในออเดอร์นี้ (สูตรมาตรฐาน)</Text>
                            </View>
                            {requirements.map((req, idx) => (
                                <View key={idx} style={styles.ingTableRow}>
                                    <Text style={styles.ingDesc}>{req.name}    </Text>
                                    <Text style={styles.ingQty}>{req.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {req.unit}    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </Page>
            ))}
        </Document>
    );
};

export default ProductionPOTemplate;
