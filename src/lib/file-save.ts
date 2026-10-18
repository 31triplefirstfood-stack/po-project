import { formatPoNumber } from './utils';

interface SaveOptions { name: string; mimeType: string; extension: string }
interface SaveTarget { save: (blob: Blob) => Promise<'saved' | 'download'> }
interface FileWriter {
    write: (blob: Blob) => Promise<void>;
    close: () => Promise<void>;
    abort: () => Promise<void>;
}
type SaveWindow = Window & {
    showSaveFilePicker?: (options: {
        suggestedName: string;
        id: string;
        types: { description: string; accept: Record<string, string[]> }[];
    }) => Promise<{ createWritable: () => Promise<FileWriter> }>;
};

export function getPoPdfFilename(poNumber: string) {
    return `${formatPoNumber(poNumber).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim()}.pdf`;
}

/** Call directly from the click handler, before network/rendering awaits. */
export async function prepareFileSave(options: SaveOptions): Promise<SaveTarget | null> {
    const browser = window as SaveWindow;
    if (typeof browser.showSaveFilePicker === 'function') {
        let handle;
        try {
            handle = await browser.showSaveFilePicker({
                suggestedName: options.name,
                id: 'po-documents',
                types: [{ description: options.extension === '.zip' ? 'ZIP archive' : 'PDF document',
                    accept: { [options.mimeType]: [options.extension] } }],
            });
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return null;
            throw error;
        }
        return { save: async blob => {
            const writer = await handle.createWritable();
            try {
                await writer.write(blob);
                await writer.close();
                return 'saved';
            } catch (error) {
                await writer.abort().catch(() => undefined);
                throw error;
            }
        } };
    }
    // Browsers without the picker retain their normal download/save settings.
    return { save: async blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = options.name;
        document.body.appendChild(link);
        try { link.click(); } finally {
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        }
        return 'download';
    } };
}
