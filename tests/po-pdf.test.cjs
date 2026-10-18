/* eslint-disable @typescript-eslint/no-require-imports -- Node-only test of Next TSX aliases. */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

// Resolve the same aliases Next uses when testing the real PDF template in Node.
require('ts-node').register({ transpileOnly: true, compilerOptions: {
    module: 'CommonJS', moduleResolution: 'node', jsx: 'react-jsx',
} });
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
    return originalResolve.call(this, request.startsWith('@/')
        ? path.resolve(__dirname, '../src', request.slice(2)) : request, ...args);
};

test('monthly API queries the full month without status or production exclusions', async () => {
    let query;
    global.prisma = { purchaseOrder: { findMany: async options => {
        query = options;
        return [{ id: 'pending' }, { id: 'completed' }];
    } } };
    const { GET } = require('../src/app/api/purchase-orders/monthly-export/route');
    const { NextRequest } = require('next/server');
    const result = await GET(new NextRequest('http://localhost/api/purchase-orders/monthly-export?year=2026&month=10'));
    assert.equal(result.status, 200);
    assert.deepEqual(await result.json(), [{ id: 'pending' }, { id: 'completed' }]);
    assert.deepEqual(Object.keys(query.where), ['issueDate']);
    assert.equal(query.where.issueDate.gte.toISOString(), '2026-09-30T17:00:00.000Z');
    assert.equal(query.where.issueDate.lt.toISOString(), '2026-10-31T17:00:00.000Z');
    assert.equal(query.include.supplier, true);
    assert.equal(query.include.items.include.product, true);
    query = undefined;
    const invalid = await GET(new NextRequest('http://localhost/api/purchase-orders/monthly-export?year=2569&month=10'));
    assert.equal(invalid.status, 400);
    assert.equal(query, undefined);
});

test('real PO template renders readable PDFs with Thai fonts and item quantities', async () => {
    const React = require('react');
    const { pdf, Font } = require('@react-pdf/renderer');
    const Template = require('../src/components/pdf/POTemplate').default;
    assert.ok(Font.getRegisteredFontFamilies().includes('PoSarabun'));
    const data = {
        poNumber: 'TAX2569-10-B045', issueDate: '2026-10-18T00:00:00Z',
        deliveryDate: '2026-10-20T00:00:00Z', paymentDate: null,
        supplier: { companyName: 'บริษัท ทดสอบ จำกัด', contactPerson: '', phone: '', email: '', address: 'เชียงใหม่ 50000', taxId: '1234567890123' },
        items: [{ productName: 'สินค้า ทดสอบ', quantity: 2, unit: 'ถุง', unitPrice: 100 }],
    };
    const blob = await pdf(React.createElement(Template, { data })).toBlob();
    const bytes = new Uint8Array(await blob.arrayBuffer());
    assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), '%PDF-');
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse({ data: bytes });
    try {
        const result = await parser.getText();
        assert.ok(result.total >= 1);
        assert.ok(result.text.includes(data.poNumber));
        assert.ok(result.text.includes('214.00'));
    } finally { await parser.destroy(); }
});

test('individual PDF endpoint supplies the PO filename to the native viewer', async () => {
    global.prisma.purchaseOrder.findUnique = async () => ({
        poNumber: 'TAX2569-10-B045', issueDate: new Date('2026-10-18T00:00:00Z'),
        deliveryDate: new Date('2026-10-20T00:00:00Z'), paymentDate: null,
        supplier: { companyName: 'บริษัท ทดสอบ จำกัด', address: 'เชียงใหม่', taxId: '', phone: '', email: '', contactPerson: '' },
        items: [{ itemName: 'ทดสอบ', quantity: '2', unitPrice: '100', product: null }],
    });
    const { GET } = require('../src/app/api/purchase-orders/[id]/pdf/route');
    const response = await GET(new Request('http://localhost'), { params: Promise.resolve({ id: 'test-po' }) });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-disposition'), /inline; filename="TAX2569-10-B045.pdf"/);
    assert.equal(response.headers.get('content-type'), 'application/pdf');
    assert.equal(new TextDecoder().decode((await response.arrayBuffer()).slice(0, 5)), '%PDF-');
    global.prisma.purchaseOrder.findUnique = async () => null;
    const missing = await GET(new Request('http://localhost'), { params: Promise.resolve({ id: 'missing' }) });
    assert.equal(missing.status, 404);
});
