# Didesqelya — a fresh English translation of the Ethiopic Didascalia

The **Didascalia Apostolorum** ("Teaching of the Apostles", Ge'ez: **ዲደስቅልያ** *Didesqelya*) is a
church order presented as the teaching of the Twelve at Jerusalem. The Ethiopic version — received
in the Ethiopian Orthodox Church as part of its wider canon (Fetha Nägäst-era literature, read
alongside the Sinodos) — is a much-expanded descendant of the 3rd-century Syriac Didascalia,
closely paralleling books I–VII of the *Apostolic Constitutions*.

This project produces a new, careful English translation made directly from the Ge'ez text,
with per-chapter notes and cross-references to the parallel traditions (Syriac Didascalia,
Apostolic Constitutions).

## Source material

| Witness | What it is | Location |
|---|---|---|
| **Harden 1920** (primary) | J. M. Harden, *The Ethiopic Didascalia*, SPCK/Macmillan, 1920. Ge'ez text + English translation. Public domain. | `source/harden1920*.pdf`, `source/harden1920_jp2.zip` (archive.org `cu31924096083336`) |
| **Platt 1834** (witness) | T. P. Platt, *The Ethiopic Didascalia*, Oriental Translation Fund, 1834. Public domain. | `source/platt1834.*` (archive.org `TheEthiopicDidascalia`) |
| **Parallel versions** | Syriac Didascalia (Gibson 1903); Apostolic Constitutions (ANF); Greek fragments | to be fetched as needed |

**Note:** a PD English translation does in fact exist (two, actually — Harden 1920 and Platt
1834). Both, however, are archaic, based on limited manuscript evidence, and at points loose.
The goal here is fidelity to the Ge'ez above all, in modern English.

## Pipeline

No commercial tools; pure open source, running locally:

1. `source/` — archive.org scans (Harden 1920 JP2 page images + Platt 1834).
2. `tools/jp2png.mjs` — decode JPEG2000 page spreads to PNG (pdfjs-dist OpenJPEG WASM).
3. `tools/ocr.mjs`, `tools/batch_ocr.mjs` — OCR (tesseract.js): `eng` for Harden's English,
   `amh`/`gez` models for the Ge'ez print.
4. `corpus/` — per-spread OCR output: `corpus/ocr_eng/p####.txt` (Harden's English),
   `corpus/ocr_gez/p####.txt` (Ge'ez text).
5. `translation/` — the new English translation, chapter by chapter markdown, with the Ge'ez
   transcribed alongside and notes on variant readings, parallels, and uncertain OCR.

## Translation principles

- Translate from the Ge'ez; where OCR is uncertain, check the 1920 page image, Platt 1834,
  and the parallels (AC/Syriac) before emending, and flag the reading in a note.
- Keep Ge'ez technical terms where they carry weight (e.g. ካህን *kahən* priest/bishop family,
  ሊቀ ካህን *liqa kahən* high priest/bishop) with the conventional English in brackets.
- Verse/section numbering follows the 1834/1920 edition divisions unless noted.
- Quotations of Scripture are rendered from the Ge'ez as it stands (Ethiopic biblical text
  differs from the KJV), with a bracketed note where the citation diverges.

## Status

- [x] Source scans downloaded and verified (Harden 1920 JP2s; Platt 1834)
- [x] JP2 → PNG decode pipeline (pure-JS OpenJPEG, no system deps)
- [x] English OCR of Harden 1920 — complete, all 238 spreads (`corpus/ocr_eng/`)
- [x] Platt 1834 interleaved Ge'ez+English corpus extracted and page-marked (`corpus/platt/`)
- [x] Translation: title + apostolic preface (`translation/00-title-and-preface.md`)
- [x] Translation: the first great admonition, §§ 1–9 (`translation/01-the-great-admonition.md`)
- [x] Translation: §§ 10–16 — children of light, purity, love the Lord & the rich (`translation/02…md`, `translation/03…md`)
- [x] Translation: §§ 17–22 — the bath, the strange woman, close of Section I (`translation/04…md`)
- [ ] Test tesseract `amh` OCR on the Platt 1834 print (may beat the embedded Google OCR)
- [ ] Translation: wives obeying husbands (Platt Ch. II / Prov 31), bishops, judgment
