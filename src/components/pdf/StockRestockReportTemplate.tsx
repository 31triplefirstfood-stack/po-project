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
        fontSize: 10,
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
    },
    row: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        minHeight: 38,
        alignItems: "stretch",
    },
    headerRow: {
        backgroundColor: "#eff6ff",
        minHeight: 34,
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

interface RestockReportItem {
    id: string;
    receiptNumber: string;
    quantity: number;
    date: string;
    stockItem: {
        name: string;
        unit: string;
        currentQty: number;
    };
}

interface StockRestockReportTemplateProps {
    items: RestockReportItem[];
}

export default function StockRestockReportTemplate({ items }: StockRestockReportTemplateProps) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>ประวัติเติมสต็อกวัตถุดิบ</Text>
                    <Text style={styles.subtitle}>คงเหลือในเอกสารนี้เป็นคงเหลือปัจจุบันของแต่ละวัตถุดิบ</Text>
                </View>

                <View style={styles.table}>
                    <View style={[styles.row, styles.headerRow]}>
                        <View style={[styles.cell, { width: "24%" }]}><Text style={styles.bold}>ชื่อวัตถุดิบ   </Text></View>
                        <View style={[styles.cell, { width: "22%" }]}><Text style={styles.bold}>เลขใบเสร็จ   </Text></View>
                        <View style={[styles.cell, { width: "16%" }]}><Text style={styles.bold}>วันที่   </Text></View>
                        <View style={[styles.cell, { width: "12%" }]}><Text style={styles.bold}>จำนวน   </Text></View>
                        <View style={[styles.cell, { width: "10%" }]}><Text style={styles.bold}>หน่วย   </Text></View>
                        <View style={[styles.cell, styles.lastCell, { width: "16%" }]}><Text style={styles.bold}>คงเหลือปัจจุบัน</Text></View>
                    </View>

                    {items.map((item) => (
                        <View key={item.id} style={styles.row}>
                            <View style={[styles.cell, { width: "24%" }]}>
                                <Text>{item.stockItem.name}   </Text>
                            </View>
                            <View style={[styles.cell, { width: "22%" }]}>
                                <Text>{item.receiptNumber}   </Text>
                            </View>
                            <View style={[styles.cell, { width: "16%" }]}>
                                <Text>{new Date(item.date).toLocaleDateString("th-TH")}   </Text>
                            </View>
                            <View style={[styles.cell, { width: "12%" }]}>
                                <Text>{Number(item.quantity).toLocaleString()}   </Text>
                            </View>
                            <View style={[styles.cell, { width: "10%" }]}>
                                <Text>{item.stockItem.unit}   </Text>
                            </View>
                            <View style={[styles.cell, styles.lastCell, { width: "16%" }]}>
                                <Text>{Number(item.stockItem.currentQty).toLocaleString()} {item.stockItem.unit}   </Text>
                            </View>
                        </View>
                    ))}
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
