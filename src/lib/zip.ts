/**
 * Minimal, dependency-free ZIP writer (STORE method — no compression).
 *
 * Used for client-side "Download all" bundles (e.g. all certificates) without
 * pulling in a library. STORE is universally readable; certificates are small
 * SVG/text files, so skipping DEFLATE costs almost nothing.
 *
 * If the backend later prefers to serve a server-generated archive, swap the
 * call sites to a fetch — the trigger/filename/progress UI stays ours.
 */

const encoder = new TextEncoder();

// Precomputed CRC-32 table.
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC_TABLE[(crc ^ bytes[i]!) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Convert JS Date → DOS date/time words used by the ZIP format. */
function dosDateTime(date: Date): { time: number; date: number } {
  const time =
    (date.getHours() << 11) | (date.getMinutes() << 5) | (Math.floor(date.getSeconds() / 2) & 0x1f);
  const day =
    (((date.getFullYear() - 1980) & 0x7f) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time: time & 0xffff, date: day & 0xffff };
}

export interface ZipEntry {
  /** File name inside the archive (may include forward-slash folders). */
  name: string;
  /** File contents — a string is UTF-8 encoded. */
  content: string | Uint8Array;
}

/**
 * Build a ZIP archive as a Blob from a list of entries.
 * All entries share one timestamp so the archive is deterministic per call.
 */
export function createZip(entries: ZipEntry[]): Blob {
  const now = new Date();
  const { time, date } = dosDateTime(now);

  const fileParts: BlobPart[] = [];
  const centralParts: BlobPart[] = [];
  let offset = 0;
  let centralSize = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const data = typeof entry.content === "string" ? encoder.encode(entry.content) : entry.content;
    const crc = crc32(data);

    // Local file header (30 bytes + name).
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); // signature
    local.setUint16(4, 20, true); // version needed
    local.setUint16(6, 0x0800, true); // flags: UTF-8 name
    local.setUint16(8, 0, true); // method: 0 = store
    local.setUint16(10, time, true);
    local.setUint16(12, date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true); // compressed size
    local.setUint32(22, data.length, true); // uncompressed size
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true); // extra length

    fileParts.push(local.buffer, nameBytes as BlobPart, data as BlobPart);

    // Central directory record (46 bytes + name).
    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true); // signature
    central.setUint16(4, 20, true); // version made by
    central.setUint16(6, 20, true); // version needed
    central.setUint16(8, 0x0800, true); // flags: UTF-8 name
    central.setUint16(10, 0, true); // method
    central.setUint16(12, time, true);
    central.setUint16(14, date, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, data.length, true);
    central.setUint32(24, data.length, true);
    central.setUint16(28, nameBytes.length, true);
    central.setUint16(30, 0, true); // extra length
    central.setUint16(32, 0, true); // comment length
    central.setUint16(34, 0, true); // disk number
    central.setUint16(36, 0, true); // internal attrs
    central.setUint32(38, 0, true); // external attrs
    central.setUint32(42, offset, true); // local header offset

    centralParts.push(central.buffer, nameBytes as BlobPart);

    offset += 30 + nameBytes.length + data.length;
    centralSize += 46 + nameBytes.length;
  }

  // End of central directory record (22 bytes).
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); // signature
  end.setUint16(4, 0, true); // disk number
  end.setUint16(6, 0, true); // disk with central dir
  end.setUint16(8, entries.length, true); // entries on this disk
  end.setUint16(10, entries.length, true); // total entries
  end.setUint32(12, centralSize, true); // central dir size
  end.setUint32(16, offset, true); // central dir offset
  end.setUint16(20, 0, true); // comment length

  return new Blob([...fileParts, ...centralParts, end.buffer], {
    type: "application/zip",
  });
}

/** Trigger a browser download of a Blob. */
export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
