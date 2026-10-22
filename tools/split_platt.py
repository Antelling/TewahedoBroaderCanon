#!/usr/bin/env python3
"""Clean and split the Platt 1834 OCR (Ge'ez + interleaved English) into a structured corpus.

- Joins words hyphenated across line breaks
- Drops page numbers and scan artifacts
- Separates Ge'ez lines (majority Ethiopic) from English lines
- Splits on section headings (the repeated ትምህርተ ድስቅልያ title formula)
Output: corpus/platt/gez.txt and corpus/platt/eng.txt, with section markers kept.
"""
import re, os, unicodedata

SRC = 'source/platt1834.txt'
OUT = 'corpus/platt'
os.makedirs(OUT, exist_ok=True)

t = open(SRC, encoding='utf-8', errors='replace').read()

# start at the real beginning of the Didascalia text (skip Google front matter)
start = t.find('THE DOCTRINE OF THE DIDASCALIA')
# back up to include the Ge'ez heading lines preceding it
head_start = t.rfind('ድስቅልያ', 0, start)
t = t[head_start if head_start > 40000 else start:]

# end at the glossary ("Ludolf" gloss list) — detect by his closing formula
endm = re.search(r'Here endeth the doctrine|So be it\.?\s*$', t)
# keep everything to the end of file; glossary starts at 'ABYSSINIAN LEXICON'-like area; find it
gloss = t.find('PROSCIDIT')
t = t[:gloss] if gloss > 0 else t

lines = t.split('\n')

def is_eth(line):
    n = sum(1 for c in line if 0x1200 <= ord(c) <= 0x137F)
    letters = sum(1 for c in line if c.isalpha())
    return n >= 3 and n > letters * 0.3

def clean_en(s):
    s = re.sub(r'(\w)-\s*\n\s*([a-z])', r'\1\2', s)  # join hyphenated breaks
    s = re.sub(r'\s+', ' ', s).strip()
    return s

PAGE = [0]
gez_out, eng_out = [], []
gez_buf, eng_buf = [], []

def flush():
    if gez_buf:
        gez_out.append(' '.join(gez_buf)); gez_buf.clear()
    if eng_buf:
        eng_out.append(' '.join(eng_buf)); eng_buf.clear()

for line in lines:
    s = line.strip()
    if not s:
        continue
    # drop pure page numbers / artifacts
    if re.fullmatch(r'[\d\s\|\-\.~_=]{1,8}', s):
        continue
    if is_eth(s):
        if ('ምህርተ' in s or 'ምህርት' in s) and 'ስቅልያ' in s and len(s) < 70:
            flush()
            PAGE[0] += 1
            gez_out.append(f'\n--- page {PAGE[0]} ---')
        else:
            gez_buf.append(s)
    else:
        # English line; drop scan garbage lines (mostly non-ascii junk)
        if len(s) < 4:
            continue
        eng_buf.append(s)
flush()

open(f'{OUT}/gez_raw.txt', 'w').write('\n'.join(gez_out))
open(f'{OUT}/eng_raw.txt', 'w').write('\n'.join(eng_out))
pages = sum(1 for g in gez_out if g.startswith('\n--- page'))
print(f'pages: {pages}, gez blocks: {len(gez_out)}, eng blocks: {len(eng_out)}')
print('gez chars:', sum(len(g) for g in gez_out))
print('eng chars:', sum(len(g) for g in eng_out))
