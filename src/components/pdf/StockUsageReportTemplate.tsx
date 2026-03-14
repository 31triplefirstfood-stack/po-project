"use client";

import React from "react";
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

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
        minHeight: 46,
        alignItems: "stretch",
    },
    headerRow: {
        backgroundColor: "#eff6ff",
        minHeight: 36,
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
    image: {
        width: 32,
        height: 32,
        objectFit: "cover",
        borderRadius: 4,
    },
    imageFallback: {
        fontSize: 8,
        color: "#9ca3af",
    },
    bold: {
        fontWeight: "bold",
    },
    signatureSection: {
        marginTop: 6,
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
    stockItem: {
        name: string;
        imageUrl: string | null;
        currentQty: number;
        unit: string;
    };
}

interface StockUsageReportTemplateProps {
    items: UsageReportItem[];
}

export default function StockUsageReportTemplate({ items }: StockUsageReportTemplateProps) {
    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>ประวัติการใช้วัตถุดิบ</Text>
                    <Text style={styles.subtitle}>จำนวนคงเหลือในเอกสารนี้เป็นจำนวนคงเหลือปัจจุบัน</Text>
                </View>

                <View style={styles.table}>
                    <View style={[styles.row, styles.headerRow]}>
                        <View style={[styles.cell, { width: "14%" }]}><Text style={styles.bold}>วันที่</Text></View>
                        <View style={[styles.cell, { width: "14%" }]}><Text style={styles.bold}>รูปวัตถุดิบ</Text></View>
                        <View style={[styles.cell, { width: "32%" }]}><Text style={styles.bold}>ชื่อวัตถุดิบ</Text></View>
                        <View style={[styles.cell, { width: "18%" }]}><Text style={styles.bold}>จำนวนที่เบิก</Text></View>
                        <View style={[styles.cell, styles.lastCell, { width: "22%" }]}><Text style={styles.bold}>คงเหลือปัจจุบัน</Text></View>
                    </View>

                    {items.map((item) => (
                        <View key={item.id} style={styles.row}>
                            <View style={[styles.cell, { width: "14%" }]}>
                                <Text>{new Date(item.date).toLocaleDateString("th-TH")}</Text>
                            </View>
                            <View style={[styles.cell, { width: "14%", alignItems: "center" }]}>
                                {item.stockItem.imageUrl ? (
                                    <Image src={item.stockItem.imageUrl} style={styles.image} />
                                ) : (
                                    <Text style={styles.imageFallback}>ไม่มีรูป</Text>
                                )}
                            </View>
                            <View style={[styles.cell, { width: "32%" }]}>
                                <Text>{item.stockItem.name}</Text>
                            </View>
                            <View style={[styles.cell, { width: "18%" }]}>
                                <Text>{Number(item.quantity).toLocaleString()} {item.stockItem.unit}</Text>
                            </View>
                            <View style={[styles.cell, styles.lastCell, { width: "22%" }]}>
                                <Text>{Number(item.stockItem.currentQty).toLocaleString()} {item.stockItem.unit}</Text>
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
                            <View style={styles.signatureLine} />
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
}
