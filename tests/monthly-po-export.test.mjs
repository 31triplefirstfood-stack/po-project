import test from 'node:test';
import assert from 'node:assert/strict';
import { crc32 } from 'node:zlib';
import { getMonthlyRange, buildPoArchive, selectArchiveNames } from '../src/lib/monthly-po-export.ts';

test('legacy PO numbers that share a display number retain distinct filenames', () => {
  assert.deepEqual(selectArchiveNames([
    { original: 'Bill25691001-B001', display: 'TAX2569-10-B001' },
    { original: 'Bill25691002-B001', display: 'TAX2569-10-B001' },
    { original: 'TAX2569-10-B001', display: 'TAX2569-10-B001' },
    { original: 'Bill25691003-B002', display: 'TAX2569-10-B002' },
  ]), ['Bill25691001-B001.pdf', 'Bill25691002-B001.pdf', 'TAX2569-10-B001.pdf', 'TAX2569-10-B002.pdf']);
});

test('October range includes Bangkok midnight and excludes next month', () => {
  const { gte, lt } = getMonthlyRange(2026, 10);
  assert.equal(gte.toISOString(), '2026-09-30T17:00:00.000Z');
  assert.equal(lt.toISOString(), '2026-10-31T17:00:00.000Z');
});

test('December rolls into the next year and leap February is supported', () => {
  assert.equal(getMonthlyRange(2026, 12).lt.toISOString(), '2026-12-31T17:00:00.000Z');
  assert.equal(getMonthlyRange(2028, 2).lt.toISOString(), '2028-02-29T17:00:00.000Z');
  for (const [year, month] of [[2026, 0], [2026, 13], [2026, 1.5], [NaN, 1], [2569, 10]]) {
    assert.throws(() => getMonthlyRange(year, month));
  }
});

test('ZIP preserves every PDF byte and sorts files by PO number', () => {
  const archive = buildPoArchive([
    { name: 'TAX2569-10-B045.pdf', data: new Uint8Array([37, 80, 68, 70, 45, 255]) },
    { name: 'TAX2569-10-B001.pdf', data: new Uint8Array([37, 80, 68, 70, 45, 0]) },
  ]);
  const view = new DataView(archive.buffer);
  assert.equal(view.getUint32(0, true), 0x04034b50);
  const nameLength = view.getUint16(26, true);
  assert.equal(new TextDecoder().decode(archive.slice(30, 30 + nameLength)), 'TAX2569-10-B001.pdf');
  assert.deepEqual([...archive.slice(30 + nameLength, 36 + nameLength)], [37, 80, 68, 70, 45, 0]);
  assert.equal(view.getUint32(archive.length - 22, true), 0x06054b50);
  assert.equal(view.getUint16(archive.length - 12, true), 2);
  let central = view.getUint32(archive.length - 6, true);
  for (let i = 0; i < 2; i++) {
    assert.equal(view.getUint32(central, true), 0x02014b50);
    const local = view.getUint32(central + 42, true);
    const length = view.getUint32(central + 24, true);
    const start = local + 30 + view.getUint16(local + 26, true);
    assert.equal(crc32(archive.slice(start, start + length)), view.getUint32(central + 16, true));
    central += 46 + view.getUint16(central + 28, true);
  }
  assert.equal(central, archive.length - 22);
});

test('ZIP refuses empty exports, duplicate filenames and unsafe paths', () => {
  assert.throws(() => buildPoArchive([]));
  const entry = { name: 'TAX2569-10-B045.pdf', data: new Uint8Array([1]) };
  assert.throws(() => buildPoArchive([entry, entry]));
  assert.throws(() => buildPoArchive([{ ...entry, name: '../bad.pdf' }]));
});
