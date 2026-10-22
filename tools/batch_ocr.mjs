// Batch: JP2 -> PNG -> OCR text, one file per spread. Resumable (skips existing outputs).
// Usage: node tools/batch_ocr.mjs <lang> <scale> <first> <last>
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createWorker } from 'tesseract.js';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JP2_DIR = path.join(ROOT, 'source/cu31924096083336_jp2');
const PNG_DIR = '/tmp/opencode/pages';
const TXT_DIR = path.join(ROOT, 'corpus/ocr_' + process.argv[2]);
const [lang, scaleArg, firstArg, lastArg] = process.argv.slice(2);
const scale = parseFloat(scaleArg);
const first = parseInt(firstArg), last = parseInt(lastArg);
fs.mkdirSync(PNG_DIR, { recursive: true });
fs.mkdirSync(TXT_DIR, { recursive: true });

const CORE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../node_modules/tesseract.js-core');
const worker = await createWorker(lang, 1, {
  langPath: 'http://127.0.0.1:8899',
  gzip: false,
  cachePath: '/tmp/opencode/tesscache',
  corePath: path.join(CORE, 'tesseract-core-simd-lstm.js'),
  logger: () => {},
});
await worker.setParameters({ preserve_interword_spaces: '1' });

for (let i = first; i <= last; i++) {
  const id = String(i).padStart(4, '0');
  const txtOut = path.join(TXT_DIR, `p${id}.txt`);
  if (fs.existsSync(txtOut)) continue;
  const jp2 = path.join(JP2_DIR, `cu31924096083336_${id}.jp2`);
  if (!fs.existsSync(jp2)) continue;
  const png = path.join(PNG_DIR, `p${id}.png`);
  if (!fs.existsSync(png)) {
    execFileSync('node', [path.join(ROOT, 'tools/jp2png.mjs'), jp2, png, String(scale)]);
  }
  try {
    const { data } = await worker.recognize(png);
    fs.writeFileSync(txtOut, data.text);
    process.stdout.write(`p${id} ${(data.confidence || 0).toFixed(0)}%  `);
  } catch (e) {
    fs.writeFileSync(txtOut, `[OCR ERROR] ${e.message}`);
    process.stdout.write(`p${id} ERR  `);
  }
}
console.log('\ndone');
await worker.terminate();
