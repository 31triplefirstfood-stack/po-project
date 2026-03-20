"use client";

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { thaiBahtText } from '@/lib/thai-baht-text';
import { formatPoNumber } from '@/lib/utils';

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
        padding: 30, // Approx 1cm margin
        fontSize: 10,
        fontFamily: 'Sarabun',
        color: '#333',
    },
    // Header
    headerContainer: {
        marginBottom: 10,
        position: 'relative',
        minHeight: 96,
    },
    companyTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#0099cc', // Light blue/teal color from image
        marginBottom: 3,
    },
    companyAddress: {
        fontSize: 9,
        lineHeight: 1.3,
        marginBottom: 2,
    },
    taxID: {
        fontSize: 9,
        color: 'black',
        fontWeight: 'normal',
    },
    headerRight: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: '40%',
    },
    line: {
        borderBottomWidth: 2,
        borderBottomColor: '#0099cc',
        marginTop: 5,
        marginBottom: 15,
    },

    // Info Blocks
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        alignItems: 'stretch',
    },
    // Left Box: Supplier
    supplierBox: {
        width: '63%',
        backgroundColor: '#f8f9fa', // Light gray bg
        padding: 10,
        borderRadius: 4,
        minHeight: 80,
        paddingRight: 12,
    },
    infoLabel: {
        fontSize: 8,
        color: '#666',
        marginBottom: 2,
    },
    infoText: {
        fontSize: 9,
        fontWeight: 'bold',
        marginBottom: 2,
        lineHeight: 1.35,
        flexShrink: 1,
    },
    infoTextRegular: {
        fontSize: 8.5,
        marginBottom: 1,
        lineHeight: 1.35,
        flexShrink: 1,
    },

    // Right Box: Yellow Box Style
    yellowBox: {
        borderWidth: 1,
        borderColor: '#000',
    },
    yellowHeader: {
        backgroundColor: '#ffc000', // Gold/Darker Yellow
        paddingVertical: 5,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    yellowHeaderText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    yellowSubHeader: {
        backgroundColor: '#fff', // White middle section
        paddingVertical: 8,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    yellowSubHeaderReceipt: {
        backgroundColor: '#5677fc', // Blue for receipt pages
        paddingVertical: 8,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    yellowSubHeaderText: {
        fontSize: 9,
        fontWeight: 'bold',
        lineHeight: 1.25,
    },
    yellowSubHeaderTextReceipt: {
        fontSize: 11,
        fontWeight: 'bold',
        color: 'black',
    },
    yellowBody: {
        backgroundColor: '#ffe699', // Lighter Yellow for bottom
        paddingVertical: 5,
        alignItems: 'center',
    },
    yellowBodyText: {
        fontSize: 11, // Larger for PO Number
        fontWeight: 'bold',
    },
    dateBoxColumn: {
        width: '35%',
        justifyContent: 'space-between',
    },
    dateBox: {
        borderWidth: 1,
        borderColor: '#000',
        minHeight: 38,
        marginBottom: 4,
    },
    dateBoxHeader: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        backgroundColor: '#e9eef3',
    },
    dateBoxHeaderText: {
        fontSize: 8,
        color: '#555',
        textAlign: 'right',
        lineHeight: 1.25,
    },
    dateBoxValue: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        alignItems: 'flex-end',
        justifyContent: 'center',
        flexGrow: 1,
    },
    dateBoxValueText: {
        fontSize: 9,
        fontWeight: 'bold',
        lineHeight: 1.2,
    },

    // Table
    table: {
        width: '100%',
        marginBottom: 5,
        borderWidth: 1,
        borderColor: '#d7dee7',
        borderRadius: 3,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#0099cc',
        color: 'white',
        paddingVertical: 6,
        paddingHorizontal: 4,
        alignItems: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
        paddingVertical: 6,
        paddingHorizontal: 4,
        alignItems: 'center',
    },
    colNo1: { width: '8%', textAlign: 'center', color: 'black' },
    colNo: { width: '8%', textAlign: 'center' },
    colDesc1: { width: '42%', color: 'black', paddingRight: 4 },
    colDesc: { width: '42%', paddingRight: 4 },
    colQty1: { width: '10%', textAlign: 'center', color: 'black' },
    colQty: { width: '10%', textAlign: 'center' },
    colPrice1: { width: '20%', textAlign: 'right', color: 'black' },
    colPrice: { width: '20%', textAlign: 'right' },
    colTotal1: { width: '20%', textAlign: 'right', color: 'black' },
    colTotal: { width: '20%', textAlign: 'right' },

    // Summary Section
    summaryContainer: {
        marginTop: 10,
    },
    summaryContent: {
        flexDirection: 'row',
        justifyContent: 'flex-start', // Changed from flex-end
    },
    totalsBox: {
        width: '100%', // Changed from 45%
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    totalLabel: {
        fontSize: 9,
        color: '#333',
    },
    totalValue: {
        fontSize: 9,
        textAlign: 'right',
    },
    netTotalRow: {
        flexDirection: 'row',
        marginTop: 5,
        borderTopWidth: 2,
        borderTopColor: '#0099cc',
        borderBottomWidth: 2,
        borderBottomColor: '#0099cc', // The image shows blue lines top and bottom of this row
        paddingVertical: 6,
        backgroundColor: 'white', // Ensure it stands out
        alignItems: 'center',
    },
    netTotalLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0099cc',
        width: '40%', // Adjust width
    },
    netTotalText: {
        fontSize: 10,
        width: '60%',
        textAlign: 'right',
    },

    // Baht Text Row
    bahtTextRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 5,
        paddingRight: 5,
    },

    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 40,
    },
    signatureBlock: {
        width: '30%',
        alignItems: 'center',
    },
    signLine: {
        marginTop: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        width: '80%',
        height: 1,
    },
    signatureText: {
        marginTop: 5,
        fontSize: 9,
    },
    // New Summary Table Styles
    summaryTable: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#d7dee7',
        borderRadius: 3,
        overflow: 'hidden',
    },
    summaryRow: {
        flexDirection: 'row',
        minHeight: 20,
        alignItems: 'center',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
    },
    summaryLabelCol: {
        width: '70%',
        padding: 5,
        borderRightWidth: 0.5,
        borderRightColor: '#e2e8f0',
        lineHeight: 1.3,
    },
    summaryValueCol: {
        width: '30%',
        padding: 5,
        textAlign: 'right',
        lineHeight: 1.3,
    },
    // Net Total Row specific
    netTotalRowNew: {
        flexDirection: 'row',
        minHeight: 42,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    netTotalLabelCol: {
        width: '20%',
        padding: 5,
        borderRightWidth: 0.5,
        borderRightColor: '#e2e8f0',
    },
    netTotalTextCol: {
        width: '50%',
        padding: 5,
        textAlign: 'center',
        borderRightWidth: 0.5,
        borderRightColor: '#e2e8f0',
        lineHeight: 1.25,
    },
    netTotalValueCol: {
        width: '30%',
        padding: 5,
        textAlign: 'right',
        lineHeight: 1.25,
    },
});

interface POData {
    poNumber: string;
    issueDate: string;
    paymentDate?: string | null;
    deliveryDate: string;
    items: {
        productName: string;
        quantity: number;
        unit: string;
        unitPrice: number;
    }[];
    supplier: {
        companyName: string;
        contactPerson: string;
        phone: string;
        email: string;
        address: string;
        taxId: string;
    };
}

const POTemplate = ({ data }: { data: POData }) => {
    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const vatRate = 0.07;
    const vatAmount = subtotal * vatRate;
    const grandTotal = subtotal + vatAmount;
    const totalQty = data.items.reduce((sum, item) => sum + Number(item.quantity), 0);
    const thaiText = thaiBahtText(grandTotal);
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
    const splitAddressLines = (value?: string) => {
        if (!value) return [''];

        const normalized = value.replace(/\s+/g, ' ').trim();
        const postalMatch = normalized.match(/(\d{5})$/);
        const postalCode = postalMatch?.[1] ?? '';
        const baseAddress = postalCode
            ? normalized.slice(0, normalized.length - postalCode.length).trim()
            : normalized;

        const maxLineLength = 30;
        const tokens = baseAddress.split(' ').filter(Boolean);
        const lines: string[] = [];
        let currentLine = '';

        for (const token of tokens) {
            const nextLine = currentLine ? `${currentLine} ${token}` : token;
            if (nextLine.length <= maxLineLength) {
                currentLine = nextLine;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = token;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        if (postalCode) {
            if (lines.length === 0) {
                lines.push(postalCode);
            } else {
                const lastLine = lines[lines.length - 1];
                if (`${lastLine} ${postalCode}`.length <= maxLineLength) {
                    lines[lines.length - 1] = `${lastLine} ${postalCode}`;
                } else {
                    lines.push(postalCode);
                }
            }
        }

        return lines.filter(Boolean);
    };
    const paymentDateText = formatThaiDate(data.paymentDate);
    const dueDateText = 'เครดิต 30 วัน';
    const addressLines = splitAddressLines(data.supplier.address);

    const pages = [
        { label: 'ต้นฉบับ/Original', isReceipt: false },
        { label: 'สำเนา/Copy', isReceipt: false },
        { label: 'สำหรับลูกค้า/For Customers', isReceipt: false },
        { label: 'สำเนาสำหรับลูกค้า/Copy', isReceipt: false },
        { label: 'ต้นฉบับ/Original', isReceipt: true },
        { label: 'สำเนา/Copy', isReceipt: true },
    ];

    return (
        <Document>
            {pages.map((page, pageIndex) => (
                <Page key={pageIndex} size="A4" style={styles.page}>
                    {/* Header */}
                    <View style={styles.headerContainer}>
                        <Text style={styles.companyTitle}>บริษัท ตรีเอกอุตสาหกรรมอาหาร จำกัด (สำนักงานใหญ่)) </Text>
                        <Text style={styles.companyAddress}>19/12 ถ.หนองประทีป ต.หนองป่าครั่ง อ.เมือง จ.เชียงใหม่ 50000</Text>
                        <Text style={styles.companyAddress}>เบอร์โทรศัพท์ 081-599-6698, 086-900-7225 สำนักงาน 053-245-750             </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                            <Text style={styles.companyAddress}>เลขที่ประจำตัวผู้เสียภาษีอากร : </Text>
                            <Text style={styles.taxID}> 0505566007959</Text>
                        </View>
                        <View style={styles.headerRight}>
                            <View style={styles.yellowBox}>
                                <View style={styles.yellowHeader}>
                                    <Text style={styles.yellowHeaderText}>{page.label}</Text>
                                </View>
                                <View style={page.isReceipt ? styles.yellowSubHeaderReceipt : styles.yellowSubHeader}>
                                    {page.isReceipt ? (
                                        <Text style={styles.yellowSubHeaderTextReceipt}>ใบเสร็จ / Receipt</Text>
                                    ) : (
                                        <>
                                            <Text style={styles.yellowSubHeaderText}>ใบกำกับภาษี/ใบส่งของ/ใบแจ้งหนี้ </Text>
                                            <Text style={styles.yellowSubHeaderText}>Tax Invoice/Delivery Order/Invoice</Text>
                                        </>
                                    )}
                                </View>
                                <View style={styles.yellowBody}>
                                    <Text style={styles.yellowBodyText}>{formatPoNumber(data.poNumber)}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.line} />

                    {/* Info Blocks */}
                    <View style={styles.infoContainer}>
                        {/* Left Block: Supplier */}
                        <View style={styles.supplierBox}>
                            <Text style={styles.infoLabel}>ลูกค้า/Customer             </Text>
                            <Text style={styles.infoText}>{data.supplier.companyName}                </Text>
                            {addressLines.map((line, index) => (
                                <Text key={`${line}-${index}`} style={styles.infoTextRegular}>{line}                </Text>
                            ))}
                            <Text style={{ ...styles.infoTextRegular, marginTop: 2 }}>โทร: {data.supplier.phone}</Text>
                            <Text style={styles.infoTextRegular}>เลขผู้เสียภาษี: {data.supplier.taxId}</Text>
                        </View>

                        <View style={styles.dateBoxColumn}>
                            <View style={styles.dateBox}>
                                <View style={styles.dateBoxHeader}>
                                    <Text style={styles.dateBoxHeaderText}>วันที่ชำระ/Date</Text>
                                </View>
                                <View style={styles.dateBoxValue}>
                                    <Text style={styles.dateBoxValueText}>{paymentDateText}</Text>
                                </View>
                            </View>
                            <View style={{ ...styles.dateBox, marginBottom: 0 }}>
                                <View style={styles.dateBoxHeader}>
                                    <Text style={styles.dateBoxHeaderText}>วันครบกำหนด/Due Date  </Text>
                                </View>
                                <View style={styles.dateBoxValue}>
                                    <Text style={styles.dateBoxValueText}>{dueDateText}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Table */}
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.colNo1}>ลำดับที่ </Text>
                            <Text style={styles.colDesc1}>รายการสินค้า</Text>
                            <Text style={styles.colQty1}>จำนวนห่อ </Text>
                            <Text style={styles.colPrice1}>ราคา/หน่วย</Text>
                            <Text style={styles.colTotal1}>รวม</Text>
                        </View>
                        {data.items.map((item, index) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={styles.colNo}>{index + 1}</Text>
                                <Text style={styles.colDesc}>{item.productName}</Text>
                                <Text style={styles.colQty}>{item.quantity}</Text>
                                <Text style={styles.colPrice}>{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 8, maximumFractionDigits: 8 })}</Text>
                                <Text style={styles.colTotal}>{(item.quantity * item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 8, maximumFractionDigits: 8 })}</Text>
                            </View>
                        ))}
                        {/* Total Quantity Row */}
                        <View style={styles.tableRow}>
                            <Text style={{ width: '50%', paddingLeft: 4 }}>จำนวนสินค้าทั้งหมดที่สั่งซื้อ ({data.items[0]?.unit || 'ห่อ'})</Text>
                            <Text style={styles.colQty}>{totalQty}</Text>
                            <Text style={{ width: '40%' }}></Text>
                        </View>
                    </View>

                    {/* Summary */}
                    {/* Summary */}
                    <View style={styles.summaryTable}>
                        {/* Row 1: Subtotal */}
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabelCol}>ราคาสินค้าก่อนภาษีมูลค่าเพิ่ม </Text>
                            <Text style={styles.summaryValueCol}>{subtotal.toLocaleString(undefined, { minimumFractionDigits: 8, maximumFractionDigits: 8 })}</Text>
                        </View>
                        {/* Row 2: VAT */}
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabelCol}>ภาษีมูลค่าเพิ่ม 7%</Text>
                            <Text style={styles.summaryValueCol}>{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 8, maximumFractionDigits: 8 })}</Text>
                        </View>
                        {/* Row 3: Net Total */}
                        <View style={styles.netTotalRowNew}>
                            <Text style={{ ...styles.netTotalLabelCol, color: '#0099cc', fontWeight: 'bold', fontSize: 13 }}>รายรับสุทธิ</Text>
                            <Text style={{ ...styles.netTotalTextCol, color: '#0099cc', fontWeight: 'bold', fontSize: 13 }}>{thaiText} </Text>
                            <Text style={{ ...styles.netTotalValueCol, color: '#0099cc', fontWeight: 'bold', fontSize: 13 }}>{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</Text>
                        </View>
                    </View>



                    {/* Transfer Details Box */}
                    <View style={{ marginTop: 15, borderWidth: 1, borderColor: '#000', padding: 8, width: '55%', alignSelf: 'flex-start' }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}>กรุณาโอนเงินตามหมายเลขบัญชี</Text>
                        <Text style={{ fontSize: 10 }}>ธนาคารกสิกรไทย สาขาถนนเจริญเมือง เชียงใหม่ </Text>
                        <Text style={{ fontSize: 10 }}>ออมทรัพย์ 156-1-07114-0</Text>
                        <Text style={{ fontSize: 10 }}>บริษัท ตรีเอกอุตสาหกรรมอาหาร จำกัด  </Text>
                    </View>

                    {/* Footer Signatures */}
                    <View style={styles.footer}>
                        <View style={styles.signatureBlock}>
                            <View style={styles.signLine} />
                            <Text style={styles.signatureText}>ผู้รับสินค้า</Text>
                            <Text style={styles.signatureText}> </Text>
                            <Text style={styles.signatureText}> </Text>
                            <View style={{ flexDirection: 'row', marginTop: 5 }}>
                                <Text style={styles.signatureText}> </Text>
                                <Text style={{ fontSize: 9 }}>วันที่ ________________________________</Text>
                            </View>
                        </View>
                        <View style={styles.signatureBlock}>
                            <View style={styles.signLine} />
                            <Text style={styles.signatureText}>ผู้ส่งสินค้า</Text>
                            <Text style={styles.signatureText}> </Text>
                            <Text style={styles.signatureText}> </Text>
                            <View style={{ flexDirection: 'row', marginTop: 5 }}>
                                <Text style={styles.signatureText}> </Text>
                                <Text style={{ fontSize: 9 }}>วันที่ ________________________________</Text>
                            </View>
                        </View>
                        <View style={styles.signatureBlock}>
                            <View style={styles.signLine} />
                            <Text style={styles.signatureText}>นายทรงวุฒิ เดชะ </Text>
                            <Text style={styles.signatureText}>(ผู้มีอำนาจลงนาม) </Text>
                            <Text style={styles.signatureText}> </Text>
                            <View style={{ flexDirection: 'row', marginTop: 5 }}>
                                <Text style={styles.signatureText}> </Text>
                                <Text style={{ fontSize: 9 }}>วันที่ {paymentDateText || "________________________________"}</Text>
                            </View>
                        </View>
                    </View>
                </Page >
            ))}
        </Document >
    );
};

export default POTemplate;
