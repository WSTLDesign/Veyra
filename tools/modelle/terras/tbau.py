# Veyra Terra-Baukasten (Serie, ab 12.11. 22:20) – baut auf tools/modelle/vlib.py auf (unverändert genutzt).
# Inhalt: Material-Arten (Fell, Schuppen, Haut, Federn, Leuchten), Kopf-/Augen-/Lid-/Mund-System als Funktion, volumetrische Ohren,
# Fellbüschel (Silhouette), Rig-Vorlagen (Vierbeiner, Zweibeiner, Vogel, Wasser, Schwebend) mit gemeinsamem Clip-Satz
# (idle · walk · run · attack · hit · faint · joy · catch [+ swim/fly]), Malen (numpy je Texel), LOD 50 %, Export + Kennzahlen.
# Koordinaten wie vlib: Blender Z oben, vorn = −Y, links = +X. Ein Modell je Prozess (reset()).
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from vlib import *
from mathutils.bvhtree import BVHTree
import types

C = types.SimpleNamespace()          # Bau-Kontext des aktuellen Modells
KIND = {}                            # Region → Materialart
MASK = {'fell': (1, .5, .1, 0), 'haut': (1, .75, .2, 0), 'schuppe': (1, .25, .55, 0), 'feder': (.4, .35, .12, 0), 'horn': (1, .1, .6, 0),
        'glut': (.25, 0, 0, 1), 'kristall': (.6, 0, .9, .45), 'blatt': (.22, .3, .25, 0), 'bluete': (.8, .6, .15, .08), 'nase': (1, 0, .9, 0),
        'linie': (0, 0, 0, 0), 'lid': (0, .4, 0, 0), 'auge': (0, 0, 1, 0), 'mund': (0, 0, 0, 0), 'kralle': (1, 0, .4, 0)}
def treg(name, col, kind='fell', mask=None):
    region(name, col, mask or MASK.get(kind, (1, .5, .1, 0))); KIND[name] = kind; return name
def mx(v): return Vector((-v.x, v.y, v.z))
def S_(p, s): return p if s > 0 else mx(p)
def V(*a): return Vector(a)

def start(name, H, tex=1024, seed=1):
    """H = Modellhöhe (Blender-Einheiten, nur für Rauschen/Strichstärken)"""
    reset(); random.seed(seed); C.__dict__.clear(); KIND.clear(); REG.clear()
    C.name = name; C.H = H; C.tex = tex; C.parts_head = []; C.parts_body = []; C.eye_parts = []; C.lids = []; C.mouth = []
    C.EYES = {}; C.EARS = {}; C.glow = []; C.bones = []; C.t0 = time.time()
    treg('lid', '#888888', 'lid'); treg('lidlinie', '#2a1a14', 'linie'); treg('auge', '#ffffff', 'auge'); treg('mund_innen', '#5a2028', 'mund')

# ---------------- Kopf ----------------
def kopf(HC, HR, sn=.4, sn_drop=.08, sn_w=.25, sn_zo=.3, sn_s=.3, stirn=.07, mulde=.05, backen=0.0, cuts=6, extra=None, reg='fell_kopf'):
    """Quad-Kugel-Schädel; Schnauze sn (Anteil von HR[1]) nach vorn-unten, Stirnabsatz, Augenmulden, Backen. extra(u,X,Y,Z)->(X,Y,Z)"""
    C.HC = Vector(HC); C.HR = tuple(HR)
    def f(u):
        x, y, z = u.x, u.y, u.z; fz = -y; X, Y, Z = x * HR[0], y * HR[1], z * HR[2]
        if z < -.2: X *= 1 - .12 * ss(-.2, -1, z)
        m = ss(.55, .95, fz) * gauss(x * x * 1.1 + (z + sn_zo) ** 2, sn_s)
        Y -= sn * HR[1] * m; Z -= sn_drop * HR[2] * m; X *= 1 - sn_w * m * ss(.6, 1, fz)
        Y += stirn * HR[1] * ss(.6, .95, fz) * gauss(x * x + (z - .1) ** 2, .2)
        for s in (-1, 1): Y += mulde * HR[1] * gauss((x - s * .42) ** 2 + (z - .08) ** 2 * 1.4, .15) * ss(.4, .8, fz)
        if backen: X *= 1 + backen * gauss((z + .35) ** 2 + (y + .2) ** 2 * .5, .3)
        if extra: X, Y, Z = extra(u, X, Y, Z)
        return Vector((X, Y, Z)) + C.HC
    h = quad_sphere('Kopf', cuts); deform(h, f); subsurf(h, 1); set_region(h, reg); C.head = h
    C.BVH_H = BVHTree.FromObject(h, bpy.context.evaluated_depsgraph_get()); return h
def hsurf(d, extra=0.0):
    d = Vector(d).normalized(); R = max(C.HR) * 3; hit = C.BVH_H.ray_cast(C.HC + d * R, -d)
    if hit[0] is None: return C.HC + d * max(C.HR), d
    return hit[0] + hit[1] * extra, hit[1]

# ---------------- Büschel (Fellkanten-Silhouette), Blätter, Flammen ----------------
def bueschel(p, d, L, w, regn, up=(0, 0, 1), bend=(0, 0, 0), dick=.5, ring=6, n=6, spitz=1.4):
    d = Vector(d).normalized(); P = [p, p + d * L * .5 + Vector(bend) * .4, p + d * L + Vector(bend)]
    o = loft('Bueschel', P, lambda t: w * math.sin(math.pi * (.18 + .82 * t)) ** .7 * (1 - t ** 3) + .0004,
             lambda t: w * dick * (1 - t) ** .8 + .0004, ring=ring, n=n, flat_up=up); set_region(o, regn); return o
def klumpen(p, d, L, w, regn, up=(0, 0, 1), bend=(0, 0, 0), spitzen=3, dick=.8):
    """Fell-Klumpen mit Volumen: runder Grundkörper (Querschnitt fast rund) + 2–3 auslaufende Strähnen an der Spitze"""
    d = Vector(d).normalized(); upv = Vector(up); side = d.cross(upv)
    side = side.normalized() if side.length > 1e-4 else Vector((1, 0, 0)); B = Vector(bend)
    P = [p - d * w * .3, p + d * L * .45 + B * .35, p + d * L * .8 + B * .8]
    out = [loft('Klumpen', P, lambda t: w * math.sin(math.pi * (.08 + .8 * t)) ** .6 + .0006, lambda t: w * dick * math.sin(math.pi * (.08 + .8 * t)) ** .6 + .0006, ring=8, n=7, flat_up=up, cap1=True)]
    for i in range(spitzen):
        o = (i - (spitzen - 1) / 2) / max(1, spitzen - 1); q = p + d * L * .55 + B * .5 + side * o * w * .9
        dd = (d + side * o * .5 + B.normalized() * .2 if B.length else d + side * o * .5).normalized()
        out.append(loft('Straehne', [q, q + dd * L * .3, q + dd * L * .5 + B * .3], lambda t: w * .42 * (1 - t) ** 1.2 + .0004, lambda t: w * .3 * (1 - t) + .0004, ring=5, n=5, flat_up=up))
    o = join(out, 'Klumpen'); set_region(o, regn); return o
def auf_kopf(pts, off):
    """Punkte auf die Kopfoberfläche legen (+ Abstand off)"""
    return [hsurf(Vector(p) - C.HC, off)[0] for p in pts]
def blatt(p, d, L, W, regn, up=(0, 0, 1), krumm=.15, dick=.12, n=7):
    """Blatt: flache, gewölbte Spindel mit Mittelrippe-Höhe (Normalkarte malt Adern)"""
    d = Vector(d).normalized(); upv = Vector(up); side = d.cross(upv).normalized(); nrm = side.cross(d).normalized()
    P = [p, p + d * L * .5 + nrm * L * krumm * .6, p + d * L + nrm * L * krumm * -.2]
    o = loft('Blatt', P, lambda t: W * math.sin(min(1, t * 1.05) * math.pi) ** .8 + .0004, lambda t: W * dick * math.sin(min(1, t * 1.05) * math.pi) + .0003,
             ring=6, n=n, flat_up=tuple(nrm)); set_region(o, regn); return o
def flamme(p, d, L, W, regn='flamme', up=(1, 0, 0), wellen=.25, n=8):
    d = Vector(d).normalized(); upv = Vector(up); side = d.cross(upv).normalized()
    P = [p, p + d * L * .35 + side * L * wellen * .3, p + d * L * .7 - side * L * wellen * .25, p + d * L + side * L * wellen * .15]
    o = loft('Flamme', P, lambda t: W * (1 - t) ** .9 * (.6 + .4 * math.sin(min(1, t * 2.5 + .2) * math.pi)) + .0004, lambda t: W * .6 * (1 - t) + .0004,
             ring=6, n=n, flat_up=up); set_region(o, regn); return o

# ---------------- Ohren (volumetrisch, Becherform) ----------------
def ohr(s, base, up_, fw, L, W, D, cup=1.5, regs=('fell_kopf', 'ohr_innen'), rund=0.0, NU=10, NA=14, bend=0.0, voll=.85):
    """Ohr als geschlossener Körper: Querschnitt Sichel (vorn hohl, Rand dick), Länge L, Breite W, Dicke D. rund>0 → runde Bärenohren."""
    up_ = Vector(up_).normalized(); fw = Vector(fw).normalized(); side = up_.cross(fw).normalized(); fw = side.cross(up_).normalized() * (1 if side.cross(up_).dot(fw) > 0 else -1)
    Vt = []; Fc = []; inner = []
    for i in range(NU + 1):
        u = i / NU
        if rund: w = W * (math.sin(min(1, .25 + u * .8) * math.pi) ** .6 * (1 - rund) + rund * math.sqrt(max(0, 1 - (2 * u - 1) ** 2 * .9))) + .001
        else: w = W * (1 - u) ** voll * (1 + .25 * math.sin(math.pi * u) * (.85 - voll) * 2) + .002
        d = D * (1 - .7 * u) + .001; c = d * cup * (1 - u) ** .5
        cen = base + up_ * (L * u) + fw * (bend * L * u * u)
        for j in range(NA):
            a = j / NA * 2 * math.pi; ca, sa = math.cos(a), math.sin(a)
            y = d * sa - (c * (1 - ca * ca) if sa > 0 else 0)
            Vt.append(cen + side * (w * ca) + fw * y)
    for i in range(NU):
        for j in range(NA):
            j1 = (j + 1) % NA; Fc.append((i * NA + j, i * NA + j1, (i + 1) * NA + j1, (i + 1) * NA + j))
    Vt.append(base + up_ * (L + .004)); ct = len(Vt) - 1; b = NU * NA; Fc += [(ct, b + j, b + (j + 1) % NA) for j in range(NA)]
    Vt.append(base - up_ * .004); c0 = len(Vt) - 1; Fc += [(c0, (j + 1) % NA, j) for j in range(NA)]
    o = obj_data('Ohr', Vt, Fc); orient_out(o, base + up_ * L * .4); smooth(o)
    o.data.materials.append(REG[regs[0]]['mat']); o.data.materials.append(REG[regs[1]]['mat'])
    for pg in o.data.polygons:
        q = pg.center - base; t = q.dot(up_) / L; a = math.atan2(q.dot(fw), q.dot(side) * 1.0)
        pg.material_index = 1 if (pg.normal.dot(fw) > .25 and t < .86 and abs(q.dot(side)) < W * .7 * max(.15, 1 - t)) else 0
    C.EARS[s] = (base, up_, L, fw, side); return o

# ---------------- Augen + Lider + Mund (Funktion; Pilot-System verallgemeinert) ----------------
def th_u(ph): k = ss(0, 1, abs(ph) / 62.0); return 58 * (1 - k ** 1.8) + (8 if ph > 0 else -2) * k
def th_l(ph): k = ss(0, 1, abs(ph) / 62.0); return -50 * (1 - k ** 1.6) + (4 if ph > 0 else -4) * k
def augen(RE, xn=.5, yn=-.86, zn=.1, spread=.42, lid_col=None):
    """Augäpfel (eigene Netze, Iris/Glanz in der Augen-Textur + Shader-Glanz), Ober-/Unterlid-Schalen mit Lidlinie. Liefert Shape-Key-fähige Lider."""
    C.RE = RE
    if lid_col: REG['lid']['col'] = lid_col; REG['lid']['mat'].node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*srgb(lid_col), 1)
    for s in (-1, 1):
        p, n = hsurf((s * xn, yn, zn)); fwd = Vector((s * spread, -1, .08)).normalized(); Cc = p - fwd * (RE - .1 * RE); C.EYES[s] = (Cc, fwd)
        r = Vector((0, 0, 1)).cross(fwd).normalized() * (-s); u = fwd.cross(r).normalized() * (-s)
        if u.z < 0: u = -u
        def sp_(ph, th, Rr, Cc=Cc, fwd=fwd, r=r, u=u): a, b = math.radians(ph), math.radians(th); return Cc + (fwd * (math.cos(b) * math.cos(a)) + r * (math.cos(b) * math.sin(a)) + u * math.sin(b)) * Rr
        bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=RE); eo = obj_bm('Auge', bm)
        M_ = Matrix((r, u, fwd)).transposed().to_4x4(); M_.translation = Cc; eo.data.transform(M_); orient_out(eo, Cc); smooth(eo); set_region(eo, 'auge')
        uvl = eo.data.uv_layers.new(name='UVMap')
        for l in eo.data.loops:
            q = eo.data.vertices[l.vertex_index].co - Cc; uvl.data[l.index].uv = (.25 + .25 * q.dot(r) / RE * s * .98, .5 + .5 * q.dot(u) / RE * .98)
        C.eye_parts.append(eo)
        for which in ('o', 'u'):
            Vt, F_, R_ = [], [], []; NPH, NT = 12, 4
            for i in range(NPH + 1):
                ph = -84 + 168 * i / NPH; e0 = th_u(ph) if which == 'o' else th_l(ph)
                for j in range(NT + 1):
                    t = j / NT; th = (e0 + (80 - e0) * t ** 1.3) if which == 'o' else (e0 + (-75 - e0) * t ** 1.3); Vt.append(sp_(ph, th, RE * (1.045 + .02 * t)))
            for i in range(NPH):
                for j in range(NT):
                    a = i * (NT + 1) + j; F_.append((a, a + NT + 1, a + NT + 2, a + 1) if which == 'o' else (a, a + 1, a + NT + 2, a + NT + 1)); R_.append('lid')
            base = len(Vt)
            for i in range(NPH + 1):
                ph = -84 + 168 * i / NPH; e0 = th_u(ph) if which == 'o' else th_l(ph); Vt.append(sp_(ph, e0 + (-1.6 if which == 'o' else 1.5), RE * .99))
            for i in range(NPH):
                a = i * (NT + 1); b = (i + 1) * (NT + 1); F_.append((base + i, base + i + 1, b, a) if which == 'o' else (a, b, base + i + 1, base + i)); R_.append('lidlinie' if which == 'o' and abs(-84 + 168 * (i + .5) / NPH) < 70 else 'lid')
            lo = obj_data('Lid', Vt, F_); lo.data.materials.append(REG['lid']['mat']); lo.data.materials.append(REG['lidlinie']['mat'])
            for pg, rn in zip(lo.data.polygons, R_): pg.material_index = 0 if rn == 'lid' else 1
            orient_out(lo, Cc); smooth(lo); vg = lo.vertex_groups.new(name='lid_%s_%s' % (which, 'L' if s > 0 else 'R')); vg.add(list(range(len(Vt))), 1, 'REPLACE'); C.lids.append(lo)
def maul(w=.3, z=-.5, smile=.1, mid=True, dicke=1.0, yn=-1):
    """Mund: Linie (+ Mittelstrich) und Maul-Aufkleber (Mundhöhle, öffnet per Shape Key). Parameter in Kopf-Einheitskoordinaten."""
    C.M_ = (w, z, smile, yn); s_ = max(C.HR) / .12 * dicke
    def mpt(xn, zn, off): p, n = hsurf((xn, yn, zn)); return p + n * off * s_
    C.mpt = mpt
    ml = loft('Mundlinie', [mpt((k / 8 * 2 - 1) * w, z + smile * (k / 8 * 2 - 1) ** 2 - .02, .0008) for k in range(9)], lambda t: .0013 * s_ * (1 - .4 * abs(2 * t - 1)), lambda t: .0005 * s_, ring=4, n=12, flat_up=(0, -1, 0)); set_region(ml, 'lidlinie'); C.mouth.append(ml)
    if mid:
        ml2 = loft('Mundlinie2', [mpt(0, z + .12 - k * .04, .0009) for k in range(4)], lambda t: .0011 * s_, lambda t: .0005 * s_, ring=4, n=6, flat_up=(0, -1, 0)); set_region(ml2, 'lidlinie'); C.mouth.append(ml2)
    MD = []; MF = []; MUV = []
    for j in range(5):
        for i in range(9):
            t = i / 8 * 2 - 1; MD.append(mpt(t * w, z + smile * t * t - .02, .001)); MUV.append((.5 + .5 * i / 8, .5 * j / 4))
    for j in range(4):
        for i in range(8): a = j * 9 + i; MF.append((a, a + 1, a + 10, a + 9))
    md = obj_data('Maul', MD, MF); set_region(md, 'mund_innen'); uvl = md.data.uv_layers.new(name='UVMap')
    for l in md.data.loops: uvl.data[l.index].uv = MUV[l.vertex_index]
    gr = md.vertex_groups.new(name='mund_reihe'); gc = md.vertex_groups.new(name='mund_spalte')
    for vi in range(len(MD)): gr.add([vi], (vi // 9 + 1) / 5, 'REPLACE'); gc.add([vi], (vi % 9 + 1) / 9, 'REPLACE')
    C.mouth.append(md)

# ---------------- Rumpf aus Knotengraph (Vierbeiner / Zweibeiner) ----------------
class Graph:
    def __init__(s): s.N = []; s.E = []; s.R = []
    def node(s, p, r): s.N.append(tuple(p)); s.R.append(r); return len(s.N) - 1
    def chain(s, ids):
        for a, b in zip(ids, ids[1:]): s.E.append((a, b))
        return ids
    def limb(s, attach, pts, radii, sub=1):
        """Glied aus Punktfolge; Zwischenknoten (sub) für runde Gelenke"""
        ids = []; prev = attach
        for i, p in enumerate(pts):
            if i and sub:
                for k in range(1, sub + 1):
                    t = k / (sub + 1); q = pts[i - 1].lerp(p, t); r0, r1 = radii[i - 1], radii[i]
                    if isinstance(r0, tuple) or isinstance(r1, tuple):
                        r0 = r0 if isinstance(r0, tuple) else (r0, r0); r1 = r1 if isinstance(r1, tuple) else (r1, r1); rr = tuple(lerp(a, b, t) for a, b in zip(r0, r1))
                    else: rr = lerp(r0, r1, t)
                    n_ = s.node(q, rr); s.E.append((prev, n_)); prev = n_
            n_ = s.node(p, radii[i]); s.E.append((prev, n_)); prev = n_; ids.append(n_)
        return ids
def rumpf_rund(o, y0, y1, zc_fn, rx_fn, rz_fn, xmax):
    """Skin-Rumpf (kantig) auf elliptische Querschnitte ziehen"""
    def f(p):
        p = p.copy(); zc = zc_fn(p.y); dz = p.z - zc; ang = math.atan2(dz, p.x)
        rx, rz = rx_fn(p.y), rz_fn(p.y)
        w = ss(y1 + .14 * C.H, y1 - .02 * C.H, p.y) * ss(y0 - .14 * C.H, y0 + .02 * C.H, p.y) * ss(xmax, xmax * .6, abs(p.x)) * ss(-1.3 * rz, -.55 * rz, dz)
        if w > 0:
            tx, tz = math.cos(ang) * rx, math.sin(ang) * rz; p.x = lerp(p.x, tx, w); p.z = zc + lerp(dz, tz, w * (1 if dz > -rz * .55 else .8))
        return p
    return deform(o, f)

def glaetten(o, wfn, it=8, k=.5):
    """Taubin-Glättung (ohne Schrumpfen) mit Gewicht je Ecke wfn(co)->0..1 – nimmt Skin-Kanten/Ringe aus dem Rumpf"""
    me = o.data; n = len(me.vertices); nb = [[] for _ in range(n)]
    for e in me.edges: a, b = e.vertices; nb[a].append(b); nb[b].append(a)
    co = np.array([tuple(v.co) for v in me.vertices], np.float64); w = np.array([wfn(v.co) for v in me.vertices], np.float64)[:, None]
    for i in range(it * 2):
        avg = np.array([co[l].mean(0) if l else co[j] for j, l in enumerate(nb)]); f = k if i % 2 == 0 else -k * 1.06
        co += (avg - co) * f * w
    for v, c in zip(me.vertices, co): v.co = Vector(c)
    me.update(); return o

def glied(name, pts, radii, ring=12, n=None, flat=(0, 0, 1), regn='fell', cap0=True, cap1=True, sq=None):
    """Glied/Rumpf als Loft durch Gelenkpunkte; radii je Punkt (Zahl oder (breit, hoch)); sq = Querschnitt-Abflachung"""
    segs = len(pts) - 1; n = n or max(8, segs * 6)
    R = [r if isinstance(r, tuple) else (r, r) for r in radii]
    def rf(t, k):
        x = t * segs; i = min(int(x), segs - 1); u = x - i; u = u * u * (3 - 2 * u); return lerp(R[i][k], R[i + 1][k], u)
    o = loft(name, [tuple(p) for p in pts], lambda t: rf(t, 0), lambda t: rf(t, 1), ring=ring, n=n, flat_up=flat, cap0=cap0, cap1=cap1)
    set_region(o, regn); return o

# ---------------- Rute / Schwanz ----------------
def rute(pts, rfn, regn, ring=16, spike=.16, twist=2.2, n=22, flat=(1, 0, 0), name='Rute'):
    P = bezier([tuple(p) for p in pts], n); Fr = frames_along(P, Vector(flat)); TV = []; TF = []
    for i, (p, (Tt, Nn, Bb)) in enumerate(zip(P, Fr)):
        t = i / (len(P) - 1); r0 = rfn(t)
        for j in range(ring):
            a = j / ring * 2 * math.pi + t * twist; sp = 1 + spike * math.sin(j * math.pi / 1.5 + i * .9) * ss(.1, .35, t)
            TV.append(p + (Bb * math.cos(a) + Nn * math.sin(a)) * r0 * sp)
    for i in range(len(P) - 1):
        for j in range(ring):
            j1 = (j + 1) % ring; TF.append((i * ring + j, i * ring + j1, (i + 1) * ring + j1, (i + 1) * ring + j))
    TV.append(P[-1] + (P[-1] - P[-2]).normalized() * rfn(1) * .8); c = len(TV) - 1; b = (len(P) - 1) * ring; TF += [(c, b + j, b + (j + 1) % ring) for j in range(ring)]
    TV.append(P[0] - (P[1] - P[0]).normalized() * rfn(0) * .3); c = len(TV) - 1; TF += [(c, (j + 1) % ring, j) for j in range(ring)]
    o = smooth(obj_data(name, TV, TF)); orient_out(o, sum(P, Vector()) / len(P)) if False else None
    k = 3; a_, b_, c_ = TV[ring * k], TV[ring * k + 1], TV[ring * (k + 1) + 1]
    if ((b_ - a_).cross(c_ - a_)).dot((a_ + b_) / 2 - P[k]) < 0: o.data.flip_normals()
    set_region(o, regn); return o, P

# ---------------- Gewichte-Helfer ----------------
def gw(o, name):
    gi = o.vertex_groups[name].index if name in o.vertex_groups else -1; out = {}
    for v in o.data.vertices:
        for g in v.groups:
            if g.group == gi: out[v.index] = g.weight
    return out
def ear_fixed(co, fallback):
    for s, (eb, eu, L, fw, side) in C.EARS.items():
        t = (co - eb).dot(eu); k = 'L' if s > 0 else 'R'
        if t > -.01 * C.H and (co - eb - eu * t).length < L * .55 and (co - C.HC).dot(eu) > -.02 * C.H:
            w2 = ss(L * .35, L * .75, t); w1 = ss(0, L * .3, t)
            return {'head': 1 - w1, 'ear1.' + k: w1 * (1 - w2), 'ear2.' + k: w2}
    return fallback(co)
def kopf_gewichte(HEAD, extra=None):
    def fx(co, r):
        if extra:
            e = extra(co, r)
            if e: return e
        def fb(co):
            d = co - C.HC; wn = ss(-.25 * C.HR[2], -.8 * C.HR[2], d.z) * ss(-.5 * C.HR[1], .2 * C.HR[1], d.y) * .55
            return {'head': 1 - wn, 'neck2': wn} if wn > .01 else {'head': 1}
        return ear_fixed(co, fb) if C.EARS else fb(co)
    weights_capsule(HEAD, C.ARMO, lambda co, r: ['head'], fixed=fx, smooth_it=1)
    if C.EYE_OBJ: weights_capsule(C.EYE_OBJ, C.ARMO, lambda co, r: ['head'], fixed=lambda co, r: {('eye.L' if co.x > 0 else 'eye.R'): 1} if r == 'auge' else {'head': 1}, smooth_it=0)

# ---------------- Shape Keys (Lider, Maul, Ohren) ----------------
def eye_frame(s):
    Cc, f = C.EYES[s]; r = Vector((0, 0, 1)).cross(f).normalized() * (-s); u = f.cross(r).normalized() * (-s)
    if u.z < 0: u = -u
    return Cc, f, r, u
def lid_move(co, s, which, ao=0, au=0, wide=0, tilt=0):
    Cc, f, r, u = eye_frame(s); q = co - Cc; R_ = q.length
    ph = math.degrees(math.atan2(q.dot(r), q.dot(f))); th = math.degrees(math.asin(max(-1, min(1, q.dot(u) / R_))))
    if which == 'o':
        e0, e1 = th_u(ph), th_l(ph) + .6; tgt = lerp(e0, e1, ao) + wide + tilt * ph / 84
        th2 = tgt + (th - e0) * (80 - tgt) / max(1e-3, 80 - e0) if th >= e0 - 3 else th + (tgt - e0)
    else:
        e0 = th_l(ph); tgt = e0 + au * (th_u(ph) - e0) * .45
        th2 = tgt + (th - e0) * (-75 - tgt) / min(-1e-3, -75 - e0) if th <= e0 + 3 else th + (tgt - e0)
    a, b = math.radians(ph), math.radians(th2); return Cc + (f * (math.cos(b) * math.cos(a)) + r * (math.cos(b) * math.sin(a)) + u * math.sin(b)) * R_
def sk_lids(ao=0, au=0, wide=0, tilt=0):
    def fn(i, co, reg):
        for (w, s), G_ in C.LIDS.items():
            if i in G_: return lid_move(co, s, w, ao, au, wide, tilt)
        return None
    return fn
def sk_maul(opn, smile=0):
    w, z, sm, yn = C.M_
    def fn(i, co, reg):
        if i in C.ROW:
            j = round(C.ROW[i] * 5) - 1; k = round(C.COL[i] * 9) - 1; t = k / 8 * 2 - 1; lens = (1 - t * t) ** .7
            zc = z + sm * t * t - .02 + smile * .06 * t * t; return C.mpt(t * w * (1 + .15 * opn), zc - (j / 4) * opn * lens * 2.2, .0012)
        return None
    return fn
def sk_combo(*fns):
    def fn(i, co, reg):
        for f in fns:
            r = f(i, co, reg)
            if r is not None: return r
        return None
    return fn
def ears_mv(ang):
    def fn(i, co, reg):
        for s, (eb, eu, L, fw, side) in C.EARS.items():
            t = (co - eb).dot(eu)
            if t > 0 and (co - eb - eu * t).length < L * .55 and (co - C.HC).dot(eu) > -.02 * C.H:
                return eb + Quaternion(side, -ang * ss(0, L * .7, t)) @ (co - eb)
        return None
    return fn
def gesicht_keys(HEAD, ohren=True):
    C.LIDS = {(w, s): gw(HEAD, 'lid_%s_%s' % (w, 'L' if s > 0 else 'R')) for w in 'ou' for s in (-1, 1)}
    C.ROW = gw(HEAD, 'mund_reihe'); C.COL = gw(HEAD, 'mund_spalte')
    shape_key(HEAD, 'Blinzeln', sk_lids(1, .3))
    shape_key(HEAD, 'Augen_froh', sk_lids(.32, .26))
    shape_key(HEAD, 'Augen_wach', sk_lids(.32, 0, 0, -9))           # entschlossen/wütend: Oberlid schräg
    shape_key(HEAD, 'Augen_muede', sk_lids(.5, .15))
    shape_key(HEAD, 'Maul_auf', sk_maul(.16, .3))
    shape_key(HEAD, 'Maul_weit', sk_maul(.3, .1))
    shape_key(HEAD, 'Staunen', sk_lids(0, 0, 7))
    if ohren and C.EARS: shape_key(HEAD, 'Ohren_an', ears_mv(.6))

# ---------------- Fell-Richtung + Muster (numpy) ----------------
def hash3(ix, iy, iz):
    h = (ix * 374761393 + iy * 668265263 + iz * 1274126177) & 0xffffffff; h = (h ^ (h >> 13)) * 1274126177 & 0xffffffff; return ((h ^ (h >> 16)) & 0xffff) / 65535.0
def vnoise(Q):
    I = np.floor(Q).astype(np.int64); Fr_ = Q - I; Fr_ = Fr_ * Fr_ * (3 - 2 * Fr_); out = 0
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                w = (Fr_[..., 0] if dx else 1 - Fr_[..., 0]) * (Fr_[..., 1] if dy else 1 - Fr_[..., 1]) * (Fr_[..., 2] if dz else 1 - Fr_[..., 2])
                out = out + w * hash3(I[..., 0] + dx, I[..., 1] + dy, I[..., 2] + dz)
    return out
def cells(Q):
    """Zellrauschen: (F1, F2-F1, Zell-Hash) – Schuppen/Federn"""
    I = np.floor(Q).astype(np.int64); F1 = np.full(Q.shape[:-1], 9.0, np.float32); F2 = np.full(Q.shape[:-1], 9.0, np.float32); H = np.zeros(Q.shape[:-1], np.float32)
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            for dz in (-1, 0, 1):
                cx, cy, cz = I[..., 0] + dx, I[..., 1] + dy, I[..., 2] + dz
                h1 = hash3(cx, cy, cz); h2 = hash3(cx + 17, cy - 9, cz + 5); h3 = hash3(cx - 31, cy + 7, cz - 13)
                px = cx + .15 + .7 * h1; py = cy + .15 + .7 * h2; pz = cz + .15 + .7 * h3
                d = np.sqrt((Q[..., 0] - px) ** 2 + (Q[..., 1] - py) ** 2 + (Q[..., 2] - pz) ** 2)
                nf = d < F1; F2 = np.where(nf, F1, np.minimum(F2, d)); H = np.where(nf, h1, H); F1 = np.where(nf, d, F1)
    return F1, F2 - F1, H
def flow_dirs(Pm, mask, override=None):
    """Fellrichtung je Texel = Richtung des nächsten Knochens (Kopf: vom Nasenpunkt weg). override(P,dir)->dir"""
    segs = [(b.head_local.copy(), b.tail_local.copy(), b.name) for b in C.ARMO.data.bones if not b.name.startswith(('eye', 'root', 'fx'))]
    idx = np.nonzero(mask.ravel())[0]; P = Pm.reshape(-1, 3)[idx]; best = np.full(len(P), 1e9, np.float32); D = np.zeros((len(P), 3), np.float32); BN = np.zeros(len(P), np.int32)
    for bi, (a, b, nm) in enumerate(segs):
        a = np.array(a, np.float32); b = np.array(b, np.float32); ab = b - a; L2 = max(float(ab @ ab), 1e-9)
        t = np.clip(((P - a) @ ab) / L2, 0, 1); q = a + t[:, None] * ab; d = np.linalg.norm(P - q, axis=1)
        nb = d < best; best[nb] = d[nb]; D[nb] = ab / math.sqrt(L2); BN[nb] = bi
    names = [s[2] for s in segs]
    hb = names.index('head') if 'head' in names else -1
    if hb >= 0 and C.__dict__.get('NOSE') is not None:
        hm = BN == hb; v = P[hm] - np.array(C.NOSE, np.float32); D[hm] = v / np.maximum(np.linalg.norm(v, axis=1, keepdims=True), 1e-6)
    if override: D = override(P, D, BN, names)
    out = np.zeros((Pm.shape[0] * Pm.shape[1], 3), np.float32); out[idx] = D; return out.reshape(Pm.shape)
def aniso(Pm, Dm, hi, lo):
    """Gestrecktes Rauschen entlang Dm (Fellstriche)"""
    along = np.sum(Pm * Dm, -1, keepdims=True); perp = Pm - Dm * along; return vnoise(perp * hi + Dm * along * lo)

# ---------------- Malen (gemeinsam) + Augen-Textur ----------------
def augen_textur(iris=('#d87a1e', '#8a3a10', '#ffc24a'), pupille='rund', sclera=None, IR=.62, ring='#3a1608'):
    TW, TH = 512, 256; tex = np.zeros((TH, TW, 4), np.float32); tex[..., 3] = 1
    vv, uu = np.mgrid[0:TH, 0:TW].astype(np.float32); u = (uu + .5) / TW; v = (vv + .5) / TH; ex = (u - .25) / .25; ey = (v - .5) / .5; rr = np.sqrt(ex ** 2 + ey ** 2)
    def put(mask, c, a=1.0):
        a = np.clip(a, 0, 1) * mask; tex[..., :3] = tex[..., :3] * (1 - a[..., None]) + hexrgb(c) * a[..., None]
    L_ = u < .5; put(L_, sclera or '#fbf7f2'); put(L_, '#c8c0d0', .5 * ss(.6, 1.0, rr))   # helle Lederhaut mit weichem Randschatten
    iris_m = L_ & (rr < IR); ang = np.arctan2(ey, ex)
    put(iris_m, iris[0]); put(iris_m, iris[1], ss(-.1, .55, ey)); put(iris_m, iris[2], .75 * ss(0, -.55, ey) * ss(.18, .5, rr))
    put(iris_m, iris[1], .3 * (.5 + .5 * np.sin(ang * 23)) * ss(.25, .55, rr)); put(iris_m, ring, ss(IR * .84, IR * .98, rr)); put(L_ & (rr >= IR), '#2a1a14', ss(IR + .03, IR, rr))
    if pupille == 'schlitz': put(L_, '#100604', ((np.abs(ex) < .085 * np.sqrt(np.clip(1 - (ey / .5) ** 2, 0, 1)) + .01) & (np.abs(ey) < .5)).astype(np.float32))
    else: put(L_ & (rr < IR * .5), '#120705'); put(L_ & (rr < IR * .58), '#3a1608', .5 * ss(IR * .5, IR * .58, rr))
    put(L_, '#ffffff', ss(.19, .16, np.sqrt((ex - .2) ** 2 + (ey - .24) ** 2))); put(L_, '#ffffff', .95 * ss(.09, .07, np.sqrt((ex + .22) ** 2 + (ey + .24) ** 2)))
    Rm = (u >= .5) & (v < .5); mxn = (u - .5) / .5; myn = v / .5; inside = (np.abs(2 * mxn - 1) ** 2.2 + np.abs(2 * myn - 1) ** 2) < 1
    put(Rm, '#6a2028'); put(Rm, '#e07a80', (((2 * mxn - 1) / .5) ** 2 + ((myn - .15) / .3) ** 2 < 1).astype(np.float32))
    for cx in (.25, .75): put(Rm, '#fbf6ee', ((np.abs(mxn - cx) < .05 * (myn - .62) / .38) & (myn > .62)).astype(np.float32))
    put(Rm, '#3a1a10', ss(.8, .98, np.abs(2 * mxn - 1) ** 2.2 + np.abs(2 * myn - 1) ** 2))
    tex[..., 3] = np.where(Rm, inside.astype(np.float32), 1.0); return tex

def male(objs, paint, fur_scale=1.0, nstr=.4, ao_k=.34):
    """UV-Atlas → Backen (Region, Position, AO) → Grundfarben + Materialmuster → paint(P) (Artzeichnung) → AO → Normal aus Höhe.
    paint bekommt ein Objekt P mit X,Y,Z,Pm,RID,M(),mix(),col,hgt,dh (Kopf-relativ),hx,hy,hz"""
    HEAD = objs[0]; S = C.tex; FACE = C.EYE_OBJ
    if not FACE.data.uv_layers: FACE.data.uv_layers.new(name='UVMap')
    dec_uv = {li: tuple(FACE.data.uv_layers[0].data[li].uv) for p in FACE.data.polygons if FACE.data.materials[p.material_index].name in ('mund_innen', 'auge') for li in p.loop_indices}
    objs = list(objs) + [FACE]
    uv_atlas(objs, lambda o, c: 1.7 if (o is HEAD and (c - C.HC).y < .02 * C.H) or o is FACE else 1.15 if o is HEAD else 1.0, margin=.006)
    for li in dec_uv: FACE.data.uv_layers[0].data[li].uv = (.9995, .9995)
    W_ = bpy.data.worlds.new('W'); bpy.context.scene.world = W_; W_.light_settings.distance = .08 * C.H
    rid = bake_emit(objs, 'id', S); RID = np.floor(rid[..., 0] * 256).astype(int) - 1; COV = RID >= 0
    Pm = bake_emit(objs, 'pos', S)[..., :3]; ao = bake(objs, 'AO', S, samples=32)[..., 0]
    NAMES = {v['id']: k for k, v in REG.items()}
    P = types.SimpleNamespace(); P.Pm = Pm; P.X, P.Y, P.Z = Pm[..., 0], Pm[..., 1], Pm[..., 2]; P.RID = RID; P.COV = COV
    col = np.zeros((S, S, 3), np.float32); hgt = np.zeros((S, S), np.float32); P.col = col; P.hgt = hgt
    for i, nm in NAMES.items():
        m = RID == i
        if m.any(): col[m] = hexrgb(REG[nm]['col'])
    def M(*names): return np.isin(RID, [REG[n]['id'] for n in names if n in REG])
    def mix(mask, c, a=1.0):
        a = np.clip(a, 0, 1) * mask; col[:] = col * (1 - a[..., None]) + hexrgb(c) * a[..., None]
    P.M = M; P.mix = mix
    dh = Pm - np.array(C.HC); P.dh = dh; P.hx, P.hy, P.hz = dh[..., 0] / C.HR[0], dh[..., 1] / C.HR[1], dh[..., 2] / C.HR[2]
    kinds = {}
    for nm, k in KIND.items(): kinds.setdefault(k, []).append(nm)
    furm = M(*kinds.get('fell', [])); f = fur_scale / C.H
    if furm.any():
        Dm = flow_dirs(Pm, furm); P.Dm = Dm
        st = aniso(Pm, Dm, 260 * f, 26 * f); cl = aniso(Pm, Dm, 55 * f, 9 * f); fine = aniso(Pm, Dm, 600 * f, 60 * f)
        fur = st * .55 + fine * .2 + cl * .5
        col *= (1 + (fur[..., None] - .62) * .2 * furm[..., None]); hgt += furm * ((st - .5) * .9 + (cl - .5) * 1.3 + (fine - .5) * .4)
        P.fur = fur
    for kname, freq, amp, elong in (('schuppe', 70, 1.0, 1.0), ('feder', 14, .3, 2.4), ('horn', 30, .4, 1.0), ('kristall', 18, .5, 1.0)):
        m = M(*kinds.get(kname, []))
        if not m.any(): continue
        Q = Pm * (freq * f)
        if elong != 1.0 and 'Dm' in P.__dict__: along = np.sum(Pm * P.Dm, -1, keepdims=True); Q = (Pm - P.Dm * along) * (freq * f) + P.Dm * along * (freq * f / elong)
        F1, E, Hh = cells(Q)
        if kname == 'feder':
            sc = ss(.0, .35, E); col *= (1 - .05 * m * (1 - sc))[..., None]; hgt += m * (sc - .5) * amp
        elif kname == 'kristall':
            fac = (Hh - .5); col *= (1 + .25 * m * fac)[..., None]; hgt += m * (ss(0, .12, E) - .5) * amp
        else:
            edge = ss(0, .18, E); col *= (1 - .18 * m * (1 - edge) + .06 * m * (Hh - .5))[..., None]; hgt += m * (edge * (1 - F1 * .6) - .4) * amp
    hm = M(*kinds.get('haut', []))
    if hm.any(): n_ = vnoise(Pm * (90 * f)); hgt += hm * (n_ - .5) * .25; col *= (1 + .04 * hm * (n_ - .5))[..., None]
    bm = M(*kinds.get('blatt', []))
    if bm.any():
        n_ = vnoise(Pm * (40 * f)); col *= (1 + .12 * bm * (n_ - .5))[..., None]
    paint(P)
    aoN = np.clip(ao, 0, 1); akk = np.where(np.sqrt((P.dh ** 2).sum(-1)) < max(C.HR) * 1.35, ao_k * .45, ao_k); akk = np.where(M('lid', 'lidlinie', 'auge', 'mund_innen'), 0, akk); col *= (1 - akk + akk * aoN)[..., None]; np.clip(col, 0, 1, out=col)
    alb = dilate(col, COV, 6); alb = np.where(COV[..., None], col, alb); C.IMG_ALB = to_image(alb, C.name + '_Farbe')
    hg = dilate(np.repeat(hgt[..., None], 3, 2), COV, 4)[..., 0]
    nrm = height_to_normal_bake(objs, hg * .5 + .5, S, strength=nstr); C.IMG_NRM = to_image(nrm[..., :3], C.name + '_Normal', 'Non-Color')
    save_png(alb, os.path.join(C.DIR, C.name + '_farbe.png'))
    for li, uvv in dec_uv.items(): FACE.data.uv_layers[0].data[li].uv = uvv
    return P

def materialien(HEAD, others, eye_tex):
    IMG_EYE = to_image(eye_tex, C.name + '_Augen'); save_png(eye_tex, os.path.join(C.DIR, C.name + '_augen.png'))
    MAT_MAIN = final_material(C.name + '_Haupt', C.IMG_ALB, C.IMG_NRM); MAT_EYE = final_material(C.name + '_Augen', IMG_EYE)
    nt = MAT_EYE.node_tree; tn = [n for n in nt.nodes if n.type == 'TEX_IMAGE'][0]; nt.links.new(tn.outputs['Alpha'], nt.nodes['Principled BSDF'].inputs['Alpha'])
    for o in others + [HEAD]: swap_materials(o, MAT_MAIN)
    me = C.EYE_OBJ.data; mats = list(me.materials); pidx = [1 if mats[p.material_index] and mats[p.material_index].name in ('mund_innen', 'auge') else 0 for p in me.polygons]
    me.materials.clear(); me.materials.append(MAT_MAIN); me.materials.append(MAT_EYE)
    for p, i in zip(me.polygons, pidx): p.material_index = i
    C.MAT_MAIN = MAT_MAIN

# ---------------- LOD 50 % ----------------
def lod_kopie(o, ratio=.5, name=None):
    me = o.data.copy(); lo = link(bpy.data.objects.new(name or (o.name + '_LOD1'), me)); lo.parent = o.parent
    for vg in o.vertex_groups:
        if vg.name not in lo.vertex_groups: lo.vertex_groups.new(name=vg.name)
    activate(lo); m = lo.modifiers.new('Dec', 'DECIMATE'); m.ratio = ratio; m.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=m.name)
    am = lo.modifiers.new('Armature', 'ARMATURE'); am.object = C.ARMO; return lo

# ---------------- Rig + Clips: gemeinsame Helfer ----------------
def ang(v): return math.atan2(v.z, v.y)
def ik2(A, Bk, Cc, T, sign):
    """2-Glieder-IK in der (y,z)-Ebene → (θ oben, θ unten relativ)"""
    a = (Bk - A).length; b = (Cc - Bk).length; d = T - A; d2 = Vector((0, d.y, d.z)); L = max(.01 * C.H, min(a + b - 1e-4, d2.length))
    al = math.acos(max(-1, min(1, (a * a + L * L - b * b) / (2 * a * L)))); base = math.atan2(d2.z, d2.y); u_ang = base + sign * al
    kn = Vector((0, math.cos(u_ang), math.sin(u_ang))) * a; lo = Vector((0, d2.y, d2.z)) * (L / max(d2.length, 1e-6)) - kn
    t1 = u_ang - ang(Bk - A); t2 = ang(lo) - ang(Cc - Bk) - t1; return t1, t2
def foot_path(u, stance, Lstep, lift):
    if u < stance: w = u / stance; return Lstep * (.5 - w), 0.0
    w = (u - stance) / (1 - stance); e = .5 - .5 * math.cos(math.pi * w); return Lstep * (-.5 + e), lift * math.sin(math.pi * w) ** .8
def chain_sway(names, t, amp, phase=.7, up=0.0, axis='z', grow=.15, base=.5):
    out = {}
    for i, n in enumerate(names):
        a = amp * math.sin(2 * math.pi * t - i * phase) * (base + grow * i)
        out[n] = qmul(rz(a) if axis == 'z' else rx(a), rx(up * (1 if i < 2 else .3)))
    return out
def ears_pose(P, a1, a2=None, twitch_s=0):
    for s in (-1, 1):
        k = 'L' if s > 0 else 'R'
        if 'ear1.' + k in C.BN: P['ear1.' + k] = rx(a1 * (1 if s != twitch_s else 1.8)); P['ear2.' + k] = rx((a2 if a2 is not None else a1 * .6))
    return P
def env01(t, a, b, c, d):
    """Hüllkurve: steigt a→b, hält, fällt c→d"""
    return ss(a, b, t) * (1 - ss(c, d, t))

def armature_from(B):
    B = list(B) + list(C.__dict__.get('FX', []))   # Effekt-Punkte (ohne Gewichte), z. B. Flammen-Leuchten
    C.ARMO = armature(C.name + '_Rig', B); C.BN = set(b[0] for b in B); C.B = B; log('Knochen', len(B)); return C.ARMO

# ======================= Vorlage 1: VIERBEINER =======================
# Landmarken: C.SPINE[4] (Becken→Brust), C.NECK[2], C.FL[4] (Schulter, Ellbogen, Handgelenk, Pfote), C.HL[4] (Hüfte, Knie, Sprunggelenk, Pfote), C.TAIL (≥ 3 Pkt)
def rig_vierbeiner(ntail=5, ohren=True):
    TP = bezier([tuple(p) for p in C.TAIL], ntail + 1) if ntail else []
    SP, NK, HC = C.SPINE, C.NECK, C.HC
    hd0 = HC + Vector((0, .15 * C.HR[1], -.35 * C.HR[2])); hd1 = HC + Vector((0, -.15 * C.HR[1], .9 * C.HR[2]))
    B = [('root', (0, 0, 0), (0, 0, .15 * C.H), None), ('hips', tuple(SP[0]), tuple(SP[1]), 'root'), ('spine1', tuple(SP[1]), tuple(SP[2]), 'hips'),
         ('spine2', tuple(SP[2]), tuple(SP[3]), 'spine1'), ('chest', tuple(SP[3]), tuple(NK[0]), 'spine2'), ('neck1', tuple(NK[0]), tuple(NK[1]), 'chest'),
         ('neck2', tuple(NK[1]), tuple(hd0), 'neck1'), ('head', tuple(hd0), tuple(hd1), 'neck2')]
    for i in range(ntail): B.append(('tail%d' % (i + 1), tuple(TP[i]), tuple(TP[i + 1]), 'hips' if i == 0 else 'tail%d' % i))
    for s in (-1, 1):
        k = 'L' if s > 0 else 'R'; F = [S_(p, s) for p in C.FL]; Hh = [S_(p, s) for p in C.HL]; Cc, f = C.EYES[s]
        B += [('eye.' + k, tuple(Cc), tuple(Cc + f * C.RE * .7), 'head')]
        if ohren and s in C.EARS:
            eb, eu, L, fw, side = C.EARS[s]; B += [('ear1.' + k, tuple(eb), tuple(eb + eu * L * .45), 'head'), ('ear2.' + k, tuple(eb + eu * L * .45), tuple(eb + eu * L * .95), 'ear1.' + k)]
        B += [('scapula.' + k, tuple(F[0] + Vector((-.4 * F[0].x, .045 * C.H, .07 * C.H))), tuple(F[0]), 'chest'), ('upper_f.' + k, tuple(F[0]), tuple(F[1]), 'scapula.' + k),
              ('lower_f.' + k, tuple(F[1]), tuple(F[2]), 'upper_f.' + k), ('paw_f.' + k, tuple(F[2]), tuple(F[3] + Vector((0, -.05 * C.H, 0))), 'lower_f.' + k),
              ('thigh.' + k, tuple(Hh[0]), tuple(Hh[1]), 'hips'), ('shin.' + k, tuple(Hh[1]), tuple(Hh[2]), 'thigh.' + k), ('meta.' + k, tuple(Hh[2]), tuple(Hh[3]), 'shin.' + k),
              ('paw_h.' + k, tuple(Hh[3]), tuple(Hh[3] + Vector((0, -.06 * C.H, 0))), 'meta.' + k)]
    C.TAILB = ['tail%d' % (i + 1) for i in range(ntail)]
    return armature_from(B)
def body_allowed_vb(co, r):
    k = 'L' if co.x > 0 else 'R'; tb = C.TAILB
    if r in C.TAILREG: return ['hips'] + tb[-3:] if tb else ['hips']
    if tb and (co - C.TAIL[0]).dot(C.TAIL[1] - C.TAIL[0]) > 0 and co.z > C.SPINE[0].z - .2 * C.H * .5 and abs(co.x) < .5 * C.H * .3: return ['hips'] + tb
    if co.z > C.NECK[0].z and co.y < C.NECK[0].y: return ['chest', 'neck1', 'neck2', 'head']
    base = ['hips', 'spine1', 'spine2', 'chest', 'neck1', 'neck2', 'scapula.' + k, 'upper_f.' + k, 'lower_f.' + k, 'paw_f.' + k, 'thigh.' + k, 'shin.' + k, 'meta.' + k, 'paw_h.' + k]
    return base + (tb[:1] if tb else [])
def leg_f(s, T, root_off, paw_pitch=0):
    F = [S_(p, s) for p in C.FL]; k = 'L' if s > 0 else 'R'; t1, t2 = ik2(F[0] + root_off, F[1] + root_off, F[2] + root_off, T, -1)
    return {'upper_f.' + k: rx(t1), 'lower_f.' + k: rx(t2), 'paw_f.' + k: rx(-(t1 + t2) + paw_pitch)}
def leg_h(s, T, root_off, paw_pitch=0):
    Hh = [S_(p, s) for p in C.HL]; k = 'L' if s > 0 else 'R'; mv = Hh[3] - Hh[2]
    t1, t2 = ik2(Hh[0] + root_off, Hh[1] + root_off, Hh[2] + root_off, T - mv, 1)
    return {'thigh.' + k: rx(t1), 'shin.' + k: rx(t2), 'meta.' + k: rx(-(t1 + t2) + paw_pitch * .5), 'paw_h.' + k: rx(paw_pitch * .5)}
def stand(P, root, fl=V(0, 0, 0), hl=V(0, 0, 0), spread=0.0):
    for s in (-1, 1):
        P.update(leg_f(s, S_(C.FL[2], s) + fl + V(s * spread, 0, 0), root)); P.update(leg_h(s, S_(C.HL[3], s) + hl + V(s * spread, 0, 0), root))
    return P
def clips_vierbeiner(gang=None):
    """Gemeinsamer Clip-Satz für Vierbeiner. gang: walk/run-Parameter je Art"""
    H = C.H; g = dict(wL=.45 * H, wSt=.62, wLift=.07 * H, rL=.75 * H, rSt=.38, rLift=.12 * H, bob=.012 * H, tail=.18, plant=False); g.update(gang or {})
    tb = C.TAILB
    def tails(t, amp, up=0.0): return chain_sway(tb, t, amp, up=up) if tb else {}
    def gait(t, Lw, stance, lift, offs, bob, run=False):
        P = {}; ph = 2 * math.pi * t; root = V(0, 0, -.004 * H - bob * (.5 + .5 * math.cos(2 * ph))); P['hips:loc'] = root
        P['hips'] = rx(.04 * math.sin(ph * 2 + 1) * (2 if run else 1)); P['spine1'] = rx(.03 * math.sin(ph * 2) * (2.2 if run else 1)); P['chest'] = qmul(rz(.05 * math.sin(ph)), rx(-.03 * math.sin(2 * ph) * (1.5 if run else .5)))
        P['neck1'] = rx(-.04 * math.sin(2 * ph + .4)); P['head'] = rx(.05 * math.sin(2 * ph + 1.2))   # Kopf stabilisiert (gegenläufig)
        for s in (-1, 1):
            k = 'L' if s > 0 else 'R'
            u = (t + offs['f' + k]) % 1; dy, dz = foot_path(u, stance, Lw, lift); P.update(leg_f(s, S_(C.FL[2], s) + V(0, -dy, dz), root, (.9 if not g['plant'] else .3) * dz / max(lift, 1e-6)))
            u = (t + offs['h' + k]) % 1; dy, dz = foot_path(u, stance, Lw, lift); P.update(leg_h(s, S_(C.HL[3], s) + V(0, -dy, dz), root, (.9 if not g['plant'] else .3) * dz / max(lift, 1e-6)))
        ears_pose(P, -.08 * math.sin(2 * ph) if not run else .35)
        P.update(tails(t * (2 if run else 1), g['tail'] * (.6 if run else 1), up=-.15 if run else .05)); return P
    def idle(t):
        ph = 2 * math.pi * t; br = math.sin(ph * 3); look = ss(.3, .45, t) * (1 - ss(.62, .78, t)) - .7 * ss(.75, .82, t) * (1 - ss(.9, 1, t))
        P = {'hips:loc': V(0, 0, -.003 * H + .002 * H * br), 'spine2': rx(.015 * br), 'chest': rx(.025 * br), 'neck1': rx(.04 * math.sin(ph) - .03),
             'head': qmul(rz(.32 * look), ry(.14 * look), rx(-.05 * math.sin(ph * 2)))}
        tw = env01(t, .12, .14, .17, .2)
        for s in (-1, 1):
            k = 'L' if s > 0 else 'R'
            if 'ear1.' + k in C.BN: P['ear1.' + k] = rx(-.32 * tw * (s > 0) + .05 * math.sin(ph * 2 + s)); P['ear2.' + k] = rx(-.2 * tw * (s > 0))
        stand(P, P['hips:loc']); P.update(tails(t * 2, g['tail'] * 1.2, up=.05)); return P
    def attack(t):
        c = env01(t, 0, .3, .32, .42); j = env01(t, .32, .48, .62, 1); bite = env01(t, .44, .5, .58, .66); P = {}
        root = V(0, -.22 * H * j, -.08 * H * c + .07 * H * math.sin(math.pi * min(1, max(0, (t - .32) / .32)))); P['hips:loc'] = root
        P['spine1'] = rx(.12 * c - .08 * j); P['chest'] = rx(.14 * c + .05 * j); P['neck1'] = rx(.22 * c + .15 * j); P['head'] = rx(.1 * c + .22 * bite)
        ears_pose(P, .6 * c + .3 * j)
        stand(P, root, fl=V(0, -.22 * H * j, .1 * H * j * (1 - ss(.5, .62, t))), hl=V(0, .04 * H * c, 0))
        P.update(tails(t, .1, up=.35 * c - .3 * j)); return P
    def hit(t):
        k_ = math.sin(math.pi * min(1, t * 2.5)) * (1 - t) ** 1.2; root = V(0, .12 * H * k_, -.03 * H * k_)
        P = {'hips:loc': root, 'chest': rx(.2 * k_), 'neck1': rx(-.25 * k_), 'head': qmul(rx(.35 * k_), ry(.3 * k_))}
        ears_pose(P, .9 * k_); stand(P, root); P.update(tails(t, .05, up=.4 * k_)); return P
    def faint(t):
        e = ss(0, .55, t); fall = ss(.25, .7, t); root = V(0, 0, -(C.HL[0].z * .55) * fall); P = {'hips:loc': root}
        P['root'] = ry(.0); P['spine1'] = rz(.12 * fall); P['chest'] = rz(.15 * fall); P['neck1'] = qmul(rx(.35 * fall), rz(.3 * fall)); P['head'] = qmul(rx(.25 * fall), rz(.35 * fall))
        ears_pose(P, .7 * e)
        for s in (-1, 1):
            k = 'L' if s > 0 else 'R'; F = S_(C.FL[2], s); Hh = S_(C.HL[3], s)
            P.update(leg_f(s, F + V(s * .05 * H * fall, -.12 * H * fall, root.z * .2), root)); P.update(leg_h(s, Hh + V(s * .05 * H * fall, .08 * H * fall, root.z * .15), root))
        P.update(tails(0, 0, up=-.3 * fall)); return P
    def joy(t):
        h = math.sin(math.pi * ss(.08, .5, t)) * (1 - ss(.5, .62, t)); h2 = math.sin(math.pi * ss(.55, .85, t)) * .45; hh = h + h2
        crouch = env01(t, 0, .08, .08, .14) + env01(t, .5, .55, .55, .6) * .6
        root = V(0, 0, .2 * H * hh - .05 * H * crouch); P = {'hips:loc': root}
        P['chest'] = rx(-.2 * hh); P['neck1'] = rx(-.12 * hh); P['head'] = qmul(rx(-.2 * hh), rz(.22 * math.sin(t * 4 * math.pi)))
        ears_pose(P, -.25 * hh)
        stand(P, root, fl=V(0, -.03 * H * hh, .1 * H * hh), hl=V(0, .02 * H * hh, .04 * H * hh)); P.update(tails(t * 4, .5, up=.25)); return P
    def catch(t):
        """Fang-Reaktion: Zusammenzucken, Ducken, Zappeln (Kapsel wackelt)"""
        fl = env01(t, 0, .1, .2, .35); cr = env01(t, .15, .35, .8, 1); wig = math.sin(t * 6 * 2 * math.pi) * env01(t, .35, .45, .8, .95)
        root = V(0, .06 * H * fl, -.07 * H * cr); P = {'hips:loc': root, 'spine1': rz(.1 * wig), 'chest': qmul(rz(-.12 * wig), rx(.12 * cr)), 'neck1': rx(-.2 * fl + .1 * cr), 'head': qmul(rx(.2 * cr), rz(.2 * wig))}
        ears_pose(P, .8 * max(fl, cr)); stand(P, root, fl=V(0, .02 * H * cr, 0)); P.update(tails(t * 3, .4 * abs(wig), up=-.25 * cr)); return P
    fps = 30
    make_action(C.ARMO, 'idle', 120, idle)
    make_action(C.ARMO, 'walk', g.get('wF', 26), lambda t: gait(t, g['wL'], g['wSt'], g['wLift'], {'hL': 0, 'fL': .25, 'hR': .5, 'fR': .75}, g['bob']))
    make_action(C.ARMO, 'run', g.get('rF', 15), lambda t: gait(t, g['rL'], g['rSt'], g['rLift'], {'hL': 0, 'hR': .1, 'fL': .5, 'fR': .6}, g['bob'] * 2.4, run=True))
    make_action(C.ARMO, 'attack', 27, attack, loop=False); make_action(C.ARMO, 'hit', 15, hit, loop=False); make_action(C.ARMO, 'faint', 36, faint, loop=False)
    make_action(C.ARMO, 'joy', 36, joy, loop=False); make_action(C.ARMO, 'catch', 45, catch, loop=False)
    C.gang = {'walk': [g['wL'], g.get('wF', 26) / fps], 'run': [g['rL'], g.get('rF', 15) / fps]}
    rest_pose(C.ARMO); return ['idle', 'walk', 'run', 'attack', 'hit', 'faint', 'joy', 'catch']

# ======================= Ablauf: Gesicht + Rig + Malen + Export =======================
def zusammen(head_extra=(), body_parts=(), body_max=None, head_max=4200):
    C.HEAD = join([C.head] + C.parts_head + list(head_extra), C.name + '_Kopf')
    if head_max and tris(C.HEAD) > head_max:
        n0 = tris(C.HEAD); decimate(C.HEAD, head_max / n0); smooth(C.HEAD); log('Kopf reduziert', n0, '→', tris(C.HEAD))
    C.BODY = join(list(body_parts), C.name + '_Koerper')
    bm_ = bmesh.new(); bm_.from_mesh(C.BODY.data); bmesh.ops.recalc_face_normals(bm_, faces=bm_.faces[:]); bm_.to_mesh(C.BODY.data); bm_.free()
    if body_max and tris(C.BODY) > body_max:
        n0 = tris(C.BODY); decimate(C.BODY, body_max / n0); smooth(C.BODY); log('Körper reduziert', n0, '→', tris(C.BODY))
        bm_ = bmesh.new(); bm_.from_mesh(C.BODY.data); bmesh.ops.recalc_face_normals(bm_, faces=bm_.faces[:]); bm_.to_mesh(C.BODY.data); bm_.free()
    C.EYE_OBJ = join(C.eye_parts + C.lids + C.mouth, C.name + '_Augen')   # Gesicht: Augen + Lider + Mund (nur dieses kleine Netz trägt Shape Keys)
    log('Dreiecke Kopf', tris(C.HEAD), 'Körper', tris(C.BODY), 'Augen', tris(C.EYE_OBJ))
def gesichts_normalen(k=.6):
    HC, HR = C.HC, C.HR
    def face_w(p):
        d = p - HC; return k * ss(.0, .5, -d.y / HR[1]) * (1 - ss(.75, 1.05, -d.y / HR[1])) * ss(-.9, -.5, d.z / HR[2])
    ellipsoid_normals(C.HEAD, HC + Vector((0, .1 * HR[1], 0)), (HR[0] * 1.05, HR[1] * 1.1, HR[2] * 1.05), face_w)
def form_bild(objs, H, extra_cams=()):
    D = C.DIR; cams = [((1.7 * H * 1.5, -1.7 * H * 1.5, .9 * H), (0, 0, .5 * H), 60), ((0, -2.4 * H, .7 * H), (0, 0, .5 * H), 60), ((2.4 * H, 0, .6 * H), (0, 0, .5 * H), 60),
                       ((.55 * H, -1.0 * H, C.HC.z + .1 * H), tuple(C.HC), 60)] + list(extra_cams)
    return workbench(os.path.join(D, C.name + '_form.png'), objs, cams, (700, 700))
def fertig(out, clips, lods, meta_extra=None):
    allobjs = [C.HEAD, C.BODY, C.EYE_OBJ] + lods
    export_glb(out, allobjs, C.ARMO)
    meta = {'modell': C.name, 'dreiecke': {'kopf': tris(C.HEAD), 'koerper': tris(C.BODY), 'augen': tris(C.EYE_OBJ)}, 'lod1': sum(tris(o) for o in lods),
            'knochen': len(C.B), 'shapeKeys': [k.name for k in C.EYE_OBJ.data.shape_keys.key_blocks][1:], 'clips': clips, 'gang': C.gang, 'textur': C.tex,
            'hoehe': C.H, 'bauzeit_s': round(time.time() - C.t0, 1)}
    meta['dreiecke']['gesamt'] = sum(meta['dreiecke'].values())
    if meta_extra: meta.update(meta_extra)
    json.dump(meta, open(out.replace('.glb', '.json'), 'w'), indent=1); log('META', json.dumps(meta))

def lod_red(o, ratio):
    """Auf ratio der Dreiecke reduzieren (mehrere Durchgänge, Collapse stößt an Nähten an)"""
    n0 = tris(o); target = n0 * ratio; activate(o)
    for _ in range(4):
        n = tris(o)
        if n <= target * 1.05: break
        mm = o.modifiers.new('Dec', 'DECIMATE'); mm.ratio = max(.1, target / n); mm.use_symmetry = False
        bpy.ops.object.modifier_apply(modifier=mm.name)
    return o
def standard_ablauf(out, body_allowed, clipfn, paint, iris, pupille='rund', head_w_extra=None, fur_scale=1.0, nstr=.4, ohren=True, lod=.5, meta_extra=None, sclera=None, IR=.72):
    """Nach dem Formenbau: Normalen, Gewichte, LOD, Shape Keys, Masken, Malen, Materialien, Clips, Export"""
    gesichts_normalen()
    for o in (C.HEAD, C.BODY, C.EYE_OBJ): bind(o, C.ARMO)
    kopf_gewichte(C.HEAD, head_w_extra)
    weights_capsule(C.BODY, C.ARMO, body_allowed, fall=5, smooth_it=3)
    gesicht_keys(C.EYE_OBJ, False)
    log('Shape Keys', [k.name for k in C.EYE_OBJ.data.shape_keys.key_blocks])
    for o in (C.HEAD, C.BODY, C.EYE_OBJ): write_masks(o)
    male([C.HEAD, C.BODY], paint, fur_scale=fur_scale, nstr=nstr)
    materialien(C.HEAD, [C.BODY], augen_textur(iris, pupille, sclera=sclera, IR=IR))
    lods = []
    if lod:
        # LOD1: Körper + Kopf (ohne Shape Keys, nur Grundform) auf 50 %; Augen bleiben (klein)
        hb = C.HEAD.data.copy(); ho = link(bpy.data.objects.new(C.name + '_Kopf_LOD1', hb)); ho.parent = C.ARMO
        for vg in C.HEAD.vertex_groups:
            if vg.name not in ho.vertex_groups: ho.vertex_groups.new(name=vg.name)
        ho.shape_key_clear() if ho.data.shape_keys else None
        for m in list(ho.modifiers): ho.modifiers.remove(m)
        lod_red(ho, lod); ho.modifiers.new('Armature', 'ARMATURE').object = C.ARMO
        bo = C.BODY.data.copy(); bo_ = link(bpy.data.objects.new(C.name + '_Koerper_LOD1', bo)); bo_.parent = C.ARMO
        for vg in C.BODY.vertex_groups:
            if vg.name not in bo_.vertex_groups: bo_.vertex_groups.new(name=vg.name)
        activate(bo_)
        for m in list(bo_.modifiers): bo_.modifiers.remove(m)
        lod_red(bo_, lod); bo_.modifiers.new('Armature', 'ARMATURE').object = C.ARMO
        lods = [ho, bo_]; log('LOD1', tris(ho) + tris(bo_))
    clips = clipfn()
    fertig(out, clips, lods, meta_extra)


# ======================= Vorlage 4: WASSERTIER (Robbe/Wal; robbt an Land, schwimmt mit Wellenschlag) =======================
# Landmarken: C.SPW = [Schwanzspitze, Schwanzbasis, Becken, Mitte, Brust, Halsbasis, Kopfbasis]; C.FIN = [Schulter, Ellbogen, Spitze] (links); C.FINH = Hinterflossen-Ansatz (links)
def rig_wasser():
    W = C.SPW; HC = C.HC; nk = W[5].lerp(W[6], .5)
    hd1 = HC + Vector((0, -.15 * C.HR[1], .9 * C.HR[2]))
    B = [('root', (0, 0, 0), (0, 0, .15 * C.H), None), ('hips', tuple(W[2]), tuple(W[3]), 'root'), ('spine1', tuple(W[3]), tuple(W[4]), 'hips'), ('chest', tuple(W[4]), tuple(W[5]), 'spine1'),
         ('neck1', tuple(W[5]), tuple(nk), 'chest'), ('neck2', tuple(nk), tuple(W[6]), 'neck1'), ('head', tuple(W[6]), tuple(hd1), 'neck2'),
         ('tail1', tuple(W[2]), tuple(W[1]), 'hips'), ('tail2', tuple(W[1]), tuple(W[0]), 'tail1')]
    for s in (-1, 1):
        k = 'L' if s > 0 else 'R'; Cc, f = C.EYES[s]; F = [S_(p, s) for p in C.FIN]; FH = S_(C.FINH, s)
        B += [('eye.' + k, tuple(Cc), tuple(Cc + f * C.RE * .7), 'head'), ('fin1.' + k, tuple(F[0]), tuple(F[1]), 'chest'), ('fin2.' + k, tuple(F[1]), tuple(F[2]), 'fin1.' + k),
              ('finh.' + k, tuple(FH), tuple(FH + Vector((s * .5, 1, 0)).normalized() * .12 * C.H), 'tail2')]
    C.TAILB = ['tail1', 'tail2']; return armature_from(B)
def body_allowed_wasser(co, r):
    k = 'L' if co.x > 0 else 'R'; W = C.SPW
    if r in C.__dict__.get('FINREG', ()):
        return ['chest', 'fin1.' + k, 'fin2.' + k] if co.y < W[3].y else ['tail2', 'finh.' + k]
    if r in C.__dict__.get('KRONE', ()): return ['head']
    return ['hips', 'spine1', 'chest', 'neck1', 'neck2', 'head', 'tail1', 'tail2']
def clips_wasser(gang=None):
    H = C.H; g = dict(wL=.25 * H, rL=.4 * H, wF=30, rF=18); g.update(gang or {})
    sp = ['tail2', 'tail1', 'hips', 'spine1', 'chest', 'neck1', 'head']
    def fins(P, a, b=0.0, hf=0.0):
        for s in (-1, 1):
            k = 'L' if s > 0 else 'R'; P['fin1.' + k] = qmul(rz(s * a), rx(b)); P['fin2.' + k] = rz(s * a * .6); P['finh.' + k] = rz(s * hf)
        return P
    def wave(t, amp, ph=.9, up=0.0):
        return {n: rx(amp * math.sin(2 * math.pi * t - i * ph) * (1 if i < 2 else .6) + (up if n in ('neck1', 'head') else 0)) for i, n in enumerate(sp)}
    def idle(t):
        ph = 2 * math.pi * t; br = math.sin(ph * 3); look = ss(.3, .45, t) * (1 - ss(.62, .78, t)) - .6 * ss(.75, .82, t) * (1 - ss(.9, 1, t))
        P = {'hips:loc': V(0, 0, .002 * H * br), 'chest': rx(.02 * br), 'neck1': rx(.03 * math.sin(ph)), 'head': qmul(rz(.3 * look), ry(.12 * look), rx(-.04 * math.sin(ph * 2))),
             'tail1': rx(.06 * math.sin(ph * 2)), 'tail2': rx(.12 * math.sin(ph * 2 - .8))}
        fins(P, .1 * math.sin(ph * 2) + .05, 0, .2 * math.sin(ph * 2)); return P
    def galumph(t, run=False):
        ph = 2 * math.pi * t; a = .16 if run else .1; P = wave(t, a, .8); P['hips:loc'] = V(0, 0, (.03 if run else .018) * H * max(0, math.sin(ph)))
        P['head'] = qmul(P['head'], rx(-a * .8 * math.sin(ph - 4.5))); fins(P, .25 * math.sin(ph + 1) + .1, .5 * math.sin(ph), .3 * math.sin(ph)); return P
    def swim(t):
        P = wave(t, .14, .7); P['hips:loc'] = V(0, 0, .03 * H * math.sin(2 * math.pi * t)); fins(P, .5, .3 * math.sin(2 * math.pi * t), .4 * math.sin(2 * math.pi * t - 1)); return P
    def attack(t):
        c = env01(t, 0, .3, .32, .42); j = env01(t, .32, .48, .62, 1); bite = env01(t, .44, .5, .58, .66)
        P = {'hips:loc': V(0, -.2 * H * j, .03 * H * c), 'chest': rx(-.35 * c + .15 * j), 'neck1': rx(-.2 * c + .25 * j), 'head': rx(.1 * c + .25 * bite), 'tail1': rx(.2 * c), 'tail2': rx(.3 * c)}
        fins(P, .6 * c + .2 * j, -.5 * j); return P
    def hit(t):
        k_ = math.sin(math.pi * min(1, t * 2.5)) * (1 - t) ** 1.2
        P = {'hips:loc': V(0, .1 * H * k_, 0), 'chest': rx(.25 * k_), 'neck1': rx(-.3 * k_), 'head': qmul(rx(.35 * k_), ry(.3 * k_)), 'tail1': rx(-.2 * k_)}; fins(P, .5 * k_); return P
    def faint(t):
        f = ss(.15, .7, t); P = {'root': ry(1.2 * f), 'hips:loc': V(0, 0, -.02 * H * f), 'neck1': rx(.3 * f), 'head': qmul(rx(.35 * f), rz(.3 * f)), 'tail2': rx(-.2 * f)}; fins(P, -.4 * f, 0, -.2 * f); return P
    def joy(t):
        h = math.sin(math.pi * ss(.08, .5, t)) * (1 - ss(.5, .62, t)) + .45 * math.sin(math.pi * ss(.55, .85, t)); clap = math.sin(t * 6 * 2 * math.pi) * env01(t, .05, .15, .8, .95)
        P = {'hips:loc': V(0, 0, .14 * H * h), 'chest': rx(-.3 * h), 'neck1': rx(-.15 * h), 'head': qmul(rx(-.2 * h), rz(.2 * math.sin(t * 4 * math.pi))), 'tail1': rx(.25 * h), 'tail2': rx(.4 * h)}
        fins(P, .7 * (.5 + .5 * clap), 0, .5 * clap); return P
    def catch(t):
        fl = env01(t, 0, .1, .2, .35); cr = env01(t, .15, .35, .8, 1); wig = math.sin(t * 6 * 2 * math.pi) * env01(t, .35, .45, .8, .95)
        P = {'hips:loc': V(0, .05 * H * fl, -.02 * H * cr), 'spine1': rz(.12 * wig), 'chest': qmul(rz(-.14 * wig), rx(.15 * cr)), 'neck1': rx(-.25 * fl + .15 * cr), 'head': qmul(rx(.25 * cr), rz(.2 * wig)), 'tail1': rz(.2 * wig)}
        fins(P, .3 * cr + .3 * abs(wig)); return P
    make_action(C.ARMO, 'idle', 120, idle); make_action(C.ARMO, 'walk', g['wF'], lambda t: galumph(t)); make_action(C.ARMO, 'run', g['rF'], lambda t: galumph(t, True))
    make_action(C.ARMO, 'swim', 40, swim)
    make_action(C.ARMO, 'attack', 27, attack, loop=False); make_action(C.ARMO, 'hit', 15, hit, loop=False); make_action(C.ARMO, 'faint', 36, faint, loop=False)
    make_action(C.ARMO, 'joy', 36, joy, loop=False); make_action(C.ARMO, 'catch', 45, catch, loop=False)
    C.gang = {'walk': [g['wL'], g['wF'] / 30], 'run': [g['rL'], g['rF'] / 30]}
    rest_pose(C.ARMO); return ['idle', 'walk', 'run', 'swim', 'attack', 'hit', 'faint', 'joy', 'catch']


# ======================= Vorlage 2: ZWEIBEINER (aufrecht, z. B. Bärenjunges) =======================
# Landmarken: C.SPB = [Becken, Bauch, Brust, Halsbasis, Kopfbasis]; C.ARM = [Schulter, Ellbogen, Handgelenk, Handspitze] (links); C.LEG = [Hüfte, Knie, Knöchel, Zehe] (links); C.TAIL (≥2 Pkt, optional)
def rig_zweibeiner(ohren=True):
    S = C.SPB; HC = C.HC; hd1 = HC + Vector((0, -.1 * C.HR[1], .95 * C.HR[2]))
    B = [('root', (0, 0, 0), (0, 0, .15 * C.H), None), ('hips', tuple(S[0]), tuple(S[1]), 'root'), ('spine1', tuple(S[1]), tuple(S[2]), 'hips'), ('chest', tuple(S[2]), tuple(S[3]), 'spine1'),
         ('neck1', tuple(S[3]), tuple(S[3].lerp(S[4], .5)), 'chest'), ('neck2', tuple(S[3].lerp(S[4], .5)), tuple(S[4]), 'neck1'), ('head', tuple(S[4]), tuple(hd1), 'neck2')]
    tl = C.__dict__.get('TAIL')
    if tl: B.append(('tail1', tuple(tl[0]), tuple(tl[-1]), 'hips'))
    for s in (-1, 1):
        k = 'L' if s > 0 else 'R'; A = [S_(p, s) for p in C.ARM]; Lg = [S_(p, s) for p in C.LEG]; Cc, f = C.EYES[s]
        B += [('eye.' + k, tuple(Cc), tuple(Cc + f * C.RE * .7), 'head')]
        if ohren and s in C.EARS:
            eb, eu, L, fw, side = C.EARS[s]; B += [('ear1.' + k, tuple(eb), tuple(eb + eu * L * .45), 'head'), ('ear2.' + k, tuple(eb + eu * L * .45), tuple(eb + eu * L * .95), 'ear1.' + k)]
        B += [('upper_a.' + k, tuple(A[0]), tuple(A[1]), 'chest'), ('lower_a.' + k, tuple(A[1]), tuple(A[2]), 'upper_a.' + k), ('hand.' + k, tuple(A[2]), tuple(A[3]), 'lower_a.' + k),
              ('thigh.' + k, tuple(Lg[0]), tuple(Lg[1]), 'hips'), ('shin.' + k, tuple(Lg[1]), tuple(Lg[2]), 'thigh.' + k), ('foot.' + k, tuple(Lg[2]), tuple(Lg[3]), 'shin.' + k)]
    C.TAILB = ['tail1'] if tl else []; return armature_from(B)
def body_allowed_zb(co, r):
    k = 'L' if co.x > 0 else 'R'
    if r in C.__dict__.get('KOPFREG', ()): return ['head']
    if co.z > C.SPB[3].z: return ['chest', 'neck1', 'neck2', 'head']
    return ['hips', 'spine1', 'chest', 'neck1', 'upper_a.' + k, 'lower_a.' + k, 'hand.' + k, 'thigh.' + k, 'shin.' + k, 'foot.' + k] + C.TAILB
def leg_b(s, T, root, foot=0.0):
    Lg = [S_(p, s) for p in C.LEG]; k = 'L' if s > 0 else 'R'; t1, t2 = ik2(Lg[0] + root, Lg[1] + root, Lg[2] + root, T, 1)
    return {'thigh.' + k: rx(t1), 'shin.' + k: rx(t2), 'foot.' + k: rx(-(t1 + t2) + foot)}
def arms(P, a, b=.0, out=.0, s_only=None):
    for s in (-1, 1):
        if s_only and s != s_only: continue
        k = 'L' if s > 0 else 'R'; aa = a if not isinstance(a, tuple) else a[0 if s > 0 else 1]
        P['upper_a.' + k] = qmul(ry(-s * out), rx(aa)); P['lower_a.' + k] = rx(b)
    return P
def clips_zweibeiner(gang=None):
    H = C.H; g = dict(wL=.16 * H, rL=.28 * H, wF=24, rF=15, lift=.05 * H); g.update(gang or {})
    def feet(P, root, offL=V(0, 0, 0), offR=V(0, 0, 0)):
        for s in (-1, 1): P.update(leg_b(s, S_(C.LEG[2], s) + (offL if s > 0 else offR), root))
        return P
    def walk(t, run=False):
        ph = 2 * math.pi * t; L = g['rL'] if run else g['wL']; st = .4 if run else .6; lift = g['lift'] * (1.6 if run else 1)
        root = V(0, 0, -.006 * H - (.012 if run else .006) * H * (.5 + .5 * math.cos(2 * ph)) + (.02 * H * abs(math.sin(ph)) if run else 0)); P = {'hips:loc': root}
        P['hips'] = qmul(rz(.08 * math.sin(ph)), ry(.06 * math.sin(ph))); P['spine1'] = rx(-.08 if run else -.02); P['chest'] = qmul(rz(-.06 * math.sin(ph)), rx(-.06 if run else 0))
        P['head'] = qmul(rz(.04 * math.sin(ph)), rx(.05 if run else 0))
        for s in (-1, 1):
            u = (t + (0 if s > 0 else .5)) % 1; dy, dz = foot_path(u, st, L, lift); P.update(leg_b(s, S_(C.LEG[2], s) + V(0, -dy, dz), root, .3 * dz / max(lift, 1e-6)))
        arms(P, (.5 * math.sin(ph) * (1.4 if run else 1), -.5 * math.sin(ph) * (1.4 if run else 1)), -.3 if run else -.1, .1)
        ears_pose(P, -.08 * math.sin(2 * ph)); P.update(chain_sway(C.TAILB, t, .2)); return P
    def idle(t):
        ph = 2 * math.pi * t; br = math.sin(ph * 3); look = ss(.3, .45, t) * (1 - ss(.62, .78, t)) - .6 * ss(.75, .82, t) * (1 - ss(.9, 1, t)); sway = math.sin(ph)
        root = V(.006 * H * sway, 0, -.003 * H + .002 * H * br); P = {'hips:loc': root, 'hips': rz(.04 * sway), 'spine1': rx(.015 * br), 'chest': qmul(rx(.02 * br), rz(-.05 * sway)),
             'head': qmul(rz(.3 * look - .08 * sway), ry(.12 * look), rx(-.04 * math.sin(ph * 2)))}
        if g.get('sitz'):   # sitzt wie im Bild: Becken tief, Beine nach vorn, Sohlen zeigen nach vorn, Pfoten am Bauch
            dz = C.LEG[0].z * .62; root = V(root.x, .01 * H, -dz + root.z); P['hips:loc'] = root; P['hips'] = rx(-.12); P['chest'] = qmul(P['chest'], rx(.1))
            for s in (-1, 1): P.update(leg_b(s, S_(C.LEG[2], s) + V(s * .012 * H, -C.LEG[0].z * .72, C.LEG[0].z * .05), root, g.get('sohle', -1.1)))
            arms(P, -.55 + .04 * br, -.9, .05)
        else: arms(P, .05 * br, -.25, .12 + .03 * br); feet(P, root)
        tw = env01(t, .12, .14, .17, .2)
        for s in (-1, 1):
            k = 'L' if s > 0 else 'R'
            if 'ear1.' + k in C.BN: P['ear1.' + k] = rx(-.3 * tw * (s > 0))
        P.update(chain_sway(C.TAILB, t * 2, .15)); return P
    def attack(t):
        c = env01(t, 0, .3, .32, .42); j = env01(t, .32, .48, .62, 1); sw = env01(t, .38, .48, .58, .75)
        root = V(0, -.1 * H * j, -.03 * H * c); P = {'hips:loc': root, 'spine1': rx(.15 * c - .15 * j), 'chest': qmul(rx(.1 * c + .2 * sw), rz(-.3 * c + .4 * sw)), 'head': rx(-.1 * c + .1 * j)}
        arms(P, (-1.6 * c + 1.2 * sw, -.6 * c + .3 * j), -.5, .3); feet(P, root, V(0, -.04 * H * j, 0), V(0, .03 * H * c, 0)); ears_pose(P, .5 * c); return P
    def hit(t):
        k_ = math.sin(math.pi * min(1, t * 2.5)) * (1 - t) ** 1.2; root = V(0, .07 * H * k_, -.02 * H * k_)
        P = {'hips:loc': root, 'spine1': rx(-.2 * k_), 'chest': rx(-.15 * k_), 'head': qmul(rx(.3 * k_), ry(.3 * k_))}; arms(P, -.6 * k_, -.6 * k_, .3 * k_); feet(P, root); ears_pose(P, .8 * k_); return P
    def faint(t):
        sit = ss(.0, .45, t); lie = ss(.45, .9, t); root = V(0, .05 * H * lie, -(C.LEG[0].z * .75) * sit)
        P = {'hips:loc': root, 'hips': rx(-1.2 * lie), 'head': qmul(rx(.3 * sit - .2 * lie), rz(.3 * lie))}
        arms(P, -.4 * sit - .6 * lie, -.3, .6 * lie); 
        for s in (-1, 1): P.update(leg_b(s, S_(C.LEG[2], s) + V(0, -.12 * H * sit, .0), root))
        ears_pose(P, .6 * sit); return P
    def joy(t):
        h = math.sin(math.pi * ss(.08, .5, t)) * (1 - ss(.5, .62, t)) + .45 * math.sin(math.pi * ss(.55, .85, t)); cr = env01(t, 0, .08, .08, .14)
        root = V(0, 0, .16 * H * h - .04 * H * cr); P = {'hips:loc': root, 'chest': rx(-.15 * h), 'head': qmul(rx(-.25 * h), rz(.2 * math.sin(t * 4 * math.pi)))}
        arms(P, -2.4 * ss(.05, .3, t) * (1 - ss(.8, 1, t)), -.3, .5 * h + .2); feet(P, root, V(0, 0, .03 * H * h), V(0, 0, .03 * H * h)); ears_pose(P, -.2 * h); P.update(chain_sway(C.TAILB, t * 4, .4)); return P
    def catch(t):
        fl = env01(t, 0, .1, .2, .35); cr = env01(t, .15, .35, .8, 1); wig = math.sin(t * 6 * 2 * math.pi) * env01(t, .35, .45, .8, .95)
        root = V(0, .04 * H * fl, -.05 * H * cr); P = {'hips:loc': root, 'spine1': rz(.12 * wig), 'chest': qmul(rz(-.12 * wig), rx(.15 * cr)), 'head': qmul(rx(.25 * cr), rz(.2 * wig))}
        arms(P, -1.3 * cr, -1.2 * cr, -.2 * cr); feet(P, root); ears_pose(P, .8 * max(fl, cr)); return P
    make_action(C.ARMO, 'idle', 120, idle); make_action(C.ARMO, 'walk', g['wF'], lambda t: walk(t)); make_action(C.ARMO, 'run', g['rF'], lambda t: walk(t, True))
    make_action(C.ARMO, 'attack', 27, attack, loop=False); make_action(C.ARMO, 'hit', 15, hit, loop=False); make_action(C.ARMO, 'faint', 36, faint, loop=False)
    make_action(C.ARMO, 'joy', 36, joy, loop=False); make_action(C.ARMO, 'catch', 45, catch, loop=False)
    C.gang = {'walk': [g['wL'], g['wF'] / 30], 'run': [g['rL'], g['rF'] / 30]}
    rest_pose(C.ARMO); return ['idle', 'walk', 'run', 'attack', 'hit', 'faint', 'joy', 'catch']

# ======================= Vorlage 3: VOGEL (Eule/Singvogel; hüpft am Boden, Flügelschlag, Clip „fly“) =======================
# Landmarken: C.SPV = [Becken, Brust, Halsbasis, Kopfbasis]; C.WING = [Schulter, Ellbogen, Handgelenk, Spitze] (links); C.LEGV = [Hüfte, Ferse, Zehen] (links); C.TAILV = [Basis, Ende]
def rig_vogel():
    S = C.SPV; HC = C.HC; hd1 = HC + Vector((0, -.1 * C.HR[1], .95 * C.HR[2]))
    B = [('root', (0, 0, 0), (0, 0, .15 * C.H), None), ('hips', tuple(S[0]), tuple(S[1]), 'root'), ('chest', tuple(S[1]), tuple(S[2]), 'hips'),
         ('neck1', tuple(S[2]), tuple(S[2].lerp(S[3], .5)), 'chest'), ('neck2', tuple(S[2].lerp(S[3], .5)), tuple(S[3]), 'neck1'), ('head', tuple(S[3]), tuple(hd1), 'neck2'),
         ('tail1', tuple(C.TAILV[0]), tuple(C.TAILV[1]), 'hips')]
    for s in (-1, 1):
        k = 'L' if s > 0 else 'R'; Wg = [S_(p, s) for p in C.WING]; Lg = [S_(p, s) for p in C.LEGV]; Cc, f = C.EYES[s]
        B += [('eye.' + k, tuple(Cc), tuple(Cc + f * C.RE * .7), 'head'), ('wing1.' + k, tuple(Wg[0]), tuple(Wg[1]), 'chest'), ('wing2.' + k, tuple(Wg[1]), tuple(Wg[2]), 'wing1.' + k),
              ('wing3.' + k, tuple(Wg[2]), tuple(Wg[3]), 'wing2.' + k), ('thigh.' + k, tuple(Lg[0]), tuple(Lg[1]), 'hips'), ('foot.' + k, tuple(Lg[1]), tuple(Lg[2]), 'thigh.' + k)]
        if s in C.EARS:
            eb, eu, L, fw, side = C.EARS[s]; B += [('ear1.' + k, tuple(eb), tuple(eb + eu * L * .45), 'head'), ('ear2.' + k, tuple(eb + eu * L * .45), tuple(eb + eu * L * .95), 'ear1.' + k)]
    C.TAILB = ['tail1']; return armature_from(B)
def body_allowed_vogel(co, r):
    k = 'L' if co.x > 0 else 'R'
    if r in C.__dict__.get('FLUEGEL', ()): return ['chest', 'wing1.' + k, 'wing2.' + k, 'wing3.' + k]
    if r in C.__dict__.get('SCHWANZ', ()): return ['hips', 'tail1']
    if r in C.__dict__.get('BEIN', ()): return ['hips', 'thigh.' + k, 'foot.' + k]
    return ['hips', 'chest', 'neck1', 'neck2', 'head', 'tail1']
def clips_vogel(gang=None):
    H = C.H; g = dict(wL=.12 * H, rL=.22 * H, wF=18, rF=12); g.update(gang or {})
    def wings(P, fold, flap=0.0, tw=0.0):
        for s in (-1, 1):
            k = 'L' if s > 0 else 'R'; P['wing1.' + k] = qmul(ry(s * (fold * .9 - flap)), rz(s * tw)); P['wing2.' + k] = ry(s * (fold * .7 - flap * .4)); P['wing3.' + k] = ry(s * (fold * .5 - flap * .3))
        return P
    def hop(t, hh, L, flap=0.0):
        ph = 2 * math.pi * t; up = max(0, math.sin(ph)); P = {'hips:loc': V(0, 0, hh * up - .01 * H * (1 - up))}
        P['chest'] = rx(.08 * math.sin(ph)); P['head'] = rx(-.08 * math.sin(ph)); wings(P, .75 - .3 * up, flap * math.sin(ph * 2))
        for s in (-1, 1): k = 'L' if s > 0 else 'R'; P['thigh.' + k] = rx(-.5 * up); P['foot.' + k] = rx(.6 * up)
        P['tail1'] = rx(.2 * math.sin(ph)); return P
    def idle(t):
        ph = 2 * math.pi * t; br = math.sin(ph * 3); look = ss(.3, .45, t) * (1 - ss(.62, .78, t)) - .6 * ss(.75, .82, t) * (1 - ss(.9, 1, t))
        P = {'hips:loc': V(.01 * H * math.sin(ph), 0, .004 * H * br), 'hips': ry(.08 * math.sin(ph)), 'chest': qmul(rx(.03 * br), ry(-.05 * math.sin(ph))), 'head': qmul(rz(.45 * look), ry(.3 * math.sin(ph * 2) * ss(.05, .2, t) * (1 - ss(.25, .3, t)) + .1 * math.sin(ph))), 'tail1': qmul(rx(.08 * math.sin(ph * 4)), rz(.15 * math.sin(ph * 2)))}
        rf = env01(t, .5, .53, .6, .65); wings(P, .8 - .3 * rf, .2 * rf * math.sin(ph * 30)); ears_pose(P, .05 * math.sin(ph * 2)); return P
    def fly(t):
        ph = 2 * math.pi * t; P = {'hips:loc': V(0, 0, .03 * H * math.sin(ph)), 'chest': rx(-.15), 'head': rx(.15), 'tail1': rx(-.1)}; wings(P, 0, .9 * math.sin(ph), .1 * math.cos(ph))
        for s in (-1, 1): k = 'L' if s > 0 else 'R'; P['thigh.' + k] = rx(-.7); P['foot.' + k] = rx(.9)
        return P
    def attack(t):
        c = env01(t, 0, .3, .32, .42); j = env01(t, .32, .48, .62, 1)
        P = {'hips:loc': V(0, -.15 * H * j, .06 * H * j), 'chest': rx(.25 * c - .2 * j), 'head': rx(.3 * j)}; wings(P, .8 * (1 - c) * (1 - j), .9 * c - .6 * j); ears_pose(P, -.3 * c); return P
    def hit(t):
        k_ = math.sin(math.pi * min(1, t * 2.5)) * (1 - t) ** 1.2; P = {'hips:loc': V(0, .08 * H * k_, 0), 'chest': rx(-.25 * k_), 'head': qmul(rx(.3 * k_), ry(.3 * k_))}; wings(P, .8 - .5 * k_, .4 * k_); return P
    def faint(t):
        f = ss(.15, .7, t); P = {'root': ry(1.3 * f), 'hips:loc': V(0, 0, -.03 * H * f), 'head': rx(.3 * f)}; wings(P, .8 - .6 * f, -.2 * f); return P
    def joy(t):
        h = math.sin(math.pi * ss(.08, .5, t)) * (1 - ss(.5, .62, t)) + .45 * math.sin(math.pi * ss(.55, .85, t))
        P = {'hips:loc': V(0, 0, .2 * H * h), 'chest': rx(-.15 * h), 'head': rz(.25 * math.sin(t * 4 * math.pi))}; wings(P, .1, .8 * math.sin(t * 8 * 2 * math.pi) * env01(t, 0, .1, .8, .95)); ears_pose(P, -.3 * h); return P
    def catch(t):
        fl = env01(t, 0, .1, .2, .35); cr = env01(t, .15, .35, .8, 1); wig = math.sin(t * 6 * 2 * math.pi) * env01(t, .35, .45, .8, .95)
        P = {'hips:loc': V(0, .04 * H * fl, -.04 * H * cr), 'chest': rz(.15 * wig), 'head': qmul(rx(.25 * cr), rz(.2 * wig))}; wings(P, .9 * cr + .3 * (1 - cr), .3 * abs(wig)); return P
    make_action(C.ARMO, 'idle', 120, idle); make_action(C.ARMO, 'walk', g['wF'], lambda t: hop(t, .05 * H, g['wL'])); make_action(C.ARMO, 'run', g['rF'], lambda t: hop(t, .09 * H, g['rL'], .6))
    make_action(C.ARMO, 'fly', 20, fly)
    make_action(C.ARMO, 'attack', 27, attack, loop=False); make_action(C.ARMO, 'hit', 15, hit, loop=False); make_action(C.ARMO, 'faint', 36, faint, loop=False)
    make_action(C.ARMO, 'joy', 36, joy, loop=False); make_action(C.ARMO, 'catch', 45, catch, loop=False)
    C.gang = {'walk': [g['wL'], g['wF'] / 30], 'run': [g['rL'], g['rF'] / 30]}
    rest_pose(C.ARMO); return ['idle', 'walk', 'run', 'fly', 'attack', 'hit', 'faint', 'joy', 'catch']

# ======================= Vorlage 5: SCHWEBEND (schwebt über dem Boden, Flügelchen flattern; Bewegung = Gleiten mit Neigung) =======================
# Landmarken: C.SPS = [Unterkörper, Brust, Kopfbasis]; C.ARMS = [Schulter, Pfote] (links); C.FLW = Flügelansatz (links); C.TAILV = [Basis, Ende] (z. B. Laterne)
def rig_schwebend():
    S = C.SPS; HC = C.HC; hd1 = HC + Vector((0, -.1 * C.HR[1], .95 * C.HR[2]))
    B = [('root', (0, 0, 0), (0, 0, .15 * C.H), None), ('hips', tuple(S[0]), tuple(S[1]), 'root'), ('chest', tuple(S[1]), tuple(S[2]), 'hips'),
         ('neck2', tuple(S[2]), tuple(S[2] + Vector((0, 0, .02 * C.H))), 'chest'), ('head', tuple(S[2] + Vector((0, 0, .02 * C.H))), tuple(hd1), 'neck2'), ('tail1', tuple(C.TAILV[0]), tuple(C.TAILV[1]), 'hips')]
    for s in (-1, 1):
        k = 'L' if s > 0 else 'R'; A = [S_(p, s) for p in C.ARMS]; Fw = S_(C.FLW, s); Cc, f = C.EYES[s]
        B += [('eye.' + k, tuple(Cc), tuple(Cc + f * C.RE * .7), 'head'), ('arm.' + k, tuple(A[0]), tuple(A[1]), 'chest'), ('wing1.' + k, tuple(Fw), tuple(Fw + Vector((s * .1, .1, .05)) * C.H), 'chest')]
        if s in C.EARS:
            eb, eu, L, fw, side = C.EARS[s]; B += [('ear1.' + k, tuple(eb), tuple(eb + eu * L * .45), 'head'), ('ear2.' + k, tuple(eb + eu * L * .45), tuple(eb + eu * L * .95), 'ear1.' + k)]
    C.TAILB = ['tail1']; return armature_from(B)
def body_allowed_schwebe(co, r):
    k = 'L' if co.x > 0 else 'R'
    if r in C.__dict__.get('FLUEGEL', ()): return ['chest', 'wing1.' + k]
    if r in C.__dict__.get('SCHWANZ', ()): return ['hips', 'tail1']
    if r in C.__dict__.get('ARMREG', ()): return ['chest', 'arm.' + k]
    return ['hips', 'chest', 'neck2', 'head', 'tail1']
def clips_schwebend(gang=None):
    H = C.H; g = dict(wL=.3 * H, rL=.5 * H, wF=30, rF=20); g.update(gang or {})
    def flutter(P, t, f=12, a=.5, base=0.0):
        for s in (-1, 1): k = 'L' if s > 0 else 'R'; P['wing1.' + k] = ry(s * (base + a * math.sin(2 * math.pi * t * f)))
        return P
    def arms(P, a):
        for s in (-1, 1): P['arm.' + ('L' if s > 0 else 'R')] = rx(a)
        return P
    def idle(t):
        ph = 2 * math.pi * t; look = ss(.3, .45, t) * (1 - ss(.62, .78, t)) - .6 * ss(.75, .82, t) * (1 - ss(.9, 1, t))
        P = {'hips:loc': V(0, 0, .04 * H * math.sin(ph * 2)), 'chest': rx(.04 * math.sin(ph * 2 + 1)), 'head': qmul(rz(.35 * look), ry(.12 * math.sin(ph))), 'tail1': rx(.15 * math.sin(ph * 2 - .8))}
        flutter(P, t, 16, .45); arms(P, -.2 + .1 * math.sin(ph * 2)); ears_pose(P, .15 * math.sin(ph * 2 - 1.2)); return P
    def glide(t, run=False):
        ph = 2 * math.pi * t; P = {'hips:loc': V(0, 0, .04 * H * math.sin(ph)), 'root': rx(.18 if run else .1), 'head': rx(-.1), 'tail1': rx(-.2 + .1 * math.sin(ph))}
        flutter(P, t, 6 if run else 4, .6); arms(P, .3); ears_pose(P, .35 if run else .2); return P
    def attack(t):
        c = env01(t, 0, .3, .32, .42); j = env01(t, .32, .48, .62, 1)
        P = {'hips:loc': V(0, -.2 * H * j, .05 * H * c), 'root': rx(.3 * j - .2 * c), 'head': rx(.2 * j)}; flutter(P, t, 6, .7); arms(P, -1.2 * c + .6 * j); ears_pose(P, -.4 * c + .5 * j); return P
    def hit(t):
        k_ = math.sin(math.pi * min(1, t * 2.5)) * (1 - t) ** 1.2; P = {'hips:loc': V(0, .1 * H * k_, -.03 * H * k_), 'root': rx(-.35 * k_), 'head': ry(.3 * k_)}; flutter(P, t, 3, .3); arms(P, -.8 * k_); ears_pose(P, .9 * k_); return P
    def faint(t):
        f = ss(.1, .7, t); P = {'hips:loc': V(0, 0, -.06 * H * f), 'root': ry(1.25 * f), 'head': rx(.3 * f)}; flutter(P, t, 1, .05, -.3 * f); arms(P, .4 * f); ears_pose(P, .8 * f); return P
    def joy(t):
        h = math.sin(math.pi * ss(.05, .85, t)); P = {'hips:loc': V(0, 0, .18 * H * h), 'root': rz(2 * math.pi * ss(.15, .75, t))}; flutter(P, t, 10, .7); arms(P, -2.0 * h); ears_pose(P, -.4 * h); return P
    def catch(t):
        fl = env01(t, 0, .1, .2, .35); cr = env01(t, .15, .35, .8, 1); wig = math.sin(t * 6 * 2 * math.pi) * env01(t, .35, .45, .8, .95)
        P = {'hips:loc': V(0, .04 * H * fl, -.05 * H * cr), 'root': rz(.15 * wig), 'head': rx(.3 * cr)}; flutter(P, t, 14, .5 * (1 - cr) + .2); arms(P, -1.3 * cr); ears_pose(P, .9 * max(fl, cr)); return P
    make_action(C.ARMO, 'idle', 120, idle); make_action(C.ARMO, 'walk', g['wF'], lambda t: glide(t)); make_action(C.ARMO, 'run', g['rF'], lambda t: glide(t, True))
    make_action(C.ARMO, 'attack', 27, attack, loop=False); make_action(C.ARMO, 'hit', 15, hit, loop=False); make_action(C.ARMO, 'faint', 36, faint, loop=False)
    make_action(C.ARMO, 'joy', 36, joy, loop=False); make_action(C.ARMO, 'catch', 45, catch, loop=False)
    C.gang = {'walk': [g['wL'], g['wF'] / 30], 'run': [g['rL'], g['rF'] / 30]}
    rest_pose(C.ARMO); return ['idle', 'walk', 'run', 'attack', 'hit', 'faint', 'joy', 'catch']
