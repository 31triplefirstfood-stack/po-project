/** Half-open interval for issue dates in Thailand; UI supplies Gregorian years. */
export function getMonthlyRange(year: number, month: number) {
    if (!Number.isInteger(year) || year < 1900 || year > 2200 ||
        !Number.isInteger(month) || month < 1 || month > 12) {
        throw new Error('Invalid month or year');
    }
    return {
        gte: new Date(Date.UTC(year, month - 1, 1) - 7 * 60 * 60 * 1000),
        lt: new Date(Date.UTC(year, month, 1) - 7 * 60 * 60 * 1000),
    };
}

interface ArchiveEntry { name: string; data: Uint8Array }

// Legacy numbers can normalize to the same display number. Keep their raw
// identifiers in that case so no PO is omitted or overwritten.
export function selectArchiveNames(orders: { original: string; display: string }[]) {
    const counts = new Map<string, number>();
    for (const order of orders) counts.set(order.display, (counts.get(order.display) ?? 0) + 1);
    return orders.map(order => `${counts.get(order.display) === 1 ? order.display : order.original}.pdf`);
}

/** ZIP STORE: PDFs are already compressed. No extra runtime dependency needed. */
export function buildPoArchive(entries: ArchiveEntry[]): Uint8Array<ArrayBuffer> {
    if (!entries.length || entries.length > 65535) throw new Error('Invalid archive size');
    const chunks: Uint8Array[] = [];
    const directory: Uint8Array[] = [];
    const names = new Set<string>();
    let offset = 0;
    for (const entry of [...entries].sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
        if (!entry.name || /[\\/:*?"<>|\x00-\x1f]/.test(entry.name) || entry.name.includes('..') ||
            names.has(entry.name) || !entry.data.length) {
            throw new Error('ชื่อไฟล์ PO ซ้ำหรือไม่ถูกต้อง กรุณาตรวจสอบข้อมูลก่อนดาวน์โหลด');
        }
        names.add(entry.name);
        const name = new TextEncoder().encode(entry.name);
        if (name.length > 65535 || offset + entry.data.length > 0xffffffff) throw new Error('Archive too large');
        let crc = 0xffffffff;
        for (const byte of entry.data) {
            crc ^= byte;
            for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
        }
        crc = (crc ^ 0xffffffff) >>> 0;
        const local = new Uint8Array(30 + name.length);
        const lv = new DataView(local.buffer);
        lv.setUint32(0, 0x04034b50, true);
        lv.setUint16(4, 20, true);
        lv.setUint16(6, 0x0800, true); // UTF-8
        lv.setUint16(12, 33, true); // 1980-01-01
        lv.setUint32(14, crc, true);
        lv.setUint32(18, entry.data.length, true);
        lv.setUint32(22, entry.data.length, true);
        lv.setUint16(26, name.length, true);
        local.set(name, 30);
        chunks.push(local, entry.data);
        const central = new Uint8Array(46 + name.length);
        const cv = new DataView(central.buffer);
        cv.setUint32(0, 0x02014b50, true);
        cv.setUint16(4, 20, true);
        cv.setUint16(6, 20, true);
        cv.setUint16(8, 0x0800, true);
        cv.setUint16(14, 33, true);
        cv.setUint32(16, crc, true);
        cv.setUint32(20, entry.data.length, true);
        cv.setUint32(24, entry.data.length, true);
        cv.setUint16(28, name.length, true);
        cv.setUint32(42, offset, true);
        central.set(name, 46);
        directory.push(central);
        offset += local.length + entry.data.length;
    }
    const directorySize = directory.reduce((sum, chunk) => sum + chunk.length, 0);
    if (offset + directorySize > 0xffffffff) throw new Error('Archive too large');
    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, directorySize, true);
    ev.setUint32(16, offset, true);
    const result = new Uint8Array(offset + directorySize + end.length);
    let position = 0;
    for (const chunk of [...chunks, ...directory, end]) {
        result.set(chunk, position);
        position += chunk.length;
    }
    return result;
}
