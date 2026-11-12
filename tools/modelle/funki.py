# Terra 001 Funki (Glut, Rotfuchs-Welpe) – komplett per Skript gebaut. Eigener Entwurf nach docs/terras.md / public/art/001_funki.webp:
# großer Kopf, Riesenohren mit cremefarbenem Innenfell, buschige Rute mit Flammenspitze, Stirnflamme, Glutorange/Creme/Flammengelb.
# Anatomie: Vierbeiner (Zehengänger), Schulterblatt, Ellbogen nach hinten, Sprunggelenk, 35 Knochen. Fell = gezackte Silhouette (Wangen, Brust, Rute) + Strähnen in Farbe/Normalkarte.
# Aufruf: <venv>/bin/python tools/modelle/funki.py <ausgabe.glb> [--form]
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vlib import *
from mathutils.bvhtree import BVHTree
OUT = [a for a in sys.argv[1:] if a.endswith('.glb')]; OUT = OUT[0] if OUT else '/tmp/funki.glb'
ONLY_FORM = '--form' in sys.argv; TEX = 1024; DIR = os.path.dirname(OUT) or '.'
reset(); random.seed(1)

region('fell', '#ef7a2c', (1, .5, .1, 0)); region('creme', '#f7e3c4', (1, .6, .1, 0)); region('fell_kopf', '#ef7a2c', (.8, .5, .1, 0))
region('ohr_innen', '#f7d9bc', (.4, .9, 0, 0)); region('nase', '#2a1d1d', (1, 0, .9, 0)); region('flamme', '#ffc83a', (.3, 0, 0, 1))
region('lid', '#ef7a2c', (0, .4, 0, 0)); region('lidlinie', '#3a1a10', (0, 0, 0, 0)); region('auge', '#ffffff', (0, 0, 1, 0)); region('mund_innen', '#5a2028', (0, 0, 0, 0))
region('pfote', '#f7e3c4', (1, .5, .1, 0)); region('kralle', '#5a3a30', (1, 0, .4, 0))

# ---------------- Maße ----------------
HC = Vector((0, -.17, .415)); HR = (.12, .108, .105)  # Kopfmitte, Radien (x breit, y tief, z hoch)
def mx(v): return Vector((-v.x, v.y, v.z))
SPINE = [Vector((0, .11, .2)), Vector((0, .045, .21)), Vector((0, -.025, .215)), Vector((0, -.085, .225))]
NECK = [Vector((0, -.115, .27)), Vector((0, -.14, .315))]
FL = [Vector((.05, -.085, .215)), Vector((.054, -.075, .13)), Vector((.054, -.092, .05)), Vector((.054, -.11, .012))]   # Schulter, Ellbogen, Handgelenk, Pfote
HL = [Vector((.055, .115, .19)), Vector((.062, .07, .115)), Vector((.06, .13, .055)), Vector((.058, .115, .012))]     # Hüfte, Knie, Sprunggelenk, Pfote
TAIL = [Vector((0, .155, .21)), Vector((0, .23, .245)), Vector((0, .29, .31)), Vector((0, .315, .4)), Vector((0, .3, .49)), Vector((0, .26, .55))]

# ---------------- Rumpf + Beine (Skin-Graph) ----------------
N = []; E = []; R = []
def node(p, r): N.append(tuple(p)); R.append(r); return len(N) - 1
def chain(ids):
    for a, b in zip(ids, ids[1:]): E.append((a, b))
sp = [node(SPINE[0], .068), node(SPINE[1], .071), node(SPINE[2], .073), node(SPINE[3], .076)]
nk = [node(NECK[0], .068), node(NECK[1], .06)]
chain(sp + nk)
for s in (-1, 1):
    F = [p if s > 0 else mx(p) for p in FL]; Hh = [p if s > 0 else mx(p) for p in HL]
    f0 = node(F[0], .05); f1 = node(F[0].lerp(F[1], .5), .038); f2 = node(F[1], .028); f3 = node(F[1].lerp(F[2], .5), .023); f4 = node(F[2], .021); f5 = node(F[3] + Vector((0, -.004, .006)), (.021, .02))
    E.append((sp[3], f0)); chain([f0, f1, f2, f3, f4, f5])
    h0 = node(Hh[0], .058); h1 = node(Hh[0].lerp(Hh[1], .5), .05); h2 = node(Hh[1], .034); h3 = node(Hh[1].lerp(Hh[2], .5), .024); h4 = node(Hh[2], .02); h5 = node(Hh[3] + Vector((0, -.006, .006)), (.021, .02))
    E.append((sp[0], h0)); chain([h0, h1, h2, h3, h4, h5])
body = skin_body('Rumpf', N, E, R, root=sp[1], sub=1, branch_smooth=.5)
def body_shape(p):
    p = p.copy()
    zc = .2 + .025 * ss(.11, -.085, p.y); dz = p.z - zc; ang = math.atan2(dz, p.x)
    w = ss(.17, .1, p.y) * ss(-.16, -.1, p.y) * ss(-.09, -.04, dz) * ss(.13, .08, abs(p.x))
    if w > 0:   # Rumpf rund (Skin-Hüllen sind kantig): Querschnitt auf Ellipse ziehen
        rx = .083 + .008 * ss(.05, -.08, p.y); rz = .074 + .01 * ss(.05, -.08, p.y); r0 = math.hypot(p.x, dz)
        tx, tz = math.cos(ang) * rx, math.sin(ang) * rz; p.x = lerp(p.x, tx, w); p.z = zc + lerp(dz, tz, w)
    if abs(p.x) < .1 and .1 < p.z < .32 and -.13 < p.y < .16:
        y = p.y; deep = .016 * gauss((y + .07) ** 2, .045) * (p.z < .21)   # tiefe Brust
        tuck = .01 * gauss((y - .05) ** 2, .04) * (p.z < .19)               # Bauch eingezogen
        p.z -= deep - tuck
        if p.z > .22: p.z += .006 * gauss((y + .09) ** 2, .03)               # Widerrist
    return p
deform(body, body_shape); set_region(body, 'fell')
BVB = BVHTree.FromObject(body, bpy.context.evaluated_depsgraph_get())

# ---------------- Kopf: runder Schädel, kurze Schnauze, Wangenfell ----------------
def head_shape(u):
    x, y, z = u.x, u.y, u.z; fz = -y
    X, Y, Z = x * HR[0], y * HR[1], z * HR[2]
    if z < -.2: X *= 1 - .12 * ss(-.2, -1, z)
    # Schnauze: nach vorn-unten, verjüngt
    m = ss(.55, .95, fz) * gauss(x * x * 1.1 + (z + .3) ** 2, .3)
    Y -= .045 * m; Z -= .008 * m; X *= 1 - .25 * m * ss(.6, 1, fz)
    # Stirnabsatz
    Y += .008 * ss(.6, .95, fz) * gauss(x * x + (z - .1) ** 2, .2)
    # Augenmulden
    for s in (-1, 1):
        Y += .006 * gauss((x - s * .42) ** 2 + (z - .08) ** 2 * 1.4, .15) * ss(.4, .8, fz)
    return Vector((X, Y, Z)) + HC
head = quad_sphere('Kopf', 6); deform(head, head_shape); subsurf(head, 1); set_region(head, 'fell_kopf')
BVH_H = BVHTree.FromObject(head, bpy.context.evaluated_depsgraph_get())
def hsurf(d, extra=0.0):
    d = Vector(d).normalized(); hit = BVH_H.ray_cast(HC + d * .3, -d); return hit[0] + hit[1] * extra, hit[1]
parts_head = []
# Nase
np_, nn = hsurf((0, -1, -.36)); nose = blob('Nase', np_ + nn * .006, (.014, .01, .009), 3, lambda v, q: Vector((q.x, q.y, q.z * (1 - .25 * (v.z < 0))))); set_region(nose, 'nase'); parts_head.append(nose)
# Wangenfell (gezackt) und Stirnbüschel
def tuft(p, d, L, w, regn, up=(0, 0, 1), bend=(0, 0, 0)):
    d = Vector(d).normalized(); P = [p, p + d * L * .5 + Vector(bend) * .4, p + d * L + Vector(bend)]
    o = loft('Bueschel', P, lambda t: w * (1 - t ** 1.4) + .0004, lambda t: w * .45 * (1 - t) + .0004, ring=4, n=6, flat_up=up); set_region(o, regn); return o
for s in (-1, 1):
    for k in range(3):
        p, n = hsurf((s * .95, -.25 + k * .05, -.32 - k * .12), -.01)
        parts_head.append(tuft(p, n + Vector((s * .4, .5, -.25 - .15 * k)), .05 - .006 * k, .024, 'creme', up=(0, 0, 1)))
for k in range(3):
    p, n = hsurf(((k - 1) * .25, -.1, 1), -.01); parts_head.append(tuft(p, n + Vector(((k - 1) * .4, .6, .2)), .04, .022, 'fell_kopf', up=(0, -1, 0)))
# Ohren: groß, gewölbt (Becher), cremefarbenes Innenfell, dunkle Spitze
EARS = {}
for s in (-1, 1):
    base, bn = hsurf((s * .55, .05, .82), -.012)
    up_ = Vector((s * .55, .12, 1)).normalized(); fw = Vector((0, -1, .12)).normalized(); side = up_.cross(fw).normalized()
    V = []; F_ = []; NU, NV = 10, 6; Lh = .15
    for i in range(NU + 1):
        u = i / NU; w = .056 * (1 - u) ** .85 + .002
        for j in range(NV + 1):
            v = j / NV * 2 - 1; cup = .016 * (1 - v * v) * (1 - u) ** .6
            for layer in (0, 1):
                pass
            V.append(base + up_ * (Lh * u) + side * (v * w) + fw * (-cup + .004 * math.sin(u * 3)))
    for i in range(NU):
        for j in range(NV):
            a = i * (NV + 1) + j; F_.append((a, a + 1, a + NV + 2, a + NV + 1))
    eo = obj_data('Ohr', V, F_); mod(eo, 'SOLIDIFY', thickness=.009, offset=1); apply_mods(eo); smooth(eo)
    eo.data.materials.append(REG['fell_kopf']['mat']); eo.data.materials.append(REG['ohr_innen']['mat'])
    for pg in eo.data.polygons:
        c = pg.center - base; inner = pg.normal.dot(fw) < -.2 and abs(c.dot(side)) < .036 * (1 - c.dot(up_) / Lh) and c.dot(up_) < Lh * .82
        pg.material_index = 1 if inner else 0
    eo['ohr'] = s; EARS[s] = (base, up_); parts_head.append(eo)
    # Innenbüschel
    for k in range(3):
        p0 = base + up_ * (.01 + k * .012) + fw * -.006 + side * ((k - 1) * .012)
        parts_head.append(tuft(p0, up_ * .8 + fw * -.6 + side * ((k - 1) * .3), .04, .007, 'ohr_innen', up=tuple(fw)))

# ---------------- Augen + Lider + Mund (wie Noa, kleiner Satz) ----------------
RE = .029; EYES = {}
def th_u(ph): k = ss(0, 1, abs(ph) / 48.0); return 30 * (1 - k ** 1.6) + (6 if ph > 0 else -4) * k
def th_l(ph): k = ss(0, 1, abs(ph) / 48.0); return -24 * (1 - k ** 1.5) + (4 if ph > 0 else -4) * k
eye_parts = []; lid_objs = []
for s in (-1, 1):
    p, n = hsurf((s * .5, -.86, .1)); fwd = Vector((s * .42, -1, .08)).normalized(); C = p - fwd * (RE - .0035); EYES[s] = (C, fwd)
    r = Vector((0, 0, 1)).cross(fwd).normalized() * (-s); u = fwd.cross(r).normalized() * (-s)
    if u.z < 0: u = -u
    def sp_(ph, th, Rr, C=C, fwd=fwd, r=r, u=u): a, b = math.radians(ph), math.radians(th); return C + (fwd * (math.cos(b) * math.cos(a)) + r * (math.cos(b) * math.sin(a)) + u * math.sin(b)) * Rr
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=14, v_segments=10, radius=RE); eo = obj_bm('Auge', bm)
    M = Matrix((r, u, fwd)).transposed().to_4x4(); M.translation = C; eo.data.transform(M); orient_out(eo, C); smooth(eo); set_region(eo, 'auge')
    uvl = eo.data.uv_layers.new(name='UVMap')
    for l in eo.data.loops:
        q = eo.data.vertices[l.vertex_index].co - C; uvl.data[l.index].uv = (.25 + .25 * q.dot(r) / RE * s * .98, .5 + .5 * q.dot(u) / RE * .98)
    eye_parts.append(eo)
    for which in ('o', 'u'):
        V, F_, R_ = [], [], []; NPH, NT = 12, 4
        for i in range(NPH + 1):
            ph = -84 + 168 * i / NPH; e0 = th_u(ph) if which == 'o' else th_l(ph)
            for j in range(NT + 1):
                t = j / NT; th = (e0 + (80 - e0) * t ** 1.3) if which == 'o' else (e0 + (-75 - e0) * t ** 1.3); V.append(sp_(ph, th, RE + .0013 + .0006 * t))
        for i in range(NPH):
            for j in range(NT):
                a = i * (NT + 1) + j; F_.append((a, a + NT + 1, a + NT + 2, a + 1) if which == 'o' else (a, a + 1, a + NT + 2, a + NT + 1)); R_.append('lidlinie' if j == 0 else 'lid')
        base = len(V)
        for i in range(NPH + 1):
            ph = -84 + 168 * i / NPH; e0 = th_u(ph) if which == 'o' else th_l(ph); V.append(sp_(ph, e0 + (-3 if which == 'o' else 2.5), RE - .0005))
        for i in range(NPH):
            a = i * (NT + 1); b = (i + 1) * (NT + 1); F_.append((base + i, base + i + 1, b, a) if which == 'o' else (a, b, base + i + 1, base + i)); R_.append('lidlinie')
        lo = obj_data('Lid', V, F_); lo.data.materials.append(REG['lid']['mat']); lo.data.materials.append(REG['lidlinie']['mat'])
        for pg, rn in zip(lo.data.polygons, R_): pg.material_index = 0 if rn == 'lid' else 1
        orient_out(lo, C); smooth(lo); vg = lo.vertex_groups.new(name='lid_%s_%s' % (which, 'L' if s > 0 else 'R')); vg.add(list(range(len(V))), 1, 'REPLACE'); lid_objs.append(lo)
# Mund: Linie (Hauptmaterial) + Maul-Aufkleber (öffnet per Shape Key)
def mpt(xn, zn, off):
    p, n = hsurf((xn, -1, zn)); return p + n * off
mline = []
for k in range(9):
    t = k / 8 * 2 - 1; mline.append(mpt(t * .3, -.5 + .1 * t * t - .02, .0008))
ml = loft('Mundlinie', mline, lambda t: .0013 * (1 - .4 * abs(2 * t - 1)), lambda t: .0005, ring=4, n=12, flat_up=(0, -1, 0)); set_region(ml, 'lidlinie')
mid = [mpt(0, -.38 - k * .04, .0009) for k in range(4)]
ml2 = loft('Mundlinie2', mid, lambda t: .0011, lambda t: .0005, ring=4, n=6, flat_up=(0, -1, 0)); set_region(ml2, 'lidlinie')
MD = []; MF = []; MUV = []
for j in range(5):
    for i in range(9):
        t = i / 8 * 2 - 1; MD.append(mpt(t * .3, -.5 + .1 * t * t - .02, .001)); MUV.append((.5 + .5 * i / 8, .5 * j / 4))
for j in range(4):
    for i in range(8): a = j * 9 + i; MF.append((a, a + 1, a + 10, a + 9))
mdec = obj_data('Maul', MD, MF); set_region(mdec, 'mund_innen'); uvl = mdec.data.uv_layers.new(name='UVMap')
for l in mdec.data.loops: uvl.data[l.index].uv = MUV[l.vertex_index]
gr = mdec.vertex_groups.new(name='mund_reihe'); gc = mdec.vertex_groups.new(name='mund_spalte')
for vi in range(len(MD)): gr.add([vi], (vi // 9 + 1) / 5, 'REPLACE'); gc.add([vi], (vi % 9 + 1) / 9, 'REPLACE')

# ---------------- Rute: buschig, gezackter Querschnitt, Flammenspitze ----------------
def tail_r(t): return .028 + .05 * math.sin(min(1, t * 1.15) * math.pi) ** .8 * (1 - .25 * t)
P = bezier([tuple(p) for p in TAIL], 22); Fr = frames_along(P, Vector((1, 0, 0))); TV = []; TF = []; RING = 16
for i, (p, (Tt, Nn, Bb)) in enumerate(zip(P, Fr)):
    t = i / (len(P) - 1); r0 = tail_r(t)
    for j in range(RING):
        a = j / RING * 2 * math.pi + t * 2.2; spike = 1 + .16 * math.sin(j * math.pi / 1.5 + i * .9) * ss(.1, .35, t)
        TV.append(p + (Bb * math.cos(a) + Nn * math.sin(a)) * r0 * spike)
for i in range(len(P) - 1):
    for j in range(RING):
        j1 = (j + 1) % RING; TF.append((i * RING + j, i * RING + j1, (i + 1) * RING + j1, (i + 1) * RING + j))
TV.append(P[-1] + (P[-1] - P[-2]).normalized() * .02); c = len(TV) - 1; b = (len(P) - 1) * RING; TF += [(c, b + j, b + (j + 1) % RING) for j in range(RING)]
TV.append(P[0] - (P[1] - P[0]).normalized() * .01); c = len(TV) - 1; TF += [(c, (j + 1) % RING, j) for j in range(RING)]
a_, b_, c_ = TV[RING * 3], TV[RING * 3 + 1], TV[RING * 4 + 1]
if ((b_ - a_).cross(c_ - a_)).dot((a_ + b_) / 2 - P[3]) < 0: TF = [tuple(reversed(f)) for f in TF]
tail = smooth(obj_data('Rute', TV, TF)); set_region(tail, 'fell')
# Flammenzungen an der Spitze
flames = []
tip = P[-1]; td = (P[-1] - P[-4]).normalized()
for k in range(5):
    a = k / 5 * 2 * math.pi; off = Vector((math.cos(a) * .022, math.sin(a) * .016, 0)); p0 = tip - td * .03 + off
    d = (td + Vector((math.cos(a) * .35, math.sin(a) * .2 - .25, .25))).normalized()
    flames.append(tuft(p0, d, .07 + .02 * (k % 2), .026, 'flamme', up=(1, 0, 0), bend=(0, -.02, .02)))
flames.append(tuft(tip - td * .01, td + Vector((0, -.2, .3)), .11, .03, 'flamme', up=(1, 0, 0), bend=(0, -.03, .02)))
# Brustfell (Halskrause, gezackt) – cremefarben
ruff = []
for k in range(9):
    a = (k - 4) / 4; hit = BVB.ray_cast(Vector((a * .05, -.35, .2 + .05 * (1 - abs(a)))), Vector((0, 1, 0)))
    if hit[0]: ruff.append(tuft(hit[0] + Vector((0, .008, 0)), Vector((a * .4, -.45, -.9)), .055 - .01 * abs(a), .03, 'creme', up=(0, -1, 0)))
# Pfoten: runde Ballen (creme), leicht gespreizt
claws = []
for s_ in (-1, 1):
    for PP in (FL, HL):
        pw = PP[3] if s_ > 0 else mx(PP[3])
        claws.append(blob('Pfote', pw + Vector((0, -.012, .006)), (.029, .035, .018), 3, lambda v, q: Vector((q.x, q.y, max(q.z, -.012))))); set_region(claws[-1], 'pfote')
HEAD = join([head] + parts_head + lid_objs + [ml, ml2, mdec], 'Funki_Kopf')
BODY = join([body, tail] + flames + ruff + claws, 'Funki_Koerper')
EYE = join(eye_parts, 'Funki_Augen')
log('Dreiecke Kopf', tris(HEAD), 'Körper', tris(BODY), 'Augen', tris(EYE), 'gesamt', tris(HEAD) + tris(BODY) + tris(EYE))
if ONLY_FORM:
    workbench(os.path.join(DIR, 'funki_form.png'), [HEAD, BODY, EYE], [((1.3, -1.3, .55), (0, 0, .3), 60), ((0, -1.6, .45), (0, 0, .32), 60), ((1.6, 0, .4), (0, .05, .3), 60), ((.35, -.55, .5), (0, -.17, .42), 60)], (700, 700))
    sys.exit(0)
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'funki_teil2.py')).read())
