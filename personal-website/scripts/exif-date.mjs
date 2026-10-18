// Reads the date a photo was taken (YYYY-MM-DD) from its EXIF data, and nothing
// else: no time, no location, no camera. Used by scripts/photos.mjs, which then
// writes the date into the trip file; the published image carries no EXIF.
//
// `exif` is the raw EXIF block from sharp's metadata(). Returns null if the
// photo has no usable date.
export function takenDate(exif) {
  if (!exif || exif.length < 14) return null;
  try {
    const off = exif.toString('latin1', 0, 6) === 'Exif\0\0' ? 6 : 0;
    const le = exif.toString('latin1', off, off + 2) === 'II';
    const u16 = (o) => (le ? exif.readUInt16LE(o) : exif.readUInt16BE(o));
    const u32 = (o) => (le ? exif.readUInt32LE(o) : exif.readUInt32BE(o));
    const readIfd = (start) => {
      const tags = new Map();
      const n = u16(off + start);
      for (let i = 0; i < n; i++) {
        const e = off + start + 2 + i * 12;
        tags.set(u16(e), { count: u32(e + 4), value: e + 8 });
      }
      return tags;
    };
    const text = (t) => {
      const at = t.count > 4 ? off + u32(t.value) : t.value;
      return exif.toString('latin1', at, at + t.count - 1);
    };
    const ifd0 = readIfd(u32(off + 4));
    const sub = ifd0.has(0x8769) ? readIfd(u32(ifd0.get(0x8769).value)) : new Map();
    // DateTimeOriginal, then DateTimeDigitized, then the file's DateTime
    const tag = sub.get(0x9003) ?? sub.get(0x9004) ?? ifd0.get(0x0132);
    const m = tag && text(tag).match(/^(\d{4}):(\d{2}):(\d{2})/);
    if (!m || m[1] === '0000' || m[2] === '00' || m[3] === '00') return null;
    return `${m[1]}-${m[2]}-${m[3]}`;
  } catch {
    return null;
  }
}
