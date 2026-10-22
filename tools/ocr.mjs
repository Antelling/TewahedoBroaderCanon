// OCR a PNG with tesseract.js. Usage: node tools/ocr.mjs <image.png> <lang> [psm]
import { createWorker } from 'tesseract.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [imgPath, lang, psmArg] = process.argv.slice(2);
const CORE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../node_modules/tesseract.js-core');
const worker = await createWorker(lang, 1, {
  langPath: 'http://127.0.0.1:8899',
  gzip: false,
  cachePath: '/tmp/opencode/tesscache',
  corePath: path.join(CORE, 'tesseract-core-simd-lstm.js'),
  logger: () => {},
});
if (psmArg) await worker.setParameters({ tessedit_pageseg_mode: psmArg, preserve_interword_spaces: '1' });
else await worker.setParameters({ preserve_interword_spaces: '1' });
const { data } = await worker.recognize(imgPath);
console.log(data.text);
await worker.terminate();
