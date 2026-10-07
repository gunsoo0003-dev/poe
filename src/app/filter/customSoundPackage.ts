/**
 * Client-only ZIP helper for the filter export engine.
 * No upload/API is used. ZIP entries are stored without compression so the
 * implementation stays dependency-free and works fully in the browser.
 */
export type FilterSoundAsset = {
  fileName: string;
  file: Blob;
};

const textEncoder = new TextEncoder();

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

function u16(value: number) {
  return [value & 0xff, (value >>> 8) & 0xff];
}

function u32(value: number) {
  return [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff];
}

export async function createFilterPackageZip(
  filterText: string,
  filterFileName: string,
  sounds: FilterSoundAsset[],
) {
  const now = new Date();
  const entries: Array<{ name: Uint8Array; data: Uint8Array; crc: number; offset: number }> = [];
  const blobs: Blob[] = [new Blob([filterText], { type: "text/plain;charset=utf-8" }), ...sounds.map((sound) => sound.file)];
  const names = [filterFileName, ...sounds.map((sound) => sound.fileName)];

  for (let index = 0; index < blobs.length; index += 1) {
    const data = new Uint8Array(await blobs[index].arrayBuffer());
    entries.push({ name: textEncoder.encode(names[index]), data, crc: crc32(data), offset: 0 });
  }

  const { dosTime, dosDate } = dosDateTime(now);
  const localParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    entry.offset = offset;
    const header = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(dosTime), ...u16(dosDate),
      ...u32(entry.crc), ...u32(entry.data.length), ...u32(entry.data.length), ...u16(entry.name.length), ...u16(0),
    ]);
    localParts.push(header, entry.name, entry.data);
    offset += header.length + entry.name.length + entry.data.length;
  }

  const centralStart = offset;
  const centralParts: Uint8Array[] = [];
  for (const entry of entries) {
    const header = new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(dosTime), ...u16(dosDate),
      ...u32(entry.crc), ...u32(entry.data.length), ...u32(entry.data.length), ...u16(entry.name.length),
      ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(entry.offset),
    ]);
    centralParts.push(header, entry.name);
    offset += header.length + entry.name.length;
  }

  const centralSize = offset - centralStart;
  const end = new Uint8Array([
    ...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(entries.length), ...u16(entries.length),
    ...u32(centralSize), ...u32(centralStart), ...u16(0),
  ]);

  return new Blob([...localParts, ...centralParts, end], { type: "application/zip" });
}
