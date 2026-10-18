/* eslint-disable @typescript-eslint/no-require-imports -- Node tests for browser API boundaries. */
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS', moduleResolution: 'node' } });
const { prepareFileSave, getPoPdfFilename } = require('../src/lib/file-save');
afterEach(() => { delete global.window; delete global.document; });

test('PDF filenames use the displayed PO number instead of an object URL UUID', () => {
    assert.equal(getPoPdfFilename('TAX2569-10-B045'), 'TAX2569-10-B045.pdf');
    assert.equal(getPoPdfFilename('Bill25691018-B045'), 'TAX2569-10-B045.pdf');
});

test('opens Save As immediately and writes the complete blob to the selected file', async () => {
    const calls = [];
    let written;
    global.window = { showSaveFilePicker: async options => {
        calls.push(options);
        return { createWritable: async () => ({ write: async blob => { written = await blob.text(); }, close: async () => calls.push('closed') }) };
    } };
    const pending = prepareFileSave({ name: 'PO-2569-10.zip', mimeType: 'application/zip', extension: '.zip' });
    assert.equal(calls[0].suggestedName, 'PO-2569-10.zip');
    const target = await pending;
    assert.equal(await target.save(new Blob(['complete bytes'])), 'saved');
    assert.equal(written, 'complete bytes');
    assert.equal(calls.at(-1), 'closed');
});

test('cancelling Save As stops the download', async () => {
    global.window = { showSaveFilePicker: async () => { throw new DOMException('cancelled', 'AbortError'); } };
    assert.equal(await prepareFileSave({ name: 'file.pdf', mimeType: 'application/pdf', extension: '.pdf' }), null);
});

test('failed writes abort and report failure rather than success', async () => {
    let aborted = false;
    global.window = { showSaveFilePicker: async () => ({ createWritable: async () => ({
        write: async () => { throw new Error('disk full'); }, close: async () => assert.fail('must not close as successful'),
        abort: async () => { aborted = true; },
    }) }) };
    const target = await prepareFileSave({ name: 'file.pdf', mimeType: 'application/pdf', extension: '.pdf' });
    await assert.rejects(target.save(new Blob(['PDF'])), /disk full/);
    assert.equal(aborted, true);
});

test('unsupported browsers use a download link with the correct PDF filename', async () => {
    let clicked = false;
    const anchor = { click: () => { clicked = true; }, remove: () => {} };
    global.window = { setTimeout: callback => callback() };
    global.document = { createElement: () => anchor, body: { appendChild: () => {} } };
    const target = await prepareFileSave({ name: getPoPdfFilename('TAX2569-10-B045'), mimeType: 'application/pdf', extension: '.pdf' });
    assert.equal(await target.save(new Blob(['PDF'])), 'download');
    assert.equal(anchor.download, 'TAX2569-10-B045.pdf');
    assert.equal(clicked, true);
});
