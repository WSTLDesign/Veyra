#!/usr/bin/env python3
# QA Loop A3 – Prüfung 2 (Teil 1): Bilddateien in public/art prüfen (PIL). Aufruf: python3 test/qa_a_images.py
# Ergebnis: Konsole + test/qa_a_images.json. Ergänzt durch test/qa_a_sprites.mjs (Anzeige im Spiel).
import os, re, json, sys
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
ART = os.path.join(ROOT, 'public', 'art')
keys = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'qa_a_keys.json'))) if os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'qa_a_keys.json')) else {}
res = {'files': [], 'problems': [], 'missing': [], 'stats': {}}
def P(sev, msg): res['problems'].append([sev, msg]); print(f'[{sev}] {msg}')
ids_with_img = set()
names = sorted(os.listdir(ART))
for f in names:
    p = os.path.join(ART, f); sz = os.path.getsize(p); base, ext = os.path.splitext(f)
    info = {'file': f, 'bytes': sz}
    if sz == 0: P('hoch', f'{f}: 0 Byte'); res['files'].append(info); continue
    if ext.lower() != '.webp': P('niedrig', f'{f}: unerwartete Endung {ext}')
    m = re.match(r'^(\d{3})_(.+)$', base)
    kind = None
    if m: kind = 'art'; info['id'] = int(m.group(1)); ids_with_img.add(int(m.group(1)))
    elif re.match(r'^(map|region|stadt|ort)_', base): kind = 'place'
    else: P('mittel', f'{f}: Key weder 3-stellige Kanon-ID noch map_/region_/stadt_/ort_')
    info['kind'] = kind
    try:
        im = Image.open(p); im.verify(); im = Image.open(p); im.load()
    except Exception as e:
        P('hoch', f'{f}: nicht lesbar ({e})'); res['files'].append(info); continue
    w, h = im.size; info.update(w=w, h=h, mode=im.mode)
    hasA = im.mode in ('RGBA', 'LA') or 'transparency' in im.info
    info['alpha'] = hasA
    if hasA:
        a = im.convert('RGBA').getchannel('A'); ex = a.getextrema(); hist = a.histogram()
        tot = w * h; tr = sum(hist[:8]) / tot
        info['transparent_pct'] = round(100 * tr, 1)
        # Randpixel transparent?
        px = a.load(); edge = [px[x, 0] for x in range(w)] + [px[x, h - 1] for x in range(w)] + [px[0, y] for y in range(h)] + [px[w - 1, y] for y in range(h)]
        info['edge_opaque_pct'] = round(100 * sum(1 for e in edge if e > 200) / len(edge), 1)
    else:
        info['transparent_pct'] = 0; info['edge_opaque_pct'] = 100
    framed = kind == 'art' and 140 <= info['id'] <= 153
    if kind == 'art':
        if max(w, h) > 512: P('mittel', f'{f}: {w}x{h} > 512 px')
        if not framed and (not hasA or info['transparent_pct'] < 5 or info['edge_opaque_pct'] > 30): P('hoch', f'{f}: Kreaturenbild ohne ausreichende Transparenz (alpha={hasA}, transp={info["transparent_pct"]}%, Rand opak={info["edge_opaque_pct"]}%)')
        if sz > 120000: P('niedrig', f'{f}: {sz//1024} KB (>120 KB)')
        if sz < 3000: P('mittel', f'{f}: nur {sz} Byte – verdächtig klein')
    else:
        if max(w, h) > 2048: P('niedrig', f'{f}: {w}x{h} (Ortsbild) > 2048 px')
    res['files'].append(info)
art = [x for x in res['files'] if x.get('kind') == 'art']
res['stats'] = {'dateien': len(names), 'kreaturenbilder': len(art), 'ortsbilder': len([x for x in res['files'] if x.get('kind') == 'place']),
                'summe_kb': sum(x['bytes'] for x in res['files']) // 1024, 'max_px': max((max(x.get('w', 0), x.get('h', 0)) for x in art), default=0),
                'framed_140_153': len([x for x in art if 140 <= x['id'] <= 153])}
res['ids_with_img'] = sorted(ids_with_img)
json.dump(res, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'qa_a_images.json'), 'w'), ensure_ascii=False)
print(res['stats'])
print('Probleme:', len(res['problems']))
