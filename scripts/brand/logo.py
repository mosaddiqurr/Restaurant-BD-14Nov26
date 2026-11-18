"""Builds the Khaoya logo package: every logo as clean filled paths (no fonts needed), many colours."""
import io, json, math, os, sys
import uharfbuzz as hb
import pathops
from pathops import Path, PathOp
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.svgPathPen import SVGPathPen

FONTS = sys.argv[1]
OUT = sys.argv[2]

GREEN, DEEP, GOLD, CREAM = '#0C5A3E', '#0B3B29', '#F4B91A', '#F7F1DE'


def load(path, axes):
    f = instantiateVariableFont(TTFont(path), axes)
    buf = io.BytesIO(); f.save(buf); data = buf.getvalue()
    return TTFont(io.BytesIO(data)), data


EN_TT, EN_DATA = load(f'{FONTS}/Figtree.ttf', {'wght': 800})
BN_TT, BN_DATA = load(f'{FONTS}/NotoSansBengali.ttf', {'wght': 800, 'wdth': 100})


def shape(tt, data, text, size, x=0.0, base=0.0):
    """returns (union path, list of per-glyph paths) with the baseline at y=base, y pointing down"""
    face = hb.Face(hb.Blob(data)); font = hb.Font(face)
    b = hb.Buffer(); b.add_str(text); b.guess_segment_properties()
    hb.shape(font, b, {'kern': True, 'liga': True})
    upem = tt['head'].unitsPerEm; s = size / upem
    order = tt.getGlyphOrder(); gs = tt.getGlyphSet()
    pen_x = x; glyphs = []; whole = Path()
    for info, pos in zip(b.glyph_infos, b.glyph_positions):
        p = Path()
        gs[order[info.codepoint]].draw(TransformPen(p.getPen(glyphSet=gs), (s, 0, 0, -s, pen_x + pos.x_offset * s, base - pos.y_offset * s)))
        p.simplify()
        if p.bounds != (0, 0, 0, 0):
            glyphs.append(p)
            whole = pathops.op(whole, p, PathOp.UNION)
        pen_x += pos.x_advance * s
    return whole, glyphs


def circle(cx, cy, r):
    k = 0.5522847498 * r; p = Path(); pen = p.getPen()
    pen.moveTo((cx + r, cy))
    pen.curveTo((cx + r, cy + k), (cx + k, cy + r), (cx, cy + r))
    pen.curveTo((cx - k, cy + r), (cx - r, cy + k), (cx - r, cy))
    pen.curveTo((cx - r, cy - k), (cx - k, cy - r), (cx, cy - r))
    pen.curveTo((cx + k, cy - r), (cx + r, cy - k), (cx + r, cy))
    pen.closePath(); return p


def rrect(x, y, w, h, r):
    k = 0.5522847498 * r; p = Path(); pen = p.getPen()
    pen.moveTo((x + r, y)); pen.lineTo((x + w - r, y))
    pen.curveTo((x + w - r + k, y), (x + w, y + r - k), (x + w, y + r)); pen.lineTo((x + w, y + h - r))
    pen.curveTo((x + w, y + h - r + k), (x + w - r + k, y + h), (x + w - r, y + h)); pen.lineTo((x + r, y + h))
    pen.curveTo((x + r - k, y + h), (x, y + h - r + k), (x, y + h - r)); pen.lineTo((x, y + r))
    pen.curveTo((x, y + r - k), (x + r - k, y), (x + r, y)); pen.closePath(); return p


def smile(x0, y0, cx, cy, x1, y1, w):
    """a round-capped stroke along a quadratic curve, as a filled outline"""
    n = 64; hw = w / 2; L = []; R = []
    for i in range(n + 1):
        t = i / n
        px = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1
        py = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1
        dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx); dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy)
        d = math.hypot(dx, dy); nx, ny = -dy / d, dx / d
        L.append((px + nx * hw, py + ny * hw)); R.append((px - nx * hw, py - ny * hw))
    rib = Path(); pen = rib.getPen(); pen.moveTo(L[0])
    for q in L[1:]: pen.lineTo(q)
    for q in reversed(R): pen.lineTo(q)
    pen.closePath(); rib.simplify()
    out = pathops.op(rib, circle(x0, y0, hw), PathOp.UNION)
    return pathops.op(out, circle(x1, y1, hw), PathOp.UNION)


def U(*ps):
    o = Path()
    for p in ps: o = pathops.op(o, p, PathOp.UNION)
    return o


def D(a, b): return pathops.op(a, b, PathOp.DIFFERENCE)


def d_of(p):
    sp = SVGPathPen(None, ntos=lambda v: ('%.2f' % v).rstrip('0').rstrip('.'))
    p.draw(sp); return sp.getCommands()


# ---------- building blocks (all sizes in px, the English cap size is the unit) ----------
def en_word(size, x=0.0, base=0.0, bite=True):
    word, gl = shape(EN_TT, EN_DATA, 'khaoya', size, x, base)
    if bite:
        a = gl[-1].bounds
        word = D(word, circle(a[2] + 0.05 * size, a[1] - 0.01 * size, 0.215 * size))
    return word


def en_smile(word, size, base):
    x0, _, x1, _ = word.bounds; xc = (x0 + x1) / 2 - 0.04 * size
    hw = 0.59 * size; y0 = base + 0.31 * size
    return smile(xc - hw, y0, xc, y0 + 0.40 * size, xc + hw, y0, 0.13 * size)


def bn_word(size, x=0.0, base=0.0, bite=True):
    word, gl = shape(BN_TT, BN_DATA, 'খাওয়া', size, x, base)
    if bite:
        b = word.bounds
        word = D(word, circle(b[2] - 0.01 * size, b[1] + 0.02 * size, 0.23 * size))
    return word


def bn_smile(word, size, big=None):
    x0, _, x1, y1 = word.bounds; xc = (x0 + x1) / 2
    if big:   # under the small Bangla line: the same size smile as the English one
        hw = 0.59 * big; y0 = y1 + 0.14 * big
        return smile(xc - hw, y0, xc, y0 + 0.36 * big, xc + hw, y0, 0.12 * big)
    hw = 0.62 * size; y0 = y1 + 0.16 * size
    return smile(xc - hw, y0, xc, y0 + 0.38 * size, xc + hw, y0, 0.135 * size)


def plate(cx, cy, R):
    """returns (plate with bite removed, smile)"""
    pl = D(circle(cx, cy, R), circle(cx + 0.82 * R, cy - 0.80 * R, 0.45 * R))
    sm = smile(cx - 0.5 * R, cy + 0.15 * R, cx, cy + 0.65 * R, cx + 0.5 * R, cy + 0.15 * R, 0.21 * R)
    return pl, sm


S = 100.0

def svg(parts, cols, title, pad=0.22 * S):
    """parts with colour None are knocked out of the plate (one-colour versions)"""
    shapes = []
    knock = [p for r, p in parts if cols[r] is None]
    for r, p in parts:
        c = cols[r]
        if c is None: continue
        if r == 'plate':
            for k in knock: p = D(p, k)
        shapes.append((c, p))
    x0 = min(p.bounds[0] for _, p in shapes) - pad; y0 = min(p.bounds[1] for _, p in shapes) - pad
    x1 = max(p.bounds[2] for _, p in shapes) + pad; y1 = max(p.bounds[3] for _, p in shapes) + pad
    W, H = x1 - x0, y1 - y0
    body = []
    for c in dict.fromkeys(c for c, _ in shapes):      # one path per colour, in drawing order
        merged = U(*[p for cc, p in shapes if cc == c])
        body.append(f'<path fill="{c}" d="{d_of(merged)}"/>')
    vb = f'{x0:.2f} {y0:.2f} {W:.2f} {H:.2f}'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{W:.0f}" height="{H:.0f}" role="img">'
            f'<title>{title}</title>' + ''.join(body) + '</svg>\n'), (W, H)


# ================= final, organised package =================
S = 100.0
EN6_TT, EN6_DATA = load(f'{FONTS}/Figtree.ttf', {'wght': 600})
EN7_TT, EN7_DATA = load(f'{FONTS}/Figtree.ttf', {'wght': 700})
BN7_TT, BN7_DATA = load(f'{FONTS}/NotoSansBengali.ttf', {'wght': 700, 'wdth': 100})


def text(tt, data, s, size, x=0.0, base=0.0):
    return shape(tt, data, s, size, x, base)[0]


def place(p_fn, size, cx=None, x0=None, top=None, base=0.0):
    """shape once to measure, then again at the wanted spot (centred on cx or starting at x0, top at `top`)"""
    m = p_fn(size, 0.0, 0.0).bounds
    x = (cx - (m[0] + m[2]) / 2) if cx is not None else (x0 - m[0])
    b = (top - m[1]) if top is not None else base
    return p_fn(size, x, b)


def sparkle(cx, cy, r):
    k = 0.16 * r; p = Path(); pen = p.getPen()
    pen.moveTo((cx, cy - r))
    pen.qCurveTo((cx + k, cy - k), (cx + r, cy))
    pen.qCurveTo((cx + k, cy + k), (cx, cy + r))
    pen.qCurveTo((cx - k, cy + k), (cx - r, cy))
    pen.qCurveTo((cx - k, cy - k), (cx, cy - r))
    pen.closePath(); return p


def poly(*pts):
    p = Path(); pen = p.getPen(); pen.moveTo(pts[0])
    for q in pts[1:]: pen.lineTo(q)
    pen.closePath(); return p


def talking_plate(cx, cy, R):
    pl, sm = plate(cx, cy, R)
    tail = poly((cx - 0.84 * R, cy + 0.74 * R), (cx - 1.16 * R, cy + 1.37 * R), (cx - 0.37 * R, cy + 1.0 * R))
    return U(pl, D(tail, circle(cx + 0.82 * R, cy - 0.80 * R, 0.45 * R))), sm


def under_smile(block, size, gap=0.24):
    x0, _, x1, y1 = block.bounds; xc = (x0 + x1) / 2
    hw = 0.59 * size; y0 = y1 + gap * size
    return smile(xc - hw, y0, xc, y0 + 0.40 * size, xc + hw, y0, 0.13 * size)


def add_plate(parts, core=None, talking=False, gap=0.34):
    core = core or parts
    x0 = min(p.bounds[0] for _, p in parts); y0 = min(p.bounds[1] for _, p in core); y1 = max(p.bounds[3] for _, p in core)
    R = (y1 - y0) / 2 * 0.98; cy = (y0 + y1) / 2
    pl, psm = (talking_plate if talking else plate)(x0 - gap * S - R, cy, R)
    return [('plate', pl), ('platesmile', psm)] + parts


LOGOS = {}   # 'family/name' -> parts

# ---- khaoya ----
w = en_word(S); EN_BLOCK = [('word', w), ('accent', en_smile(w, S, 0))]
w = bn_word(S); BN_BLOCK = [('word', w), ('accent', bn_smile(w, S))]
LOGOS['khaoya/khaoya-wordmark-en'] = EN_BLOCK
LOGOS['khaoya/khaoya-wordmark-bn'] = BN_BLOCK
LOGOS['khaoya/khaoya-main-en'] = add_plate(EN_BLOCK)
LOGOS['khaoya/khaoya-main-bn'] = add_plate(BN_BLOCK)
w = en_word(S); xc = (w.bounds[0] + w.bounds[2]) / 2
bn = place(lambda s, x, b: bn_word(s, x, b, bite=False), 0.66 * S, cx=xc, top=w.bounds[3] + 0.16 * S)
LOGOS['khaoya/khaoya-main-both'] = add_plate([('word', w), ('word', bn), ('accent', bn_smile(bn, 0.66 * S, S))])
w = en_word(S); x1 = w.bounds[2]
dv = rrect(x1 + 0.42 * S, -0.74 * S, 0.07 * S, 0.98 * S, 0.035 * S)
bn = place(lambda s, x, b: bn_word(s, x, b, bite=False), 0.86 * S, x0=x1 + 0.89 * S, base=0.06 * S)
LOGOS['khaoya/khaoya-one-line'] = [('word', w), ('accent', en_smile(w, S, 0)), ('accent', dv), ('word', bn)]
pl, psm = plate(0, 0, S)
LOGOS['khaoya/khaoya-icon'] = [('plate', pl), ('platesmile', psm)]

# ---- business, menu, deals: the main logo + a gold divider + the product name ----
PRODUCTS = {'business': ('Business', 'বিজনেস'), 'menu': ('Menu', 'মেনু'), 'deals': ('Deals', 'ডিলস')}
for key, (en_name, bn_name) in PRODUCTS.items():
    for lang, block in (('en', EN_BLOCK), ('bn', BN_BLOCK)):
        word = block[0][1]; x1 = word.bounds[2]
        top, bot = (-0.74 * S, 0.24 * S) if lang == 'en' else (word.bounds[1] - 0.02 * S, 0.10 * S)
        dv = rrect(x1 + 0.40 * S, top, 0.07 * S, bot - top, 0.035 * S)
        if lang == 'en':
            name = text(EN7_TT, EN7_DATA, en_name, 0.86 * S, x1 + 0.84 * S, 0)
        else:
            name = place(lambda s, x, b: text(BN7_TT, BN7_DATA, bn_name, s, x, b), 0.86 * S, x0=x1 + 0.84 * S, base=0)
        LOGOS[f'business/khaoya-{key}-{lang}'] = add_plate(block + [('accent', dv), ('word', name)], core=block)

# ---- Mama AI: wordmark with smile, sparkle and "by Khaoya"; talking plate icon ----
def mama_block(lang):
    """mama + green AI sparkle + marigold smile, and 'by Khaoya' underneath (all green except the smile)"""
    if lang == 'en':
        w = text(EN_TT, EN_DATA, 'mama', S)
    else:
        w = text(BN_TT, BN_DATA, 'মামা', S)
    sm = under_smile(w, S, 0.22 if lang == 'en' else 0.16)
    x1, y0 = w.bounds[2], w.bounds[1]
    sp = sparkle(x1 + 0.40 * S, y0 - 0.02 * S, 0.24 * S)
    xc = (w.bounds[0] + w.bounds[2]) / 2; top = sm.bounds[3] + 0.30 * S
    # 'by Khaoya' stays in English on the Bangla logo too, so the line reads the same everywhere
    b = place(lambda s, x, bb: text(EN7_TT, EN7_DATA, 'by Khaoya', s, x, bb), 0.32 * S, cx=xc, top=top)
    return [('word', w), ('accent', sm), ('word', sp), ('word', b)], [('word', w), ('accent', sm)]


for lang in ('en', 'bn'):
    blk, core = mama_block(lang)
    LOGOS[f'mama/mama-wordmark-{lang}'] = blk
    LOGOS[f'mama/mama-main-{lang}'] = add_plate(blk, core=core, talking=True)
pl, psm = talking_plate(0, 0, S)
LOGOS['mama/mama-icon'] = [('plate', pl), ('platesmile', psm)]

VARIANTS = {
    'color':   {'word': GREEN, 'accent': GOLD, 'plate': GOLD, 'platesmile': GREEN, 'byline': '#8A5E00'},
    'reverse': {'word': CREAM, 'accent': GOLD, 'plate': GOLD, 'platesmile': DEEP, 'byline': GOLD},
    'black':   {'word': '#000000', 'accent': '#000000', 'plate': '#000000', 'platesmile': None, 'byline': '#000000'},
    'white':   {'word': '#FFFFFF', 'accent': '#FFFFFF', 'plate': '#FFFFFF', 'platesmile': None, 'byline': '#FFFFFF'},
}
NOTE = {'color': 'for light backgrounds', 'reverse': 'for dark backgrounds', 'black': 'one colour, black', 'white': 'one colour, white'}

manifest = []
for name, parts in LOGOS.items():
    fam, base = name.split('/')
    for v, cols in VARIANTS.items():
        out, _ = svg(parts, cols, f'{base} ({NOTE[v]})')
        fn = f'logo/{fam}/svg/{base}-{v}.svg'
        os.makedirs(f'{OUT}/logo/{fam}/svg', exist_ok=True)
        open(f'{OUT}/{fn}', 'w', encoding='utf-8').write(out)
        manifest.append(fn)


def app_tile(maskable=False, talking=False):
    T = 512.0; bg = rrect(0, 0, T, T, 0 if maskable else 112)
    R = (136 if maskable else 160) * (0.9 if talking else 1)
    pl, sm = (talking_plate if talking else plate)(T * (0.5 if talking else 0.484), T * (0.47 if talking else 0.53), R)
    pl = D(pl, sm)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img">'
            f'<title>app icon</title><path fill="{GREEN}" d="{d_of(bg)}"/><path fill="{GOLD}" d="{d_of(pl)}"/></svg>\n')


os.makedirs(f'{OUT}/logo/app-icon/svg', exist_ok=True)
for fn, s in [('khaoya-app-icon', app_tile()), ('khaoya-app-icon-maskable', app_tile(True)),
              ('mama-app-icon', app_tile(talking=True))]:
    open(f'{OUT}/logo/app-icon/svg/{fn}.svg', 'w', encoding='utf-8').write(s); manifest.append(f'logo/app-icon/svg/{fn}.svg')

json.dump(manifest, open(f'{OUT}/.files.json', 'w'), indent=1)
print(len(manifest), 'svg files')


# ---------- path data for the website (components/ui/brand-art.ts) ----------
def art(parts, pad=0.0):
    roles = {}
    for r, p in parts: roles[r] = U(roles[r], p) if r in roles else p
    allp = U(*roles.values())
    x0, y0, x1, y1 = allp.bounds
    return {'viewBox': f'{x0 - pad:.2f} {y0 - pad:.2f} {x1 - x0 + 2 * pad:.2f} {y1 - y0 + 2 * pad:.2f}',
            **{r: d_of(p) for r, p in roles.items()}}


if len(sys.argv) > 3:
    ART = {'lockup': art(LOGOS['khaoya/khaoya-main-en']), 'plate': art(LOGOS['khaoya/khaoya-icon']),
           'mama': art(LOGOS['mama/mama-icon'])}
    ts = ('/* Khaoya brand shapes, made by scripts/brand/logo.py from the logo package (public/brand/khaoya).\n'
          '   Do not edit by hand: change the generator and run it again. Roles: plate (marigold), platesmile (green),\n'
          '   word (green, cream on dark), accent (the marigold smile). */\n'
          f'export const BRAND = {json.dumps(ART, indent=1, ensure_ascii=False)} as const;\n')
    open(sys.argv[3], 'w', encoding='utf-8').write(ts)
    print('brand-art written')
