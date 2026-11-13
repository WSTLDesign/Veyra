# Noa (Held, Kind ≈ 5,3 Kopfhöhen) – komplett per Skript gebaut. Eigener Entwurf nach src/34-figures.js (look 'held', Stufe 0 „Startkleidung“):
# grünes T-Shirt mit Blatt-Emblem, braune Cargohose, helle Turnschuhe (Signatur-Schnürsenkel), Schutzbrille auf dem Kopf, braunes Wuschelhaar, grüne Augen.
# Aufruf: <venv>/bin/python tools/modelle/noa.py <ausgabe.glb> [--form]   (--form = nur Formen + Kontrollbild)
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vlib import *

OUT = [a for a in sys.argv[1:] if a.endswith('.glb')]; OUT = OUT[0] if OUT else '/tmp/noa.glb'
ONLY_FORM = '--form' in sys.argv; TEX = 1024
DIR = os.path.dirname(OUT) or '.'
reset(); random.seed(12)

# ---------------- Maße (Blender-Einheiten ≈ m) ----------------
H = 1.40; hh, hw, hd = .132, .106, .118           # Kopf: halbe Höhe/Breite/Tiefe (5,3 Kopfhöhen)
HC = Vector((0, .004, H - hh))                     # Kopfmitte
SH = Vector((.14, .012, 1.06))                   # Schultergelenk links
ARM = Vector((math.sin(math.radians(45)), 0, -math.cos(math.radians(45))))  # A-Pose 45°
L_UA, L_FA, L_HA = .228, .19, .135
EL = SH + ARM * L_UA; WR = EL + ARM * L_FA
HIP = Vector((.074, .0, .672)); KNEE = Vector((.079, -.008, .372)); ANK = Vector((.083, .012, .077))
BALL = Vector((.086, -.078, .022)); TOE = Vector((.087, -.13, .02))
def mx(v): return Vector((-v.x, v.y, v.z))

# ---------------- Regionen (Farbe = Region-ID fürs Malen; Maske: Umriss, Streuung, Glanz, Leuchten) ----------------
region('haut', '#f6d3b3', (1, 1, 0, 0)); region('haut_kopf', '#f6d3b3', (.8, 1, 0, 0)); region('lid', '#f6d3b3', (0, 1, 0, 0))
region('lidlinie', '#2b1f22', (0, 0, 0, 0)); region('braue', '#5a3418', (0, 0, 0, 0)); region('mundlinie', '#7a3b33', (0, 0, 0, 0))
region('shirt', '#3f7a3a', (1, .15, 0, 0)); region('shirt_saum', '#356a31', (1, .1, 0, 0)); region('kragen', '#efe6d2', (1, .1, 0, 0))
region('hose', '#6a4a30', (1, .05, 0, 0)); region('tasche', '#5f422a', (1, .05, 0, 0))
region('schuh', '#e8e2d6', (1, 0, .15, 0)); region('sohle', '#b9b6b0', (1, 0, .1, 0))
region('haar', '#8e5a30', (1, .2, .8, 0)); region('band', '#4d5236', (1, 0, .2, 0)); region('brille', '#9a7438', (1, 0, .7, 0)); region('glas', '#57c2dc', (1, 0, 1, 0))
region('geraet', '#3a3f4a', (1, 0, .6, 0)); region('schirm', '#7fe8f0', (0, 0, .5, .8))
region('auge', '#ffffff', (0, 0, 1, 0)); region('mund_innen', '#5a2028', (0, 0, 0, 0))

# =====================================================================
# Kopf: Quad-Kugel, Schädel/Kiefer/Wangen/Nase/Augenmulden als weiche Verformungen
# =====================================================================
EYE_X, EYE_Z = .37, -.075        # normiert
def head_shape(u):
    x, y, z = u.x, u.y, u.z; fz = -y
    jaw = ss(-.08, -.95, z); X = x * hw * (1 - .08 * jaw - .07 * ss(-.62, -1, z)); Y = y * hd; Z = z * hh * (1 - .07 * jaw)
    if fz > 0:
        Y *= 1 - .05 * ss(-.4, .4, z) * ss(.3, .9, fz)                                # Gesicht leicht flacher
        Y -= hd * .045 * ss(-.55, -.95, z) * ss(.4, .95, fz)                         # Kinn etwas vor
    else: Y *= 1 + .07 * ss(-.35, .55, z)                                             # Hinterkopf
    if z > .55: X *= 1 - .05 * ss(.55, 1, z)
    for s in (-1, 1):
        dc = (x - s * .5) ** 2 + ((z + .36) * 1.1) ** 2                              # Kinderwangen
        Y -= hd * .05 * gauss(dc, .22) * ss(.2, .7, fz); X += s * hw * .04 * gauss(dc, .24)
        de = (x - s * EYE_X) ** 2 + ((z - EYE_Z) * 1.2) ** 2                         # Augenmulde
        Y += hd * .03 * gauss(de, .13) * ss(.5, .85, fz)
        db = (x - s * .36) ** 2 + ((z - .2) * 2.4) ** 2                              # Brauenbogen
        Y -= hd * .016 * gauss(db, .15) * ss(.5, .85, fz)
    dn = (x / .07) ** 2 + ((z + .2) / .16) ** 2                                       # Nasenrücken/-spitze (klein, kindlich)
    Y -= hd * .035 * math.exp(-dn) * ss(.75, .97, fz) * ss(.05, -.2, z)
    dt = (x / .085) ** 2 + ((z + .3) / .07) ** 2
    Y -= hd * .045 * math.exp(-dt) * ss(.75, .97, fz)
    dl = (x / .2) ** 2 + ((z + .53) / .06) ** 2                                       # Unterlippe angedeutet
    Y -= hd * .012 * math.exp(-dl) * ss(.75, .97, fz)
    return Vector((X, Y, Z)) + HC
head = quad_sphere('Kopf', 9); deform(head, head_shape)
subsurf(head, 1); smooth(head); set_region(head, 'haut_kopf')
def surf(xn, zn):
    """Punkt auf der Gesichtsfläche (normiert x,z) + Normale – per Strahl von vorn"""
    from mathutils.bvhtree import BVHTree
    global _BVH
    if '_BVH' not in globals() or _BVH is None:
        _BVH = BVHTree.FromObject(head, bpy.context.evaluated_depsgraph_get())
    o = Vector((xn * hw * (1 - .2 * ss(-.08, -.95, zn)), -1, HC.z + zn * hh)); hit = _BVH.ray_cast(o, Vector((0, 1, 0)))
    return hit[0], hit[1]
_BVH = None

# Ohren
ears = []
for s in (-1, 1):
    def ef(v, q, s=s):
        cup = .55 * math.exp(-((v.y * 1.3) ** 2 + (v.z * 1.0) ** 2) * 2.2) if v.x * s > 0 else 0
        return Vector((q.x * (1 - cup), q.y, q.z + .004 * v.y))
    e = blob('Ohr', (s * hw * .95, .012, HC.z - .03), (.011, .022, .033), 4, ef, (0, 0, s * math.radians(-14)))
    set_region(e, 'haut_kopf'); ears.append(e)

# ---------------- Augen: Augapfel (eigenes Netz) + Ober-/Unterlid-Schalen mit Lidlinie ----------------
RE = .0238
EYES = {}
def th_u(ph):  # Oberlid-Kante (Grad), ph Grad (+ = außen)
    k = ss(0, 1, abs(ph) / 47.0); return 27 * (1 - k ** 1.7) + (3 if ph > 0 else -3) * k
def th_l(ph):
    k = ss(0, 1, abs(ph) / 47.0); return -20 * (1 - k ** 1.5) + (3 if ph > 0 else -3) * k
eye_parts, lid_objs = [], []
for s in (-1, 1):
    p, n = surf(s * EYE_X, EYE_Z)
    fwd = Vector((s * .16, -1, .02)).normalized()            # Blickachse leicht nach außen
    C = p - fwd * (RE - .0026)
    EYES[s] = (C, fwd)
    # lokaler Rahmen: f vorwärts, r außen (s·x), u oben
    r = Vector((0, 0, 1)).cross(fwd).normalized() * (-s); u = fwd.cross(r).normalized() * (-s)
    if u.z < 0: u = -u
    def sp(ph, th, R): a, b = math.radians(ph), math.radians(th); return C + (fwd * (math.cos(b) * math.cos(a)) + r * (math.cos(b) * math.sin(a)) + u * math.sin(b)) * R
    # Augapfel (UV-Kugel, Pol nach vorn)
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=12, radius=RE)
    eo = obj_bm('Auge', bm); M = Matrix((r, u, -fwd)).transposed()  # lokale z = −vorn → Pol −z … wir drehen: z_lokal → fwd
    M = Matrix((r, u, fwd)).transposed().to_4x4(); M.translation = C
    eo.data.transform(M); orient_out(eo, C); smooth(eo); set_region(eo, 'auge')
    uv = eo.data.uv_layers.new(name='UVMap')
    for l in eo.data.loops:
        q = eo.data.vertices[l.vertex_index].co - C
        uv.data[l.index].uv = (.25 + .25 * q.dot(r) / RE * s * .98, .5 + .5 * q.dot(u) / RE * .98)   # linke Hälfte der Augen-Textur
    eye_parts.append(eo)
    # Lidschalen
    NPH, NT = 16, 6
    for which in ('o', 'u'):
        V, F, R_ = [], [], []
        for i in range(NPH + 1):
            ph = -86 + 172 * i / NPH
            e0 = th_u(ph) if which == 'o' else th_l(ph)
            for j in range(NT + 1):
                t = j / NT; th = (e0 + (78 - e0) * t ** 1.3) if which == 'o' else (e0 + (-72 - e0) * t ** 1.3)
                V.append(sp(ph, th, RE + .0011 + .0006 * t))
        for i in range(NPH):
            for j in range(NT):
                a = i * (NT + 1) + j; f = (a, a + NT + 1, a + NT + 2, a + 1) if which == 'o' else (a, a + 1, a + NT + 2, a + NT + 1)
                F.append(f); R_.append('lidlinie' if j == 0 and (which == 'o' or abs(-86 + 172 * (i + .5) / NPH) > 30) else 'lid')
        # Lidkante nach innen (Dicke)
        base = len(V)
        for i in range(NPH + 1):
            ph = -86 + 172 * i / NPH; e0 = th_u(ph) if which == 'o' else th_l(ph); V.append(sp(ph, e0 + (-2.5 if which == 'o' else 2), RE - .0004))
        for i in range(NPH):
            a = i * (NT + 1); b = (i + 1) * (NT + 1)
            F.append((base + i, base + i + 1, b, a) if which == 'o' else (a, b, base + i + 1, base + i)); R_.append('lidlinie' if which == 'o' else 'lid')
        lo = obj_data('Lid_' + which, V, F)
        for nm in ('lid', 'lidlinie'): lo.data.materials.append(REG[nm]['mat'])
        for pg, rn in zip(lo.data.polygons, R_): pg.material_index = 0 if rn == 'lid' else 1
        orient_out(lo, C); smooth(lo); lo['lid'] = which; lo['side'] = s
        vg = lo.vertex_groups.new(name='lid_%s_%s' % (which, 'L' if s > 0 else 'R')); vg.add(list(range(len(V))), 1, 'REPLACE')
        lid_objs.append(lo)
    # Lidschwung außen (kleiner Wimpernflügel)
    W0 = [sp(40 + k * 4, th_u(40 + k * 4) + 1 + k * .5, RE + .0016) for k in range(5)]
    wo = loft('Wimper', W0, lambda t: .0016 * (1 - t) + .0003, lambda t: .0007, ring=4, n=6, flat_up=tuple(u))
    set_region(wo, 'lidlinie'); lid_objs.append(wo)
    vg = wo.vertex_groups.new(name='lid_o_%s' % ('L' if s > 0 else 'R')); vg.add(list(range(len(wo.data.vertices))), 1, 'REPLACE')
# Augenbrauen (über der Fläche, leicht gebogen)
brows = []
for s in (-1, 1):
    pts = []
    for k in range(5):
        xn = s * (.18 + k * .1); zn = .2 + .055 * math.sin(k / 4 * math.pi) - .015 * k / 4
        p, n = surf(xn, zn); pts.append(p + n * .0012)
    bo = loft('Braue', pts, lambda t: .0042 * (1 - .65 * t) + .0012 * (t < .1), lambda t: .0011, ring=6, n=10, flat_up=(0, -1, 0))
    set_region(bo, 'braue'); bo['side'] = s; brows.append(bo)
# Mund: Linie (Hauptmaterial) + Mundhöhlen-Aufkleber (Augenmaterial, öffnet per Shape Key)
MZ = -.555
mpts = []
for k in range(9):
    xn = (k / 8 - .5) * .34; zn = MZ + .02 * (1 - (2 * k / 8 - 1) ** 2) * -1 + .035 * (abs(2 * k / 8 - 1)) ** 2
    p, n = surf(xn, zn); mpts.append(p + n * .0007)
mline = loft('Mundlinie', mpts, lambda t: .0009 * (1 - .55 * abs(2 * t - 1) ** 2), lambda t: .0004, ring=4, n=14, flat_up=(0, -1, 0))
set_region(mline, 'mundlinie')
# Aufkleber-Gitter 8×4 über dem Mund, im Ruhezustand auf Linie zusammengeschoben
MD = []; MF = []; MUV = []
for j in range(5):
    for i in range(9):
        xn = (i / 8 - .5) * .36; p, n = surf(xn, MZ - .0); MD.append(p + n * .0009); MUV.append((.5 + .5 * i / 8, .5 * j / 4))
for j in range(4):
    for i in range(8):
        a = j * 9 + i; MF.append((a, a + 1, a + 10, a + 9))
mdec = obj_data('Mundhoehle', MD, MF); set_region(mdec, 'mund_innen')
uvl = mdec.data.uv_layers.new(name='UVMap')
for l in mdec.data.loops: uvl.data[l.index].uv = MUV[l.vertex_index]
mdec['grid'] = 1
gr = mdec.vertex_groups.new(name='mund_reihe'); gc = mdec.vertex_groups.new(name='mund_spalte')
for vi in range(len(MD)): gr.add([vi], (vi // 9 + 1) / 5, 'REPLACE'); gc.add([vi], (vi % 9 + 1) / 9, 'REPLACE')

# ---------------- Haare: Kappe (Haaransatz) + Strähnen ----------------
def head_dir_point(d, extra):
    """Punkt in Richtung d (Einheitsvektor, normierter Kopfraum) auf der Kopfoberfläche + extra"""
    q = head_shape(d) - HC; return HC + q * (1 + extra / q.length)
def hairline(ph):  # ph: 0 = vorn, ±π hinten, + = links → max. Polwinkel der Kappe
    c = math.cos(ph); fr = 1.0; side = 1.6; back = 2.05
    return lerp(lerp(side, fr, ss(.0, 1, c)), back, ss(-.1, -1, c))
U_, V_ = 10, 36; CV = []; CF = []
for i in range(U_ + 1):
    for j in range(V_):
        ph = j / V_ * 2 * math.pi; tmax = hairline(ph); th = tmax * (i / U_) ** .9
        d = Vector((math.sin(th) * math.sin(ph), -math.sin(th) * math.cos(ph), math.cos(th)))
        clump = .004 * math.sin(ph * 9 + i * 1.3) * ss(.2, 1, i / U_)
        CV.append(head_dir_point(d, .009 + .006 * (1 - (i / U_) ** 2) + clump))
for i in range(U_):
    for j in range(V_):
        j1 = (j + 1) % V_; CF.append((i * V_ + j, i * V_ + j1, (i + 1) * V_ + j1, (i + 1) * V_ + j))
cap = obj_data('Haarkappe', CV, CF); smooth(cap); set_region(cap, 'haar')
strands = []
def lock(base_dir, extra, pts_rel, w, d, n=8, ring=6, up=None):
    """Strähne: Ansatz auf der Kappe, Stützpunkte relativ (Kopfraum), Blattquerschnitt"""
    b = head_dir_point(Vector(base_dir).normalized(), extra); P = [b] + [b + Vector(q) for q in pts_rel]
    o = loft('Straehne', P, lambda t: w * (1 - t ** 1.5) * (.6 + .4 * math.sin(min(1, t * 2.5) * math.pi / 2)) + .0006,
             lambda t: d * (1 - t) + .0005, ring=ring, n=n, flat_up=up or tuple((b - HC).normalized()))
    set_region(o, 'haar'); strands.append(o); return o
# Strähnen als Flusslinien: vom Wirbel (oben, leicht hinten) über die Kopfform bis über den Haaransatz, Spitzen wippen nach außen
def sdir(th, ph): return Vector((math.sin(th) * math.sin(ph), -math.sin(th) * math.cos(ph), math.cos(th)))
def flow_lock(ph0, th0, th1, swirl, w, d, lift=.012, base=.011, flick=.012, n=9):
    P = []; NRM = []
    for k in range(n):
        t = k / (n - 1); th = lerp(th0, th1, t); ph = ph0 + swirl * t * t
        off = base + lift * math.sin(min(1, t * 1.6) * math.pi / 2) * (1 - .5 * t) + flick * ss(.7, 1, t)
        dd = sdir(th, ph); P.append(head_dir_point(dd, off))
    up = (P[0] - HC).normalized()
    o = loft('Straehne', P, lambda t: w * (1 - t ** 1.8) * (.55 + .45 * ss(0, .25, t)) + .0005, lambda t: d * (1 - t ** 1.3) + .0005, ring=5, n=10, flat_up=tuple(up))
    set_region(o, 'haar'); strands.append(o); return o
rnd = random.Random(5)
# Pony über die Stirn (vorn, Spitzen über den Brauen, unregelmäßig)
for k in range(9):
    a = (k - 4) / 4; ph = a * .95 + rnd.uniform(-.05, .05)
    flow_lock(ph * .6, .25, 1.18 + .06 * abs(a) + rnd.uniform(-.06, .06), ph * .35 + rnd.uniform(-.12, .12), .036 - .004 * abs(a), .008, lift=.012, base=.012, flick=.006)
# Seiten (über die Ohren) und Hinterkopf
for k in range(14):
    ph = .95 + k / 13 * (2 * math.pi - 1.9); side = math.cos(ph)
    th1 = hairline(ph) + .12 + rnd.uniform(-.05, .08)
    flow_lock(ph + rnd.uniform(-.06, .06), .3, th1, rnd.uniform(-.25, .25), .04, .009, lift=.016, base=.012, flick=.014 + .006 * (k % 2))
# obere Lage: kürzere Büschel für Volumen und wuschelige Silhouette
for k in range(11):
    ph = k / 11 * 2 * math.pi + .2
    flow_lock(ph, .05, .62 + rnd.uniform(0, .25), rnd.uniform(-.4, .4), .034, .009, lift=.022, base=.018, flick=.016)

# ---------------- Schutzbrille auf der Stirn ----------------
gog = []
# Band rund um den Kopf (auf der Kappe)
BV = []; ring_pts = []
for j in range(33):
    ph = j / 32 * 2 * math.pi; th = .78 + .1 * ss(-.2, -1, math.cos(ph))
    d = Vector((math.sin(th) * math.sin(ph), -math.sin(th) * math.cos(ph), math.cos(th))); ring_pts.append(head_dir_point(d, .021))
band = loft('Band', ring_pts, lambda t: .0042, lambda t: .0017, ring=4, n=40, flat_up=(0, 0, 1), cap0=False); set_region(band, 'band'); gog.append(band)
for s in (-1, 1):
    d = Vector((s * .3, -math.cos(.62), math.sin(.85))).normalized(); c = head_dir_point(d, .03)
    nrm = (c - HC).normalized(); nrm = (nrm + Vector((0, 0, .45))).normalized()
    q = nrm.to_track_quat('Z', 'Y')
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=.024, radius2=.021, depth=.016)
    o = obj_bm('Brillenrahmen', bm); M = q.to_matrix().to_4x4(); M.translation = c; o.data.transform(M); mod(o, 'BEVEL', width=.002, segments=1); apply_mods(o); smooth(o); set_region(o, 'brille'); gog.append(o)
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=6, radius=.0195)
    o = obj_bm('Glas', bm); o.data.transform(Matrix.Diagonal((1, 1, .38, 1))); M = q.to_matrix().to_4x4(); M.translation = c + nrm * .008; o.data.transform(M); smooth(o); set_region(o, 'glas'); gog.append(o)
# Steg
pL = head_dir_point(Vector((.12, -math.cos(.62), math.sin(.85))).normalized(), .03); pR = mx(pL)
st = loft('Steg', [pR, (pR + pL) / 2 + Vector((0, -.004, .002)), pL], lambda t: .0035, lambda t: .0025, ring=6, n=6); set_region(st, 'brille'); gog.append(st)

# =====================================================================
# Körper: Skin-Graph (Rumpf, Arme mit Hand + Fingern, Beine) → Subdivision → Formung
# =====================================================================
N = []; E = []; R = []
def node(p, r): N.append(tuple(p)); R.append(r); return len(N) - 1
def chain(ids):
    for a, b in zip(ids, ids[1:]): E.append((a, b))
pel = node((0, .0, .70), .112)
sp1 = node((0, .0, .80), .102); sp2 = node((0, .0, .9), .11); ch = node((0, .004, 1.0), .118); ch2 = node((0, .008, 1.05), .085); nk0 = node((0, .01, 1.08), .05); nk1 = node((0, .012, 1.16), .047)
chain([pel, sp1, sp2, ch, ch2, nk0, nk1])
for s in (-1, 1):
    S = SH if s > 0 else mx(SH); A = ARM if s > 0 else mx(ARM)
    sh0 = node((s * .07, .01, 1.05), .066); sh = node(tuple(S), .05)
    ua = [node(tuple(S + A * L_UA * k), .046 - .008 * k) for k in (.33, .66)]
    el = node(tuple(S + A * L_UA), .034); fa = [node(tuple(S + A * (L_UA + L_FA * k)), .035 - .008 * k) for k in (.33, .66)]
    wr = node(tuple(S + A * (L_UA + L_FA)), .024)
    chain([ch, sh0, sh] + ua + [el] + fa + [wr])
    # Hand: Handfläche + 4 Finger + Daumen (leicht gekrümmt, entspannt)
    side = Vector((0, -1, 0)); fwd = A
    pa = node(tuple(S + A * (L_UA + L_FA + .045)), (.023, .012)); E.append((wr, pa))
    for f in range(4):
        off = (f - 1.5) * .0115; b0 = S + A * (L_UA + L_FA + .078) + side * off * 1.0
        L = [.026, .02, .016][0] * (1 - .12 * abs(f - 1.3)); ids = [node(tuple(b0), .0062)]
        d = A.copy(); p = b0.copy()
        for k in range(2):
            d = (Matrix.Rotation(s * -.18, 3, Vector((0, 1, 0))) @ d) if False else d; d = (d + Vector((0, 0, 0))).normalized()
            # Krümmung nach innen (Handfläche zeigt zum Körper → −x·s)
            d = (d + Vector((-s * .35, 0, 0))).normalized(); p = p + d * L * (1 - .2 * k); ids.append(node(tuple(p), .0056 - .0007 * k))
        E.append((pa, ids[0])); chain(ids)
    tb0 = S + A * (L_UA + L_FA + .04) + Vector((0, -.018, 0)); tb1 = tb0 + Vector((-s * .012, -.016, -.014)); tb2 = tb1 + Vector((-s * .012, -.008, -.014))
    t0 = node(tuple(tb0), .0085); t1 = node(tuple(tb1), .007); t2 = node(tuple(tb2), .006); E.append((pa, t0)); chain([t0, t1, t2])
    # Bein
    Hp = HIP if s > 0 else mx(HIP); K = KNEE if s > 0 else mx(KNEE); A_ = ANK if s > 0 else mx(ANK)
    h0 = node(tuple(Hp + Vector((0, 0, .02))), .085); th = [node(tuple(Hp.lerp(K, k)), .082 - .022 * k) for k in (.35, .7)]
    kn = node(tuple(K), .054); sh_ = [node(tuple(K.lerp(A_, k)), .053 - .016 * k) for k in (.3, .65)]; an = node(tuple(A_), .036)
    chain([pel, h0] + th + [kn] + sh_ + [an])
body = skin_body('Koerper', N, E, R, root=pel, sub=1, branch_smooth=.4)
# Formung: Rumpf-Querschnitt (breit/flach), Brust, Po, Waden, Kleidung abheben
def arm_coord(p):
    """(s, Abstand entlang Arm ab Schulter, radial) oder None"""
    s = 1 if p.x > 0 else -1; S = SH if s > 0 else mx(SH); A = ARM if s > 0 else mx(ARM); q = p - S; t = q.dot(A)
    if abs(p.x) < .1 or t < -.02: return None
    return s, t, (q - A * t).length
def in_shirt(p):
    ac = arm_coord(p)
    if ac and ac[1] > .0: return ac[1] < .118
    return .655 < p.z < 1.09
def in_pants(p):
    return p.z < .7 and p.z > .095 and not (arm_coord(p) and arm_coord(p)[1] > 0)
def body_shape(p):
    p = p.copy(); ac = arm_coord(p)
    if not ac and .6 < p.z < 1.1:
        z = p.z; wf = lerp(1.06, 1.18, ss(.75, 1.0, z)) * lerp(1, .93, ss(.78, .86, z) * (1 - ss(.9, 1.0, z))); df = lerp(.86, .78, ss(.8, 1.0, z))
        p.x *= wf if abs(p.x) < .2 else 1; p.y = (p.y - .0) * df
        if p.y < 0: p.y -= .012 * gauss((z - .97) ** 2, .05) * ss(.0, .09, abs(p.x) + .02)   # Brustkorb vorn
        if p.y > 0 and z < .76: p.y += .018 * gauss((z - .67) ** 2, .045) * ss(.0, .05, abs(p.x))  # Gesäß
        if p.y > 0 and z > .9: p.y += .008 * gauss((z - .98) ** 2, .05)                          # Schulterblätter
    if p.z < .37 and p.z > .1 and abs(p.x) > .03:   # Wade
        s = 1 if p.x > 0 else -1; K = KNEE if s > 0 else mx(KNEE); A_ = ANK if s > 0 else mx(ANK)
        if p.y > K.y - .005: p.y += .011 * gauss((p.z - .28) ** 2, .05)
    # Kleidung abheben + Falten
    if in_shirt(p) and not (ac and ac[1] < 0):
        c = Vector((0, 0, p.z)) if not ac else None; n = (p - Vector((0, .0, p.z))).normalized() if not ac else None
        if ac: s, t, rr = ac; S = SH if s > 0 else mx(SH); A = ARM if s > 0 else mx(ARM); ctr = S + A * t; n = (p - ctr).normalized()
        f = .006 + (.0035 * math.sin(p.z * 160 + p.x * 40) * ss(.66, .76, p.z) * ss(.86, .76, p.z) if not ac else .003 * math.sin(t * 90))
        p += n * (f + (.006 if ac else 0))
        if not ac and p.z < .72: p += n * .006 * ss(.72, .67, p.z)   # Saum fällt locker
    elif in_pants(p):
        s = 1 if p.x > 0 else -1; K = KNEE if s > 0 else mx(KNEE); Hp = HIP if s > 0 else mx(HIP); A_ = ANK if s > 0 else mx(ANK)
        if p.z > .62: n = (p - Vector((0, 0, p.z))).normalized(); n.z = 0
        else:
            a, b = (Hp, K) if p.z > K.z else (K, A_); ab = (b - a); t = max(0, min(1, (p - a).dot(ab) / ab.length_squared)); n = (p - (a + ab * t)); n.normalize()
        fold = .0035 * math.sin(p.z * 120 + s * 2) * (gauss((p.z - K.z) ** 2, .035) + 1.5 * ss(.2, .12, p.z))
        p += n * (.0055 + fold + .008 * ss(.2, .11, p.z))   # Hosenbein unten weiter
    return p
deform(body, body_shape)
for pg in body.data.polygons: pass
# Regionen am Körper (für Masken; die Farben malt die Textur)
for nm in ('haut', 'shirt', 'hose'): body.data.materials.append(REG[nm]['mat'])
for pg in body.data.polygons:
    c = pg.center; pg.material_index = 1 if in_shirt(c) else 2 if in_pants(c) else 0

# Säume / Kragen / Bündchen
extra = []
def ring_at(name, center, axis, radius_fn, w, d, regn, n=28):
    a = Vector(axis).normalized(); b = a.orthogonal().normalized(); c2 = a.cross(b); pts = []
    for j in range(n + 1):
        t = j / n * 2 * math.pi; pts.append(Vector(center) + (b * math.cos(t) + c2 * math.sin(t)) * radius_fn(t))
    o = loft(name, pts, lambda t: w, lambda t: d, ring=6, n=n + 1, cap0=False, flat_up=tuple(a)); set_region(o, regn); extra.append(o); return o
from mathutils.bvhtree import BVHTree
BVB = BVHTree.FromObject(body, bpy.context.evaluated_depsgraph_get())
def ring_fit(name, center, axis, w, d, regn, push=.002, n=22):
    """Ring, der sich an die Körperoberfläche anlegt (Strahlen vom Zentrum nach außen)"""
    a = Vector(axis).normalized(); b = a.orthogonal().normalized(); c2 = a.cross(b); pts = []
    for j in range(n):
        t = j / n * 2 * math.pi; dirv = b * math.cos(t) + c2 * math.sin(t)
        hit = BVB.ray_cast(Vector(center), dirv, .09 if regn == 'kragen' else .12); pts.append((hit[0] if hit[0] else Vector(center) + dirv * .05) + dirv * push)
    pts.append(pts[0]); o = loft(name, pts, lambda t: w, lambda t: d, ring=4, n=n + 1, cap0=False, flat_up=tuple(a)); set_region(o, regn); extra.append(o); return o
ring_fit('Kragen', (0, .012, 1.088), (0, .1, 1), .0055, .003, 'kragen', .001)
ring_fit('Shirtsaum', (0, 0, .662), (0, 0, 1), .005, .0028, 'shirt_saum', .002, 40)
ring_fit('Hosenbund', (0, 0, .70), (0, 0, 1), .009, .0025, 'hose', .0005, 40)
for s in (-1, 1):
    S = SH if s > 0 else mx(SH); A = ARM if s > 0 else mx(ARM)
    ring_fit('Aermel', S + A * .116, A, .0048, .0026, 'shirt_saum', .0015)
    A_ = ANK if s > 0 else mx(ANK); ring_fit('Umschlag', A_ + Vector((0, 0, .045)), (0, -.15, 1), .011, .0035, 'hose', .0015)
    # Cargotaschen
    K = KNEE if s > 0 else mx(KNEE); Hp = HIP if s > 0 else mx(HIP); c = Hp.lerp(K, .5)
    hit = BVB.ray_cast(c + Vector((s * .2, 0, 0)), Vector((-s, 0, 0))); pc = hit[0] + Vector((s * .006, 0, 0))
    tb = blob('Tasche', pc, (.008, .036, .044), 3, lambda v, q: Vector((q.x * (1 if v.x * s < 0 else 1) - (s * .004 * (1 - v.z * v.z) if v.x * s < 0 else 0), q.y, q.z)))
    set_region(tb, 'tasche'); extra.append(tb)
    fl = blob('Klappe', pc + Vector((s * .004, 0, .036)), (.006, .038, .012), 3); set_region(fl, 'tasche'); extra.append(fl)
# Schuhe
shoes = []
for s in (-1, 1):
    A_ = ANK if s > 0 else mx(ANK)
    def shoe_f(v, q, s=s):
        x, y, z = q.x, q.y, q.z
        if v.y < 0: z *= 1 - .45 * ss(.1, 1, -v.y)  # Spitze flacher
        if v.z < -.3: z = max(z, -.032)
        return Vector((x * (1 + .1 * ss(0, -1, v.y)), y, z))
    up = blob('Schuh', (A_.x, -.035, .047), (.05, .102, .048), 4, shoe_f); set_region(up, 'schuh')
    deform(up, lambda p: Vector((p.x, p.y, max(p.z, .012))))
    so = blob('Sohle', (A_.x, -.035, .012), (.053, .106, .014), 4, lambda v, q: Vector((q.x * (1 + .08 * ss(0, -1, v.y)), q.y, q.z))); set_region(so, 'sohle')
    # Schaft-Rand um den Knöchel
    shoes += [up, so]
    ring_fit('Schaftrand', A_ + Vector((0, .006, .012)), (0, .3, 1), .006, .004, 'schuh', .004)
# Handgelenk-Gerät (links)
S = SH; A = ARM; dv = S + A * (L_UA + L_FA - .03); hit = BVB.ray_cast(dv + Vector((0, 0, .1)), Vector((0, 0, -1)))
gq = A.to_track_quat('Y', 'Z')
for nm, sz, reg, off in (('Geraet', (.024, .03, .009), 'geraet', 0), ('Schirm', (.017, .021, .003), 'schirm', .0075)):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1); o = obj_bm(nm, bm); o.data.transform(Matrix.Diagonal((*sz, 1)))
    mod(o, 'BEVEL', width=.0025 if reg == 'geraet' else .001, segments=3); apply_mods(o); smooth(o)
    M = gq.to_matrix().to_4x4(); M.translation = (hit[0] if hit[0] else dv) + Vector((0, 0, .005 + off)); o.data.transform(M); set_region(o, reg); extra.append(o)
ring_fit('Armband', dv, A, .009, .003, 'geraet', .002)

# ---------------- Zusammenfügen ----------------
log('Teile', 'koerper', tris(body), 'kappe', tris(cap), 'straehnen', sum(tris(x) for x in strands), 'extra', sum(tris(x) for x in extra), 'schuhe', sum(tris(x) for x in shoes), 'brille', sum(tris(x) for x in gog), 'kopf', tris(head))
HEAD = join([head] + ears + lid_objs + brows + [mline, mdec], 'Noa_Kopf')
BODY = join([body] + extra + shoes + [cap] + strands + gog, 'Noa_Koerper')
EYE = join(eye_parts, 'Noa_Augen')
for o in (HEAD, BODY, EYE): smooth(o)
# Unter der Haarkappe liegende Schädelflächen entfernen (Dreiecke sparen)
from mathutils.bvhtree import BVHTree
bvc = BVHTree.FromObject(BODY, bpy.context.evaluated_depsgraph_get())
bm = bmesh.new(); bm.from_mesh(HEAD.data); bm.faces.ensure_lookup_table(); kill = []
mi_skin = list(HEAD.data.materials).index(REG['haut_kopf']['mat'])
for f in bm.faces:
    if f.material_index != mi_skin: continue
    c = f.calc_center_median(); d = (c - HC)
    if d.z / hh > .68:
        hit = bvc.ray_cast(c + d.normalized() * .0005, d.normalized(), .05)
        if hit[0] and all(bvc.ray_cast(v.co + d.normalized() * .0005, d.normalized(), .05)[0] for v in f.verts): kill.append(f)
bmesh.ops.delete(bm, geom=kill, context='FACES'); bm.to_mesh(HEAD.data); bm.free()
log('Teile', {k: tris(v) for k, v in [('body', body), ('cap', cap)]}, 'straehnen', sum(tris(x) for x in strands), 'extra', sum(tris(x) for x in extra), 'schuhe', sum(tris(x) for x in shoes), 'brille', sum(tris(x) for x in gog)) if False else None
log('Dreiecke Kopf', tris(HEAD), 'Körper', tris(BODY), 'Augen', tris(EYE), 'gesamt', tris(HEAD) + tris(BODY) + tris(EYE))

if ONLY_FORM:
    workbench(os.path.join(DIR, 'noa_form.png'), [HEAD, BODY, EYE], [((0, -3.2, .8), (0, 0, .72), 60), ((2.2, -2.4, 1.0), (0, 0, .72), 60), ((.25, -.75, 1.3), (0, 0, 1.25), 70), ((-.5, -.5, 1.3), (0, 0, 1.25), 70)], (700, 900))
    sys.exit(0)
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'noa_teil2.py')).read())
