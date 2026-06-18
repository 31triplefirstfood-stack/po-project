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
        padding: 24,
        fontFamily: "Sarabun",
        fontSize: 9,
        color: "#111827",
    },
    header: {
        marginBottom: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 10,
        color: "#4b5563",
    },
    table: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        marginBottom: 20,
    },
    row: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        minHeight: 30,
        alignItems: "stretch",
    },
    headerRow: {
        backgroundColor: "#eff6ff",
        minHeight: 28,
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
    signatureSection: {
        marginTop: 20,
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    signatureBox: {
        width: 240,
        gap: 10,
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

interface UsageReportItem {
    id: string;
    date: string;
    quantity: number;
    checkerName: string | null;
    checkedAt: string | null;
    displayDate?: string;
    note: string | null;
    stockItem: {
        name: string;
        imageUrl: string | null;
        currentQty: number;
        unit: string;
    };
}

interface StockUsageReportTemplateProps {
    items: UsageReportItem[];
    viewMode: "day" | "month";
    displayDate: string;
}

export default function StockUsageReportTemplate({ items, viewMode, displayDate }: StockUsageReportTemplateProps) {
    const renderNote = (note: string | null) => {
        if (!note) return "-";
        if (note.startsWith("ตัดสต็อกอัตโนมัติสำหรับการผลิต")) {
            return "ตัดสต็อกอัตโนมัติสำหรับการผลิต";
        }
        return note;
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>รายงานประวัติการใช้วัตถุดิบ ({viewMode === "day" ? "รายวัน" : "รายเดือน"})</Text>
                    <Text style={styles.subtitle}>ประจำวันที่ {displayDate}</Text>
                </View>
 
                <View style={styles.table}>
                    <View style={[styles.row, styles.headerRow]}>
                        <View style={[styles.cell, { width: "20%" }]}><Text style={styles.bold}>วันที่</Text></View>
                        <View style={[styles.cell, { width: "25%" }]}><Text style={styles.bold}>ชื่อวัตถุดิบ</Text></View>
                        <View style={[styles.cell, { width: "18%" }]}><Text style={styles.bold}>จำนวนที่เบิก</Text></View>
                        <View style={[styles.cell, { width: "17%" }]}><Text style={styles.bold}>ผู้เบิก</Text></View>
                        <View style={[styles.cell, styles.lastCell, { width: "20%" }]}><Text style={styles.bold}>หมายเหตุ</Text></View>
                    </View>
 
                    {items.length === 0 ? (
                        <View style={styles.row}>
                            <View style={[styles.cell, styles.lastCell, { width: "100%", alignItems: "center" }]}>
                                <Text>ไม่มีประวัติการใช้วัตถุดิบในวันนี้/เดือนนี้</Text>
                            </View>
                        </View>
                    ) : (
                        items.map((item) => (
                            <View key={item.id} style={styles.row}>
                                <View style={[styles.cell, { width: "20%" }]}>
                                    <Text>{item.date ? new Date(item.date).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }) : "-"}</Text>
                                </View>
                                <View style={[styles.cell, { width: "25%" }]}>
                                    <Text>{item.stockItem.name}</Text>
                                </View>
                                <View style={[styles.cell, { width: "18%" }]}>
                                    <Text>{Number(item.quantity).toLocaleString()} {item.stockItem.unit}</Text>
                                </View>
                                <View style={[styles.cell, { width: "17%" }]}>
                                    <Text>{item.checkerName || "-"}</Text>
                                </View>
                                <View style={[styles.cell, styles.lastCell, { width: "20%" }]}>
                                    <Text>{renderNote(item.note)}</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                <View style={styles.signatureSection}>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureRow}>
                            <Text>ผู้ตรวจสอบ</Text>
                            <View style={styles.signatureLine} />
                        </View>
                        <View style={styles.signatureRow}>
                            <Text>ลายเซ็น</Text>
                            <View style={styles.signatureLine} />
                        </View>
                        <View style={styles.signatureRow}>
                            <Text>วันที่</Text>
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
