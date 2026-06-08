"use client";

import React from "react";
import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

Font.register({
    family: "Sarabun",
    fonts: [
        { src: "/fonts/Sarabun-Regular.ttf" },
        { src: "/fonts/Sarabun-Bold.ttf", fontWeight: "bold" },
    ],
});

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: "Sarabun",
        fontSize: 9,
        color: "#1f2937",
    },
    header: {
        marginBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: "#8b5cf6",
        paddingBottom: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1e1b4b",
    },
    subtitle: {
        fontSize: 10,
        color: "#4b5563",
        marginTop: 2,
    },
    dateHeader: {
        fontSize: 11,
        fontWeight: "bold",
        backgroundColor: "#f3e8ff",
        color: "#6b21a8",
        padding: "5 10",
        marginTop: 15,
        marginBottom: 5,
        borderRadius: 4,
    },
    table: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 10,
    },
    row: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
        minHeight: 28,
        alignItems: "stretch",
    },
    headerRow: {
        backgroundColor: "#f8fafc",
        borderBottomWidth: 1,
        borderBottomColor: "#cbd5e1",
        minHeight: 26,
    },
    subtotalRow: {
        backgroundColor: "#faf5ff",
        borderTopWidth: 1,
        borderTopColor: "#d8b4fe",
        minHeight: 26,
    },
    cell: {
        padding: 6,
        justifyContent: "center",
        borderRightWidth: 1,
        borderRightColor: "#e5e7eb",
    },
    lastCell: {
        borderRightWidth: 0,
    },
    bold: {
        fontWeight: "bold",
    },
    textRight: {
        textAlign: "right",
    },
    grandTotalContainer: {
        marginTop: 20,
        padding: 12,
        backgroundColor: "#f5f3ff",
        borderWidth: 2,
        borderColor: "#c084fc",
        borderRadius: 6,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    grandTotalTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#581c87",
    },
    grandTotalVal: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#7e22ce",
    },
    signatureSection: {
        marginTop: 30,
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    signatureBox: {
        width: 220,
        gap: 8,
    },
    signatureRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    signatureLine: {
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: "#111827",
        marginLeft: 8,
        minHeight: 14,
    },
});

export interface CustomerOrderSummaryItem {
    id: string;
    poNumber: string;
    customerName: string;
    issueDate: string;
    itemsSummary: string;
    totalQty: number;
    grandTotal: number;
}

interface CustomerOrderReportTemplateProps {
    reportType: "daily" | "monthly";
    displayPeriod: string;
    items: CustomerOrderSummaryItem[];
}

export default function CustomerOrderReportTemplate({
    reportType,
    displayPeriod,
    items,
}: CustomerOrderReportTemplateProps) {
    
    // Helper to group items by localized issue date
    const groupedByDate = React.useMemo(() => {
        const groups: Record<string, CustomerOrderSummaryItem[]> = {};
        items.forEach((item) => {
            let dateKey = "ไม่มีวันที่";
            if (item.issueDate) {
                try {
                    dateKey = new Date(item.issueDate).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    });
                } catch (e) {
                    // fallback
                }
            }
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(item);
        });
        return groups;
    }, [items]);

    // Calculate overall grand totals
    const grandTotalQty = items.reduce((sum, item) => sum + item.totalQty, 0);
    const grandTotalAmount = items.reduce((sum, item) => sum + item.grandTotal, 0);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.title}>รายงานสรุปยอดสั่งซื้อสินค้าของลูกค้า</Text>
                    <Text style={styles.subtitle}>
                        ประเภทรายงาน: {reportType === "daily" ? "รายวัน" : "รายเดือน"} | ประจำ: {displayPeriod}
                    </Text>
                </View>

                {reportType === "daily" ? (
                    /* Daily Report View */
                    <View>
                        <View style={styles.table}>
                            <View style={[styles.row, styles.headerRow]}>
                                <View style={[styles.cell, { width: "25%" }]}><Text style={styles.bold}>ลูกค้า</Text></View>
                                <View style={[styles.cell, { width: "15%" }]}><Text style={styles.bold}>เลข PO</Text></View>
                                <View style={[styles.cell, { width: "35%" }]}><Text style={styles.bold}>รายการสินค้า</Text></View>
                                <View style={[styles.cell, { width: "10%" }]}><Text style={[styles.bold, styles.textRight]}>จำนวน</Text></View>
                                <View style={[styles.cell, styles.lastCell, { width: "15%" }]}><Text style={[styles.bold, styles.textRight]}>ยอดเงิน (บาท)</Text></View>
                            </View>

                            {items.length === 0 ? (
                                <View style={styles.row}>
                                    <View style={[styles.cell, styles.lastCell, { width: "100%", alignItems: "center" }]}>
                                        <Text>ไม่มีข้อมูลคำสั่งซื้อในวันที่เลือก</Text>
                                    </View>
                                </View>
                            ) : (
                                items.map((item) => (
                                    <View key={item.id} style={styles.row}>
                                        <View style={[styles.cell, { width: "25%" }]}><Text>{item.customerName}</Text></View>
                                        <View style={[styles.cell, { width: "15%" }]}><Text>{item.poNumber}</Text></View>
                                        <View style={[styles.cell, { width: "35%" }]}><Text>{item.itemsSummary}</Text></View>
                                        <View style={[styles.cell, { width: "10%" }]}><Text style={styles.textRight}>{Number(item.totalQty).toLocaleString()}</Text></View>
                                        <View style={[styles.cell, styles.lastCell, { width: "15%" }]}>
                                            <Text style={styles.textRight}>
                                                {Number(item.grandTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            )}

                            {items.length > 0 && (
                                <View style={[styles.row, styles.subtotalRow]}>
                                    <View style={[styles.cell, { width: "75%", justifyContent: "center" }]}>
                                        <Text style={styles.bold}>รวมทั้งหมดประจำวัน</Text>
                                    </View>
                                    <View style={[styles.cell, { width: "10%" }]}>
                                        <Text style={[styles.bold, styles.textRight]}>{Number(grandTotalQty).toLocaleString()}</Text>
                                    </View>
                                    <View style={[styles.cell, styles.lastCell, { width: "15%" }]}>
                                        <Text style={[styles.bold, styles.textRight]}>
                                            ฿{Number(grandTotalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                ) : (
                    /* Monthly Report View */
                    <View>
                        {items.length === 0 ? (
                            <View style={styles.table}>
                                <View style={styles.row}>
                                    <View style={[styles.cell, styles.lastCell, { width: "100%", alignItems: "center", padding: 20 }]}>
                                        <Text>ไม่มีข้อมูลคำสั่งซื้อในเดือนที่เลือก</Text>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            Object.entries(groupedByDate).map(([dateLabel, dateItems]) => {
                                const dateQty = dateItems.reduce((s, i) => s + i.totalQty, 0);
                                const dateAmount = dateItems.reduce((s, i) => s + i.grandTotal, 0);

                                return (
                                    <View key={dateLabel} wrap={false}>
                                        <Text style={styles.dateHeader}>{dateLabel}</Text>
                                        <View style={styles.table}>
                                            <View style={[styles.row, styles.headerRow]}>
                                                <View style={[styles.cell, { width: "25%" }]}><Text style={styles.bold}>ลูกค้า</Text></View>
                                                <View style={[styles.cell, { width: "15%" }]}><Text style={styles.bold}>เลข PO</Text></View>
                                                <View style={[styles.cell, { width: "35%" }]}><Text style={styles.bold}>รายการสินค้า</Text></View>
                                                <View style={[styles.cell, { width: "10%" }]}><Text style={[styles.bold, styles.textRight]}>จำนวน</Text></View>
                                                <View style={[styles.cell, styles.lastCell, { width: "15%" }]}><Text style={[styles.bold, styles.textRight]}>ยอดเงิน (บาท)</Text></View>
                                            </View>

                                            {dateItems.map((item) => (
                                                <View key={item.id} style={styles.row}>
                                                    <View style={[styles.cell, { width: "25%" }]}><Text>{item.customerName}</Text></View>
                                                    <View style={[styles.cell, { width: "15%" }]}><Text>{item.poNumber}</Text></View>
                                                    <View style={[styles.cell, { width: "35%" }]}><Text>{item.itemsSummary}</Text></View>
                                                    <View style={[styles.cell, { width: "10%" }]}><Text style={styles.textRight}>{Number(item.totalQty).toLocaleString()}</Text></View>
                                                    <View style={[styles.cell, styles.lastCell, { width: "15%" }]}>
                                                        <Text style={styles.textRight}>
                                                            {Number(item.grandTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </Text>
                                                    </View>
                                                </View>
                                            ))}

                                            <View style={[styles.row, styles.subtotalRow]}>
                                                <View style={[styles.cell, { width: "75%", justifyContent: "center" }]}>
                                                    <Text style={styles.bold}>รวมประจำวัน</Text>
                                                </View>
                                                <View style={[styles.cell, { width: "10%" }]}>
                                                    <Text style={[styles.bold, styles.textRight]}>{Number(dateQty).toLocaleString()}</Text>
                                                </View>
                                                <View style={[styles.cell, styles.lastCell, { width: "15%" }]}>
                                                    <Text style={[styles.bold, styles.textRight]}>
                                                        ฿{Number(dateAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        )}

                        {items.length > 0 && (
                            <View style={styles.grandTotalContainer}>
                                <Text style={styles.grandTotalTitle}>ยอดรวมประจำเดือนสะสม ทั้งหมด (Monthly Grand Total)</Text>
                                <View style={{ alignItems: "flex-end" }}>
                                    <Text style={styles.grandTotalVal}>จำนวนสินค้าสั่งซื้อทั้งหมด: {Number(grandTotalQty).toLocaleString()} ห่อ</Text>
                                    <Text style={[styles.grandTotalVal, { marginTop: 4 }]}>
                                        ยอดเงินรวมสุทธิ: ฿{Number(grandTotalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Signatures */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureRow}>
                            <Text>ผู้ตรวจสอบรายงาน</Text>
                            <View style={styles.signatureLine} />
                        </View>
                        <View style={styles.signatureRow}>
                            <Text>ตำแหน่ง</Text>
                            <View style={styles.signatureLine} />
                        </View>
                        <View style={styles.signatureRow}>
                            <Text>วันที่พิมพ์</Text>
                            <View style={[styles.signatureLine, { paddingLeft: 8 }]}>
                                <Text>{new Date().toLocaleDateString("th-TH")}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
}
