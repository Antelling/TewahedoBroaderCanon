// Decode IA-style JP2 (JPEG2000) page images to PNG.
// Uses pdfjs-dist v5's OpenJPEG WASM decoder with a local handler (no fetch needed).
// Usage: node tools/jp2png.mjs <in.jp2> <out.png> [scale]
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JpxImage } from 'pdfjs-dist/legacy/image_decoders/pdf.image_decoders.mjs';

const WASM_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../node_modules/pdfjs-dist/wasm');
JpxImage.setOptions({
  useWasm: true,
  useWorkerFetch: false,
  wasmUrl: WASM_DIR + '/',
  handler: {
    sendWithPromise: async (action, { filename }) => fs.readFile(path.join(WASM_DIR, filename)),
  },
});

const [inp, outp, scaleArg] = process.argv.slice(2);
const buf = fs.readFileSync(inp);
const bytes = new Uint8Array(buf);
const props = JpxImage.parseImageProperties(bytes);
const img = await JpxImage.decode(bytes); // RGBA interleaved (numComponents defaults to 4)
const width = props.width, height = props.height, data = img;
const px = width * height;
const bpp = data.length / px;
if (![1, 3, 4].includes(bpp)) throw new Error(`unexpected ${bpp} bytes/pixel`);
const ncomp = 4;

const scale = scaleArg ? parseFloat(scaleArg) : 1;
const W = Math.max(1, Math.round(width * scale));
const H = Math.max(1, Math.round(height * scale));

const raw = Buffer.alloc(H * (1 + W * bpp));
let o = 0;
for (let y = 0; y < H; y++) {
  raw[o++] = 0; // filter: none
  const sy = Math.min(height - 1, Math.floor(y / scale));
  for (let x = 0; x < W; x++) {
    const sx = Math.min(width - 1, Math.floor(x / scale));
    const si = (sy * width + sx) * bpp;
    for (let c = 0; c < bpp; c++) raw[o++] = data[si + c];
  }
}

// minimal PNG writer
const crcTable = [];
for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
function crc32(b) { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, d) {
  const len = Buffer.alloc(4); len.writeUInt32BE(d.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), d]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = bpp >= 3 ? 2 : 0;
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 6 })),
  chunk('IEND', Buffer.alloc(0)),
]);
fs.writeFileSync(outp, png);
console.log(`${outp}: ${W}x${H} (src ${width}x${height}), ${(png.length / 1024).toFixed(0)} KB`);
