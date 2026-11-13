# Veyra Figurenbaukasten (Runde 2, 12.11.) – ein Grundkörper je Typ, Gesicht als Funktion, Haarsysteme, Kleidungsbausteine.
# Blender 5.3 als Python-Modul. Koordinaten wie vlib: Z oben, vorn = −Y, linke Körperseite = +X.
# Teil 1 (diese Datei): Maße je Körpertyp, Körper (Skin-Graph → Subdivision → Formung), Kopf + Gesicht, Haare, Kleidung, Zubehör.
# Teil 2 (fkit2.py): Rig (34 Knochen), Gewichte, Shape Keys, UV, Backen + Malen, LOD 50 %, Clips, Export.
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from vlib import *
from mathutils.bvhtree import BVHTree

# ---------------- Körpertypen (Anteile an der Größe H, außer H/heads) ----------------
# shx/shz Schultergelenk, chest/waist/pelv = (halbe Breite, halbe Tiefe), hipx/hipz Hüftgelenk, Radien der Gliedmaßen, ua/fa/hand Armlängen
TYP = {
 'kind':     dict(H=1.45, heads=5.75, fem=0, shx=.092, shz=.792, neck=.035, chest=(.09, .059), waist=(.077, .054), pelv=(.084, .058), hipx=.047, hipz=.488,
                  kneez=.268, ankz=.044, thigh=.052, knee=.033, calf=.036, ank=.02, ua=.170, fa=.140, hand=.100, uar=.028, far=.022, wr=.0145, stoop=0, belly=0, bust=0),
 'teen':     dict(H=1.60, heads=6.35, fem=0, shx=.098, shz=.805, neck=.03, chest=(.092, .058), waist=(.074, .051), pelv=(.084, .056), hipx=.048, hipz=.505,
                  kneez=.278, ankz=.043, thigh=.046, knee=.029, calf=.031, ank=.018, ua=.178, fa=.143, hand=.104, uar=.025, far=.019, wr=.013, stoop=0, belly=0, bust=0),
 'frau':     dict(H=1.68, heads=7.0, fem=1, shx=.097, shz=.815, neck=.027, chest=(.088, .058), waist=(.07, .05), pelv=(.096, .064), hipx=.051, hipz=.515,
                  kneez=.285, ankz=.042, thigh=.05, knee=.03, calf=.032, ank=.017, ua=.184, fa=.146, hand=.104, uar=.023, far=.018, wr=.012, stoop=0, belly=0, bust=1),
 'mann':     dict(H=1.80, heads=7.3, fem=0, shx=.108, shz=.818, neck=.031, chest=(.1, .064), waist=(.083, .056), pelv=(.088, .06), hipx=.052, hipz=.52,
                  kneez=.285, ankz=.042, thigh=.048, knee=.03, calf=.032, ank=.018, ua=.186, fa=.146, hand=.106, uar=.027, far=.021, wr=.0135, stoop=0, belly=0, bust=0),
 'kraeftig': dict(H=1.76, heads=7.1, fem=0, shx=.112, shz=.812, neck=.036, chest=(.112, .078), waist=(.106, .084), pelv=(.1, .07), hipx=.055, hipz=.51,
                  kneez=.28, ankz=.042, thigh=.054, knee=.033, calf=.035, ank=.019, ua=.184, fa=.146, hand=.108, uar=.031, far=.024, wr=.015, stoop=0, belly=1, bust=0),
 'alt_m':    dict(H=1.68, heads=6.9, fem=0, shx=.104, shz=.805, neck=.03, chest=(.098, .068), waist=(.088, .064), pelv=(.088, .062), hipx=.052, hipz=.512,
                  kneez=.282, ankz=.042, thigh=.046, knee=.03, calf=.03, ank=.018, ua=.184, fa=.146, hand=.106, uar=.025, far=.02, wr=.013, stoop=1, belly=.5, bust=0),
 'alt_w':    dict(H=1.60, heads=6.8, fem=1, shx=.096, shz=.80, neck=.027, chest=(.09, .064), waist=(.08, .058), pelv=(.096, .066), hipx=.051, hipz=.508,
                  kneez=.282, ankz=.042, thigh=.049, knee=.03, calf=.031, ank=.017, ua=.182, fa=.144, hand=.102, uar=.024, far=.019, wr=.012, stoop=1, belly=.3, bust=.6),
}
ARM_A = math.radians(42)
for _k, _t in TYP.items():
    if _k != 'kind':
        for _n in ('uar', 'far', 'wr', 'thigh', 'calf', 'knee', 'neck'): _t[_n] *= 1.08   # Ruhelage der Arme (A-Pose) – die Spielpose kommt aus den Clips

class D: pass   # Maße der aktuellen Figur (Modul-global, Teil 2 liest sie)
def mx(v): return Vector((-v.x, v.y, v.z))
def Lr(v, s): return v if s > 0 else mx(v)

def setup(spec):
    t = dict(TYP[spec['typ']]); t.update(spec.get('mass', {})); H = t['H']; D.T = t; D.H = H; D.spec = spec
    D.head = H / t['heads']; D.hh = D.head / 2; D.hw = D.hh * (.8 if spec['typ'] == 'kind' else .75 if t['fem'] else .76); D.hd = D.hh * .9
    D.HC = Vector((0, .006 * H if t['stoop'] else 0, H - D.hh)) + (Vector((0, -.022 * H, -.006 * H)) if t['stoop'] else Vector())
    D.SH = Vector((t['shx'] * H, .004 * H + (.01 * H if t['stoop'] else 0), t['shz'] * H))
    D.ARM = Vector((math.sin(ARM_A), 0, -math.cos(ARM_A)))
    D.L_UA, D.L_FA, D.L_HA = t['ua'] * H, t['fa'] * H, t['hand'] * H
    D.EL = D.SH + D.ARM * D.L_UA; D.WR = D.EL + D.ARM * D.L_FA
    D.HIP = Vector((t['hipx'] * H, 0, t['hipz'] * H)); D.KNEE = Vector((t['hipx'] * H * 1.02, -.004 * H, t['kneez'] * H))
    D.ANK = Vector((t['hipx'] * H * 1.06, .008 * H, t['ankz'] * H))
    fl = .105 * H * (1.0 if spec['typ'] != 'kind' else 1.06)              # Fußlänge
    D.BALL = Vector((D.ANK.x * 1.03, D.ANK.y - fl * .62, .014 * H)); D.TOE = Vector((D.ANK.x * 1.04, D.ANK.y - fl * .9, .012 * H)); D.FL = fl
    D.NECK0 = Vector((0, .006 * H, t['shz'] * H + .022 * H)); D.CHIN = H - D.head
    D.kid = spec['typ'] == 'kind'; D.fem = bool(t['fem'])
    return D

# ---------------- Regionen ----------------
def regions(spec):
    c = spec['farben']
    def R(n, col, mk): region(n, col, mk)
    R('haut', c['haut'], (1, 1, 0, 0)); R('haut_kopf', c['haut'], (.42, 1, 0, 0)); R('lid', c['haut'], (0, 1, 0, 0)); R('nase', c['haut'], (0, 1, 0, 0))
    R('lidlinie', c.get('lidlinie', '#2a1c1e'), (0, 0, 0, 0)); R('braue', c.get('braue', c['haar']), (0, 0, 0, 0)); R('mundlinie', c.get('mund', '#8a4a40'), (0, 0, 0, 0))
    R('haar', c['haar'], (1, .15, .35, 0)); R('bart', c.get('bart', c['haar']), (1, .1, .3, 0))
    R('auge', '#ffffff', (0, 0, 1, 0)); R('mund_innen', '#5a2028', (0, 0, 0, 0))
    for k in ('top', 'top2', 'jacke', 'kittel', 'hose', 'rock', 'schuerze', 'muetze', 'rucksack', 'socke'):
        if k in c: R(k, c[k], (1, .05, 0, 0))
    R('saum', c.get('saum', c.get('top', '#888888')), (1, .05, 0, 0)); R('saum2', c.get('saum2', c.get('saum', '#777777')), (1, .05, 0, 0))
    R('schuh', c.get('schuh', '#e8e2d6'), (1, 0, .15, 0)); R('sohle', c.get('sohle', '#b9b6b0'), (1, 0, .1, 0)); R('leder', c.get('leder', '#6a4a30'), (1, 0, .25, 0))
    R('metall', c.get('metall', '#c9a24a'), (1, 0, .9, 0)); R('glas', c.get('glas', '#9fd8ea'), (1, 0, 1, 0)); R('dunkel', c.get('dunkel', '#3a3f4a'), (1, 0, .6, 0))
    R('schirm', '#7fe8f0', (0, 0, .5, .8)); R('blume', c.get('blume', '#ffffff'), (1, .2, 0, 0)); R('knopf', c.get('knopf', '#e8d8a8'), (1, 0, .5, 0))

# =====================================================================
# Körper
# =====================================================================
def arm_coord(p, s=None):
    """(s, t entlang des Arms ab Schulter, radial) oder None – A-Pose"""
    s = s or (1 if p.x > 0 else -1); S = Lr(D.SH, s); A = Lr(D.ARM, s); q = p - S; t = q.dot(A)
    rr = (q - A * t).length
    if abs(p.x) < D.SH.x * .72 or t < -.03 * D.H or rr > .075 * D.H * (1 if t < D.L_UA + D.L_FA else 1.3): return None
    return s, t, rr
def leg_coord(p):
    s = 1 if p.x > 0 else -1; Hp, K, A_ = Lr(D.HIP, s), Lr(D.KNEE, s), Lr(D.ANK, s)
    if p.z > Hp.z: return s, 0, Hp
    if p.z > K.z: a, b, t0, L = Hp, K, 0, (K - Hp).length
    else: a, b, t0, L = K, A_, 1, (A_ - K).length
    ab = b - a; t = max(0, min(1, (p - a).dot(ab) / ab.length_squared)); return s, t0 + t, a + ab * t

def build_body():
    T = D.T; H = D.H; N = []; E = []; R = []
    def node(p, r): N.append(tuple(p)); R.append(r); return len(N) - 1
    def chain(ids):
        for a, b in zip(ids, ids[1:]): E.append((a, b))
    hz, sz = D.HIP.z, D.SH.z; sto = .012 * H * T['stoop']
    pel = node((0, 0, hz + .025 * H), T['pelv'][0] * H * .92)
    w1 = node((0, 0, lerp(hz, sz, .38)), T['waist'][0] * H * .95)
    c0 = node((0, sto * .3, lerp(hz, sz, .64)), T['chest'][0] * H * .9)
    c1 = node((0, sto * .7, lerp(hz, sz, .86)), T['chest'][0] * H * .92)
    c2 = node((0, sto, sz + .006 * H), T['chest'][0] * H * .62)
    n0 = node((0, D.NECK0.y + sto, D.NECK0.z), T['neck'] * H * 1.18); n1 = node((0, D.NECK0.y + sto * 1.2, D.CHIN + .035 * H), T['neck'] * H)
    chain([pel, w1, c0, c1, c2, n0, n1])
    D.TRZ = [N[i][2] for i in (pel, w1, c0, c1, c2, n0)]; D.TRR = [R[i] for i in (pel, w1, c0, c1, c2, n0)]
    D.HANDS = {}
    for s in (-1, 1):
        S = Lr(D.SH, s); A = Lr(D.ARM, s)
        s0 = node((s * D.SH.x * .55, D.SH.y, sz + .002 * H), T['uar'] * H * 1.5); sh = node(tuple(S), T['uar'] * H * 1.22)
        ua = [node(tuple(S + A * D.L_UA * k), T['uar'] * H * (1.05 - .2 * k)) for k in (.33, .68)]
        el = node(tuple(S + A * D.L_UA), T['far'] * H * 1.02)
        fa = [node(tuple(S + A * (D.L_UA + D.L_FA * k)), T['far'] * H * (1.08 - .3 * k)) for k in (.3, .65)]
        wr = node(tuple(D.WR if s > 0 else mx(D.WR)), T['wr'] * H)
        chain([c1, s0, sh] + ua + [el] + fa + [wr])
        # Hand: Ballen + Handfläche (flach), 4 Finger (3 Glieder), Daumen – Handfläche zur Hüfte (−s·x), Finger vorn→hinten gestaffelt
        W = Lr(D.WR, s); hl = D.L_HA; side = Vector((0, -1, 0)); fw = .0215 * H / 1.45 * (1.08 if not D.kid else 1)
        pa0 = node(tuple(W + A * hl * .2), (T['wr'] * H * 1.05, T['wr'] * H * .62)); pa = node(tuple(W + A * hl * .42), (fw * 1.0, T['wr'] * H * .6)); E += [(wr, pa0), (pa0, pa)]
        tips = []
        for f in range(4):
            off = (f - 1.45) * fw * .36; L = .92 * hl * (.55 if f in (1, 2) else .5 if f == 0 else .42) * .5
            b0 = W + A * hl * .55 + side * off; ids = [node(tuple(b0), fw * .26)]; p = b0.copy(); d = A.copy()
            for k in range(3):
                d = (d + Vector((-s * .06 * (k + 1), 0, 0))).normalized(); p = p + d * L * (1 - .18 * k); ids.append(node(tuple(p), fw * (.235 - .03 * k)))
            E.append((pa, ids[0])); chain(ids); tips.append(p)
        tb0 = W + A * hl * .28 + side * fw * .62 + Vector((-s * .01 * H / 1.45, 0, 0)); tb1 = tb0 + (A * .45 + side * .75 + Vector((-s * .25, 0, 0))).normalized() * hl * .24
        tb2 = tb1 + (A * .8 + side * .3 + Vector((-s * .35, 0, 0))).normalized() * hl * .2
        t0 = node(tuple(tb0), fw * .36); t1 = node(tuple(tb1), fw * .3); t2 = node(tuple(tb2), fw * .25); E.append((pa0, t0)); chain([t0, t1, t2])
        D.HANDS[s] = dict(W=W, tips=tips, thumb=tb2)
        # Bein
        Hp, K, A_ = Lr(D.HIP, s), Lr(D.KNEE, s), Lr(D.ANK, s)
        h0 = node(tuple(Hp + Vector((0, 0, .012 * H))), T['thigh'] * H * 1.18)
        th = [node(tuple(Hp.lerp(K, k)), T['thigh'] * H * (1.06 - .36 * k)) for k in (.3, .66)]
        kn = node(tuple(K), T['knee'] * H * 1.1); sh_ = [node(tuple(K.lerp(A_, k)), T['calf'] * H * (1.12 - .45 * k)) for k in (.28, .62)]
        an = node(tuple(A_), T['ank'] * H * 1.1)
        chain([pel, h0] + th + [kn] + sh_ + [an])
    body = skin_body('Koerper', N, E, R, root=pel, sub=1, branch_smooth=.35)
    deform(body, body_shape); return body

def torso_prof(z):
    """(halbe Breite, halbe Tiefe, Vorwärtsversatz) des Rumpfes bei Höhe z"""
    T = D.T; H = D.H; hz, sz = D.HIP.z, D.SH.z; u = (z - hz) / (sz - hz)
    pw, pd = T['pelv'][0] * H, T['pelv'][1] * H; ww, wd = T['waist'][0] * H, T['waist'][1] * H; cw, cd = T['chest'][0] * H, T['chest'][1] * H
    if u < .38: k = ss(0, .38, u); w = lerp(pw, ww, k); d = lerp(pd, wd, k)
    elif u < .78: k = ss(.38, .78, u); w = lerp(ww, cw, k); d = lerp(wd, cd, k)
    else: k = ss(.78, 1.06, u); w = lerp(cw, cw * .78, k); d = lerp(cd, cd * .7, k)
    off = -T['belly'] * .02 * H * gauss((u - .3) ** 2, .14) - T['bust'] * .016 * H * gauss((u - .74) ** 2, .07)
    return w, d, off
def body_shape(p):
    p = p.copy(); T = D.T; H = D.H; ac = arm_coord(p); hz, sz = D.HIP.z, D.SH.z
    if not ac and hz - .08 * H < p.z < D.NECK0.z + .01 * H:
        w, d, off = torso_prof(p.z); rn = float(np.interp(p.z, D.TRZ, D.TRR))
        bl = (1 - ss(sz - .015 * H, sz + .035 * H, p.z)) * ss(hz - .07 * H, hz + .01 * H, p.z)
        p.x *= lerp(1, w / rn, bl); p.y *= lerp(1, d / rn, bl); p.y += .006 * H * T['stoop'] * ss(hz, sz, p.z)
        if p.y < 0: p.y += off * ss(.0, .5, -p.y / (d + 1e-4))
        if T['bust'] and p.y < 0: p.y -= T['bust'] * .018 * H * gauss((abs(p.x) - .045 * H) ** 2 + ((p.z - lerp(hz, sz, .74)) * 1.3) ** 2, .035 * H) * bl
        if p.y > 0 and p.z < hz + .1 * H: p.y += .016 * H * gauss((p.z - (hz + .02 * H)) ** 2, .05 * H) * ss(.0, .04 * H, abs(p.x)) * (1.2 if T['fem'] else 1)  # Gesäß
        if p.y > 0 and p.z > lerp(hz, sz, .7): p.y += .007 * H * gauss((p.z - lerp(hz, sz, .85)) ** 2, .05 * H)                  # Schulterblätter
        if T['stoop'] and p.y > 0: p.y += .014 * H * gauss((p.z - lerp(hz, sz, .9)) ** 2, .07 * H)                             # Rundrücken
    if ac and ac[1] < .02 * H:   # Schulter/Deltoid rund
        s, t, rr = ac; p.z += .004 * H * (1 - ss(-.03 * H, .02 * H, t))
    # Trapez: Hals → Schulter schräg (kein Kleiderbügel)
    if not ac and p.z > sz - .02 * H and abs(p.x) > T['neck'] * H:
        k = ss(T['neck'] * H, D.SH.x, abs(p.x)); p.z += .012 * H * (1 - k) * ss(sz - .02 * H, sz + .01 * H, p.z)
    # Wade, Knie
    if D.ANK.z + .02 * H < p.z < D.KNEE.z and abs(p.x) > .015 * H:
        s, t, c = leg_coord(p)
        if p.y > c.y - .005 * H: p.y += .012 * H * gauss((p.z - lerp(D.KNEE.z, D.ANK.z, .3)) ** 2, .06 * H)
    if abs(p.z - D.KNEE.z) < .04 * H and p.y < 0: p.y -= .004 * H * gauss((p.z - D.KNEE.z - .01 * H) ** 2, .02 * H)
    return p

# =====================================================================
# Kopf + Gesicht
# =====================================================================
def _pw(z, pts):
    """stückweise glatte Interpolation (z aufsteigend) – Profilfaktoren des Kopfes"""
    zs = [p[0] for p in pts]; vs = [p[1] for p in pts]
    if z <= zs[0]: return vs[0]
    for i in range(len(zs) - 1):
        if z <= zs[i + 1]: t = ss(zs[i], zs[i + 1], z); return lerp(vs[i], vs[i + 1], t)
    return vs[-1]
def head_shape(u):
    """Einheitskugel → Kopf mit Profil: Schädel oben/hinten voll, Wangenknochen, Kieferwinkel, Kinn, flache Gesichtsebene, Nase, Lippen, Augenmulden"""
    x, y, z = u.x, u.y, u.z; kid = D.kid; fem = D.fem; hw, hh, hd = D.hw, D.hh, D.hd
    rho = math.sqrt(max(1e-9, 1 - z * z)); cx, cy = x / rho, y / rho
    jw = .8 if kid else .76 if fem else .83; ch = .48 if kid else .44 if fem else .54
    fw = _pw(z, [(-.95, ch), (-.62, jw), (-.28, .97), (0, 1.0), (.5, 1.0), (.8, .96)])
    ff = _pw(z, [(-.95, 1.0), (-.72, 1.06 if not kid else 1.02), (-.4, 1.0), (-.12, .93), (.22, .98), (.6, .93)])
    fb = _pw(z, [(-.9, .45), (-.6, .7), (-.3, .98), (.1, 1.12), (.45, 1.06), (.8, .98)])
    # vorn flacher (Gesichtsebene, klare Wangenflächen), hinten rund
    if cy < 0:
        flat = .32 * ss(.62, -.2, z) * ss(-1.0, -.75, z) if True else 0
        cyf = -(abs(cy) ** (1 - flat)); Y = cyf * rho * ff * hd
    else: Y = cy * rho * fb * hd
    X = cx * rho * fw * hw; Z = z * hh
    fz = -cy if cy < 0 else 0; frontal = ss(.35, .9, fz)
    if z < -.6: Z -= hh * .05 * ss(-.6, -.95, z) * ss(.3, -.6, cy)                               # Kinnunterseite flach zum Hals
    for s in (-1, 1):
        xe = x / max(.2, fw)
        dc = (x - s * .55) ** 2 + ((z + .32) * 1.1) ** 2
        Y -= hd * (.06 if kid else .03) * gauss(dc, .2) * frontal; X += s * hw * (.045 if kid else .04) * gauss(dc, .21)   # Wangen / Jochbein
        de = (x - s * D.EYE_X) ** 2 + ((z - D.EYE_Z) * 1.2) ** 2
        Y += hd * .04 * gauss(de, .15) * frontal                                                 # Augenmulde
        db = (x - s * .38) ** 2 + ((z - (D.EYE_Z + .27)) * 2.4) ** 2
        Y -= hd * (.018 if kid else .028) * gauss(db, .17) * frontal                               # Brauenbogen
        dt = (x - s * .085) ** 2 * 1.4 + ((z + .36) / .9) ** 2
        Y -= hd * .02 * gauss(dt, .04) * frontal                                                # Nasenflügel
    nk = .5 if kid else .75 if not fem else .55
    dn = (x / .07) ** 2 + ((z + .1) / .22) ** 2
    Y -= hd * .045 * nk * math.exp(-dn) * ss(.8, .98, fz) * ss(.18, -.12, z)                     # Nasenrücken
    dt = (x / .085) ** 2 + ((z + .3) / .085) ** 2
    Y -= hd * .085 * nk * math.exp(-dt) * ss(.78, .98, fz)                                         # Nasenspitze
    dl = (x / .19) ** 2 + ((z - D.MZ - .06) / .05) ** 2; Y -= hd * .016 * math.exp(-dl) * ss(.78, .98, fz)   # Oberlippe
    dl = (x / .16) ** 2 + ((z - D.MZ + .08) / .055) ** 2; Y -= hd * .02 * math.exp(-dl) * ss(.78, .98, fz)   # Unterlippe
    dl = (x / .14) ** 2 + ((z - D.MZ + .2) / .06) ** 2; Y += hd * .012 * math.exp(-dl) * ss(.78, .98, fz)    # Kinnmulde
    return Vector((X, Y, Z)) + D.HC

_BVH = {}
def surf(xn, zn):
    """Punkt + Normale auf der Gesichtsfläche (normierte x, z) – Strahl von vorn"""
    b = _BVH['head']; o = Vector((xn * D.hw * (1 - .2 * ss(-.08, -.95, zn)), D.HC.y - 1, D.HC.z + zn * D.hh)); hit = b.ray_cast(o, Vector((0, 1, 0)))
    return hit[0], hit[1]
def head_dir_point(d, extra):
    q = head_shape(d) - D.HC; return D.HC + q * (1 + extra / q.length)
def sdir(th, ph): return Vector((math.sin(th) * math.sin(ph), -math.sin(th) * math.cos(ph), math.cos(th)))

def th_u(ph):   # Oberlid-Kante (Grad) über dem Augenwinkel ph (+ = außen); Mandelform, außen leicht angehoben
    k = ss(0, 1, abs(ph) / 50.0); return D.LID_U * (1 - k ** 1.8) + (6 if ph > 0 else -2) * k
def th_l(ph):
    k = ss(0, 1, abs(ph) / 50.0); return -D.LID_L * (1 - k ** 1.6) + (5 if ph > 0 else 0) * k

def build_head():
    sp = D.spec; F = sp.get('gesicht', {})
    D.EYE_X = F.get('augen_x', .47 if D.kid else .45); D.EYE_Z = F.get('augen_z', -.14 if D.kid else -.08); D.MZ = F.get('mund_z', -.6 if D.kid else -.63)
    D.RE = D.hw * F.get('auge_r', .335 if D.kid else .29) * (1.0 if 'auge_r' not in F else 1.12) * 1.2; D.LID_U = F.get('lid_o', 38 if D.kid else 33); D.LID_L = F.get('lid_u', 28 if D.kid else 24)
    D.IRIS = F.get('iris', .55 if D.kid else .5)
    head = quad_sphere('Kopf', 8); subsurf(head, 1); deform(head, lambda v: head_shape(v.normalized())); smooth(head); set_region(head, 'haut_kopf')
    _BVH['head'] = BVHTree.FromObject(head, bpy.context.evaluated_depsgraph_get())
    parts = {'head': head, 'ears': [], 'lids': [], 'brows': [], 'eyes': [], 'mouth': [], 'nose': []}
    # Ohren
    for s in (-1, 1):
        def ef(v, q, s=s):
            cup = .55 * math.exp(-((v.y * 1.3) ** 2 + (v.z * 1.0) ** 2) * 2.2) if v.x * s > 0 else 0
            return Vector((q.x * (1 - cup), q.y, q.z + .004 * v.y))
        e = blob('Ohr', (s * D.hw * .9, D.HC.y + .2 * D.hd, D.HC.z - .06 * D.hh), (.1 * D.hw, .18 * D.hw, .29 * D.hh), 3, ef, (0, 0, s * math.radians(-16)))
        set_region(e, 'haut_kopf'); parts['ears'].append(e)
    # Augen: Augapfel (eigenes Netz, Pol nach vorn) + Lidschalen (Mandelform, dicke Lidlinie oben, Wimpernflügel außen)
    D.EYES = {}
    for s in (-1, 1):
        p, n = surf(s * D.EYE_X, D.EYE_Z); fwd = Vector((s * .14, -1, .02)).normalized(); RE = D.RE
        C = p - fwd * (RE - .07 * RE); D.EYES[s] = (C, fwd)
        r = Vector((0, 0, 1)).cross(fwd).normalized() * s; u = fwd.cross(r).normalized()
        if u.z < 0: u = -u
        def sp_(ph, th, R, C=C, fwd=fwd, r=r, u=u): a, b = math.radians(ph), math.radians(th); return C + (fwd * (math.cos(b) * math.cos(a)) + r * (math.cos(b) * math.sin(a)) + u * math.sin(b)) * R
        bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=14, v_segments=10, radius=RE)
        eo = obj_bm('Auge', bm); M = Matrix((r, u, fwd)).transposed().to_4x4(); M.translation = C; eo.data.transform(M); orient_out(eo, C); smooth(eo); set_region(eo, 'auge')
        uv = eo.data.uv_layers.new(name='UVMap')
        for l in eo.data.loops:
            q = eo.data.vertices[l.vertex_index].co - C
            uv.data[l.index].uv = (.25 + .25 * q.dot(r) / RE * s * .98, .5 + .5 * q.dot(u) / RE * .98)
        parts['eyes'].append(eo)
        NPH, NT = 14, 4
        for which in ('o', 'u'):
            V, Fc, R_ = [], [], []
            for i in range(NPH + 1):
                ph = -80 + 160 * i / NPH; e0 = th_u(ph) if which == 'o' else th_l(ph)
                for j in range(NT + 1):
                    t = j / NT; th = (e0 + (80 - e0) * t ** 1.25) if which == 'o' else (e0 + (-74 - e0) * t ** 1.25)
                    V.append(sp_(ph, th, RE * (1.045 + .03 * t) + (.0012 if which == 'o' and j == 0 else 0)))
            for i in range(NPH):
                for j in range(NT):
                    a = i * (NT + 1) + j; Fc.append((a, a + NT + 1, a + NT + 2, a + 1) if which == 'o' else (a, a + 1, a + NT + 2, a + NT + 1))
                    phc = -80 + 160 * (i + .5) / NPH
                    R_.append('lidlinie' if (which == 'o' and j <= 1 and not (j == 1 and phc < -30)) or (which == 'u' and j == 0 and phc > 22) else 'lid')
            base = len(V)
            for i in range(NPH + 1):
                ph = -80 + 160 * i / NPH; e0 = th_u(ph) if which == 'o' else th_l(ph); V.append(sp_(ph, e0 + (-3 if which == 'o' else 2.5), RE * .985))
            for i in range(NPH):
                a = i * (NT + 1); b = (i + 1) * (NT + 1)
                Fc.append((base + i, base + i + 1, b, a) if which == 'o' else (a, b, base + i + 1, base + i)); R_.append('lidlinie' if which == 'o' else 'lid')
            lo = obj_data('Lid_' + which, V, Fc)
            for nm in ('lid', 'lidlinie'): lo.data.materials.append(REG[nm]['mat'])
            for pg, rn in zip(lo.data.polygons, R_): pg.material_index = 0 if rn == 'lid' else 1
            orient_out(lo, C); smooth(lo)
            vg = lo.vertex_groups.new(name='lid_%s_%s' % (which, 'L' if s > 0 else 'R')); vg.add(list(range(len(V))), 1, 'REPLACE'); parts['lids'].append(lo)
        # Lidlinie verdickt + Wimpernflügel außen (zwei kleine Spitzen)
        W0 = [sp_(84 - k * 16, th_u(min(84 - k * 16, 70)) + 3.5 + 6 * ss(60, 84, 84 - k * 16), RE * 1.1) for k in range(10)]
        wo = loft('Lidstrich', W0, lambda t: RE * .26 * ss(0, .3, t) ** .7 * (1 - .55 * ss(.75, 1, t)) + RE * .02, lambda t: RE * .07, ring=4, n=12, flat_up=tuple(u)); set_region(wo, 'lidlinie')
        vg = wo.vertex_groups.new(name='lid_o_%s' % ('L' if s > 0 else 'R')); vg.add(list(range(len(wo.data.vertices))), 1, 'REPLACE'); parts['lids'].append(wo)
        for k, (a0, l) in enumerate(()):
            P0 = [sp_(a0 + j * 6, th_u(a0) + 2 + j * 4.5, RE * (1.07 + j * .05)) for j in range(4)]
            wk = loft('Wimper', P0, lambda t, l=l: RE * .07 * (1 - t) * l + RE * .01, lambda t: RE * .025, ring=4, n=5, flat_up=tuple(u)); set_region(wk, 'lidlinie')
            vg = wk.vertex_groups.new(name='lid_o_%s' % ('L' if s > 0 else 'R')); vg.add(list(range(len(wk.data.vertices))), 1, 'REPLACE'); parts['lids'].append(wk)
    # Brauen
    bz = D.EYE_Z + F.get('braue_z', .3 if D.kid else .28) - .02; bw = F.get('braue_w', .9) * .72
    for s in (-1, 1):
        pts = []
        for k in range(6):
            xn = s * (D.EYE_X - .2 + k * .085); zn = bz + .06 * math.sin(k / 5 * math.pi * .9) - .02 * (k / 5) ** 2
            p, n = surf(xn, zn); pts.append(p + n * .0013)
        bo = loft('Braue', pts, lambda t: D.hw * .045 * bw * (1 - .6 * t ** 1.4) * (.7 + .3 * ss(0, .2, t)), lambda t: D.hw * .011, ring=4, n=9, flat_up=(0, -1, 0))
        set_region(bo, 'braue'); bo['side'] = s; parts['brows'].append(bo)
    # Nase: kleine Spitze + Nasenflügel als Form (Region 'nase' für Schattierung)
    # Mund: Linie + Mundhöhlen-Aufkleber (öffnet per Shape Key)
    mw = F.get('mund_w', .3 if D.kid else .32); D.MW = mw
    mpts = []
    for k in range(9):
        t = 2 * k / 8 - 1; xn = t * mw / 2; zn = D.MZ + F.get('mund_laune', .025) * t * t - .006 * (1 - t * t)
        p, n = surf(xn, zn); mpts.append(p + n * .0008)
    ml = loft('Mundlinie', mpts, lambda t: D.hw * .011 * (1 - .6 * abs(2 * t - 1) ** 2), lambda t: D.hw * .004, ring=4, n=13, flat_up=(0, -1, 0)); set_region(ml, 'mundlinie')
    parts['mouth'].append(ml)
    MD = []; MF = []; MUV = []
    for j in range(5):
        for i in range(9):
            xn = (i / 8 - .5) * mw * 1.05; p, n = surf(xn, D.MZ); MD.append(p + n * .001); MUV.append((.5 + .5 * i / 8, .5 * j / 4))
    for j in range(4):
        for i in range(8):
            a = j * 9 + i; MF.append((a, a + 1, a + 10, a + 9))
    md = obj_data('Mundhoehle', MD, MF); set_region(md, 'mund_innen'); uvl = md.data.uv_layers.new(name='UVMap')
    for l in md.data.loops: uvl.data[l.index].uv = MUV[l.vertex_index]
    gr = md.vertex_groups.new(name='mund_reihe'); gc = md.vertex_groups.new(name='mund_spalte')
    for vi in range(len(MD)): gr.add([vi], (vi // 9 + 1) / 5, 'REPLACE'); gc.add([vi], (vi % 9 + 1) / 9, 'REPLACE')
    parts['mouth'].append(md)
    return parts

# =====================================================================
# Haare
# =====================================================================
def hair_cap(hairline, extra=.008, U_=8, V_=28, wav=.003):
    """Kappe über dem Schädel bis zum Haaransatz; hairline(ph) → max. Polwinkel"""
    CV = []; CF = []
    for i in range(U_ + 1):
        for j in range(V_):
            ph = j / V_ * 2 * math.pi; th = hairline(ph) * (i / U_) ** .9
            cl = wav * math.sin(ph * 11 + i * 1.7) * ss(.25, 1, i / U_) * ss(.4, -.2, math.cos(ph))
            CV.append(head_dir_point(sdir(th, ph), extra + .004 * (1 - (i / U_) ** 2) + cl))
    for i in range(U_):
        for j in range(V_):
            j1 = (j + 1) % V_; CF.append((i * V_ + j, i * V_ + j1, (i + 1) * V_ + j1, (i + 1) * V_ + j))
    cap = obj_data('Haarkappe', CV, CF); smooth(cap); set_region(cap, 'haar'); return cap
def clump(P, w, d, region='haar', ring=6, n=8, up=None, tipw=.0005, shape=2.6):
    """Haarbüschel entlang P: linsenförmiger Querschnitt, breit am Ansatz, spitz zulaufend"""
    up = up or tuple((Vector(P[0]) - D.HC).normalized())
    w = w * 1.18; d = d * 1.9; tipw = max(tipw, w * .12); o = loft('Bueschel', P, lambda t: w * (1 - t ** shape) * (.6 + .4 * ss(0, .22, t)) + tipw, lambda t: d * (1 - t ** 1.3) + tipw * .6, ring=ring, n=n, flat_up=up)
    set_region(o, region); return o
def flow(ph0, th0, th1, swirl, w, d, lift=.012, base=.01, flick=.01, n=8, curl=0., region='haar'):
    P = []
    for k in range(n):
        t = k / (n - 1); th = lerp(th0, th1, t); ph = ph0 + swirl * t * t
        off = base + lift * math.sin(min(1, t * 1.6) * math.pi / 2) * (1 - .5 * t) + flick * ss(.65, 1, t)
        q = head_dir_point(sdir(th, ph), off)
        if curl: q += Vector((0, 0, curl * ss(.6, 1, t)))
        P.append(q)
    return clump(P, w, d, region=region, n=n)

def hairline_std(fr=1.0, side=1.6, back=2.05):
    def f(ph):
        c = math.cos(ph); return lerp(lerp(side, fr, ss(0, 1, c)), back, ss(-.1, -1, c))
    return f

def build_hair(style):
    H = D.H; hw = D.hw; out = []; rnd = random.Random(7); k = D.hh / .127   # Maßstab relativ zum Kinderkopf
    if style == 'wuschel':            # Noa: verwuschelt, Pony schräg, Spitzen nach außen – breite, dicke Büschel (geschlossene Masse)
        hl = hairline_std(1.12, 1.62, 2.1); out.append(hair_cap(hl, .01 * k))
        for i in range(7):
            a = (i - 3) / 3; ph = a * .78 + rnd.uniform(-.04, .04)
            out.append(flow(ph * .55 - .06, .15, 1.33 - .1 * abs(a) ** 2 + rnd.uniform(-.02, .02), ph * .12 - .12 + rnd.uniform(-.04, .04), .08 * k, .02 * k, lift=.014 * k, base=.012 * k, flick=.003 * k))
        for i in range(10):
            ph = 1.3 + i / 9 * (2 * math.pi - 2.6)
            out.append(flow(ph + rnd.uniform(-.05, .05), .35, hl(ph) + .1 + rnd.uniform(-.03, .06), rnd.uniform(-.2, .2), .085 * k, .022 * k, lift=.018 * k, base=.013 * k, flick=.016 * k + .006 * k * (i % 2)))
        for s_ in (-1, 1):   # Strähne vor dem Ohr
            out.append(flow(s_ * 1.12, .55, 1.55, s_ * .05, .06 * k, .016 * k, lift=.01 * k, base=.011 * k, flick=.01 * k))
        for i in range(7):
            ph = i / 7 * 2 * math.pi + .3
            out.append(flow(ph, .04, .66 + rnd.uniform(0, .2), rnd.uniform(-.35, .35), .08 * k, .022 * k, lift=.026 * k, base=.018 * k, flick=.02 * k))
    elif style == 'stachel':          # Rayan: kräftige Stacheln nach hinten/oben, zwei Strähnen in die Stirn
        hl = hairline_std(.95, 1.55, 2.0); out.append(hair_cap(hl, .01 * k))
        for i in range(14):
            ph = (i / 14) * 2 * math.pi + .22; th0 = .15 + .25 * rnd.random(); b = head_dir_point(sdir(th0, ph), .012 * k)
            dirv = (sdir(th0 + .7, ph) - sdir(th0, ph)).normalized() * .6 + Vector((0, .55, .5)).normalized() * .7
            if math.cos(ph) > .5: dirv = (dirv + Vector((0, .2, .5))).normalized()
            L = (.11 + .05 * rnd.random()) * k
            P = [b, b + dirv * L * .4 + (b - D.HC).normalized() * .012 * k, b + dirv * L * .8 + Vector((0, .01, .02)) * k, b + dirv * L * 1.15 + Vector((0, .02, .015)) * k]
            out.append(clump(P, .052 * k, .024 * k, n=7, shape=1.1))
        for i in range(9):
            ph = .9 + i / 8 * (2 * math.pi - 1.8)
            out.append(flow(ph, .35, hl(ph) + .16, rnd.uniform(-.2, .2), .06 * k, .016 * k, lift=.014 * k, base=.012 * k, flick=.02 * k))
        for i, (ph, th1) in enumerate(((-.25, 1.2), (.1, 1.12), (.42, 1.25))):
            out.append(flow(ph, .25, th1, .25, .05 * k, .013 * k, lift=.016 * k, base=.012 * k, flick=.012 * k))
    elif style in ('dutt', 'dutt_lose'):   # glatt nach hinten, Dutt am Hinterkopf, zwei lose Strähnen vorn
        hl = hairline_std(1.02, 1.62, 2.12); out.append(hair_cap(hl, .007 * k, wav=.0015))
        for i in range(16):
            ph = i / 16 * 2 * math.pi
            out.append(flow(ph, .1, hl(ph) - .05, 0, .07 * k, .01 * k, lift=.006 * k, base=.008 * k, flick=.0, n=7))
        bc = head_dir_point(sdir(.95, math.pi), .04 * k); R_ = .055 * k
        for i in range(7):
            a = i / 7 * 2 * math.pi; P = [bc + Vector((math.cos(a + t * 2.2) * R_ * (1 - .5 * t), .02 * k * math.sin(t * 3), math.sin(a + t * 2.2) * R_ * (1 - .5 * t))) for t in (0, .3, .6, .9)]
            out.append(clump(P, .05 * k, .026 * k, n=6))
        o = blob('Dutt', bc + Vector((0, .006 * k, 0)), (R_ * .9, R_ * .7, R_ * .85), 3); set_region(o, 'haar'); out.append(o)
        if style == 'dutt_lose':
            for s in (-1, 1):
                b = head_dir_point(sdir(1.0, s * .9), .01 * k)
                out.append(clump([b, b + Vector((s * .01, -.012, -.05)) * k, b + Vector((s * .014, -.016, -.11)) * k, b + Vector((s * .008, -.01, -.16)) * k], .03 * k, .01 * k, n=7))
    elif style == 'wolke':            # Prof.: hohe Stirn, weiße Wolken-Büschel seitlich + hinten, oben dünn
        hl = hairline_std(.7, 1.55, 2.1); out.append(hair_cap(hl, .006 * k, wav=.002))
        for i in range(13):
            ph = .7 + i / 12 * (2 * math.pi - 1.4); th = 1.15 + .25 * rnd.random()
            c = head_dir_point(sdir(th, ph), .022 * k); r = (.045 + .015 * rnd.random()) * k
            o = blob('Wolke', c, (r * 1.25, r * .95, r * .9), 4, lambda v, q: q * (1 + .05 * math.sin(v.x * 5 + v.z * 4))); set_region(o, 'haar'); out.append(o)
        for i in range(6):
            ph = i / 6 * 2 * math.pi; out.append(flow(ph, .05, .55, .5, .045 * k, .012 * k, lift=.02 * k, base=.012 * k, flick=.02 * k, curl=.01 * k))
    elif style == 'kurz':             # kurz, ordentlich, Seitenscheitel
        hl = hairline_std(1.05, 1.58, 2.0); out.append(hair_cap(hl, .009 * k, wav=.002))
        for i in range(7):
            a = (i - 3) / 3; out.append(flow(a * .7 + .25, .2, 1.05 + .05 * abs(a), .5, .065 * k, .014 * k, lift=.02 * k, base=.012 * k, flick=.004 * k))
        for i in range(10):
            ph = 1.0 + i / 9 * (2 * math.pi - 2.0); out.append(flow(ph, .35, hl(ph) + .05, .1, .07 * k, .012 * k, lift=.01 * k, base=.01 * k, flick=.004 * k))
    elif style == 'pferd':            # Pferdeschwanz hoch hinten, Pony seitlich
        hl = hairline_std(1.0, 1.6, 2.1); out.append(hair_cap(hl, .008 * k, wav=.0015))
        for i in range(14):
            ph = i / 14 * 2 * math.pi; out.append(flow(ph, .12, hl(ph) - .03, -.15 * math.sin(ph), .07 * k, .011 * k, lift=.008 * k, base=.009 * k, n=7))
        for i in range(4):
            out.append(flow(-.55 + i * .25, .3, 1.22, .35, .055 * k, .012 * k, lift=.014 * k, base=.011 * k, flick=.008 * k))
        b = head_dir_point(sdir(.75, math.pi), .02 * k)
        for i in range(5):
            o = (i - 2) * .012 * k
            P = [b + Vector((o, 0, 0)), b + Vector((o * 1.2, .05, -.05)) * 1, b + Vector((o * 1.4, .07, -.15)) * 1, b + Vector((o * 1.2, .05, -.25)) * 1, b + Vector((o * .6, .03, -.31))]
            P = [b + (q - b) * k for q in P]
            out.append(clump(P, .045 * k, .02 * k, n=9))
        o = blob('Haargummi', b + Vector((0, .012, -.02)) * k, (.022 * k, .018 * k, .02 * k), 2); set_region(o, 'knopf'); out.append(o)
    elif style == 'locken_kurz':      # ältere Frau: kurze, lockige Frisur (Büschel-Kugeln)
        hl = hairline_std(1.0, 1.55, 2.0); out.append(hair_cap(hl, .012 * k, wav=.004))
        for i in range(26):
            th = .2 + rnd.random() * 1.6; ph = rnd.random() * 2 * math.pi
            if th > hl(ph) - .05: th = hl(ph) - .08
            c = head_dir_point(sdir(th, ph), .022 * k); r = (.032 + .012 * rnd.random()) * k
            o = blob('Locke', c, (r, r, r * .85), 2); set_region(o, 'haar'); out.append(o)
    elif style == 'muetze':           # unter einer Mütze: nur Ansatz vorn/seitlich und Nacken
        hl = hairline_std(1.05, 1.6, 2.05); out.append(hair_cap(hl, .006 * k))
        for i in range(5):
            a = (i - 2) / 2; out.append(flow(a * .55, .75, 1.18 + .04 * abs(a), .1, .06 * k, .012 * k, lift=.006 * k, base=.01 * k, flick=.006 * k))
        for i in range(8):
            ph = 1.1 + i / 7 * (2 * math.pi - 2.2); out.append(flow(ph, .9, hl(ph) + .12, .1, .07 * k, .013 * k, lift=.006 * k, base=.01 * k, flick=.012 * k))
    return out

def build_beard(kind):
    """Bart als geschlossene Schale über Kiefer/Kinn (Mund bleibt frei) + Schnurrbart aus zwei Büscheln"""
    out = []; k = D.hh / .12
    if kind in ('vollbart', 'kurzbart'):
        L = 1.0 if kind == 'vollbart' else .45; U_, V_ = 7, 18; CV = []; CF = []
        for i in range(U_ + 1):
            for j in range(V_ + 1):
                ph = (-1 + 2 * j / V_) * 1.75; a = abs(ph)
                th0 = lerp(2.62, 1.98, ss(.35, .75, a)); th1 = math.pi * .995
                th = lerp(th0, th1, i / U_); off = (.006 + .012 * L * (i / U_) ** .7 * (1 - .5 * ss(1.2, 1.75, a))) * k
                q = head_dir_point(sdir(th, ph), off)
                if i == U_: q += Vector((0, -.012 * L, -.035 * L * (1 - ss(.0, 1.3, a)))) * k
                CV.append(q)
        for i in range(U_):
            for j in range(V_): a = i * (V_ + 1) + j; CF.append((a, a + 1, a + V_ + 2, a + V_ + 1))
        o = obj_data('Bart', CV, CF); smooth(o); orient_out(o, D.HC); set_region(o, 'bart'); mod(o, 'SOLIDIFY', thickness=.004 * k, offset=-1); apply_mods(o); smooth(o); out.append(o)
    if kind in ('vollbart', 'schnurr', 'kurzbart'):
        for s in (-1, 1):
            P = []
            for j in range(5):
                xn = s * (.02 + j * .075); p, n = surf(xn, D.MZ + .08 - .035 * (j / 4) ** 2); P.append(p + n * .006 * k + Vector((0, 0, -.006 * (j / 4) ** 2)) * k)
            out.append(clump(P, .022 * k, .009 * k, region='bart', n=7, up=(0, -1, 0)))
    return out

# =====================================================================
# Kleidung
# =====================================================================
def body_cover(p, spec):
    """Was liegt eng auf dem Körper? → 'top' | 'hose' | 'socke' | None, plus Parameter"""
    K = spec['kleidung']; H = D.H; ac = arm_coord(p); top = K.get('top'); bot = K.get('unten')
    L = D.L_UA + D.L_FA
    if ac and ac[1] > 0:
        if top and ac[1] < top['arm'] * L: return 'top'
        return None
    if p.z > D.NECK0.z - .005 * H and (math.hypot(p.x, p.y - D.NECK0.y) < D.T['neck'] * H * 1.22 or p.z > D.CHIN): return None
    if top and p.z > top['saum'] * H: return 'top'
    if bot and p.z > bot.get('bis', .0) * H and p.z < bot.get('bund', .6) * H + .004 * H: return 'hose'
    if top and p.z > top['saum'] * H - .002 * H: return 'top'
    if K.get('socken') and p.z < D.ANK.z + K['socken'] * H: return 'socke'
    return None

def dress_body(body, spec):
    """Enge Kleidung als Formung des Körpers (Stoffdicke, modellierte Falten), Regionen je Fläche"""
    K = spec['kleidung']; H = D.H; top = K.get('top') or {}; bot = K.get('unten') or {}; L = D.L_UA + D.L_FA
    def f(p):
        c = body_cover(p, spec); q = p.copy()
        if c == 'top':
            ac = arm_coord(p)
            if ac and ac[1] > 0:
                s, t, rr = ac; S = Lr(D.SH, s); A = Lr(D.ARM, s); n = (p - (S + A * t)).normalized(); u = t / L
                arm_end = top['arm']; loose = top.get('weit', .006) * H / 1.45
                off = .005 * H / 1.45 + loose * (.6 + .8 * ss(arm_end - .25, arm_end, u)) * (1 if arm_end < .5 else .7)
                if arm_end > .5:   # lange Ärmel: Ellbogenfalten + Stauchung am Bündchen
                    e = D.L_UA / L; off += .0035 * H / 1.45 * math.sin(t / H * 260) * gauss((u - e) ** 2, .006) + .003 * H / 1.45 * math.sin(t / H * 330 + 1) * ss(arm_end - .12, arm_end - .02, u)
                else: off += .0022 * H / 1.45 * math.sin(math.atan2(n.dot(Vector((0, 1, 0))), n.z) * 5 + t * 90) * ss(.0, arm_end, u)
                q = p + n * off
            else:
                n = Vector((p.x, p.y, 0)); n = n.normalized() if n.length > 1e-6 else Vector((0, -1, 0))
                drape = ss(.72 * H, top['saum'] * H, p.z) * top.get('weit', .006) * H / 1.45 * 1.8
                ang = math.atan2(p.y, p.x); fold = .0028 * H / 1.45 * math.sin(ang * 7 + p.z / H * 40) * ss(.66 * H, top['saum'] * H + .02 * H, p.z)
                fold += .0015 * H / 1.45 * math.sin(ang * 13 + 2) * ss(D.SH.z - .1 * H, D.SH.z, p.z) * (p.y < 0)
                edge = ss(D.T['neck'] * H * 1.22, D.T['neck'] * H * 1.6, math.hypot(p.x, p.y - D.NECK0.y)) if p.z > D.NECK0.z - .03 * H else 1
                q = p + n * (.006 * H / 1.45 + drape + fold) * edge
        elif c == 'hose':
            s, t, ctr = leg_coord(p)
            if p.z > D.HIP.z - .01 * H: n = Vector((p.x, p.y, 0)).normalized()
            else: n = (p - ctr); n.z *= .3; n.normalize()
            weit = bot.get('weit', .006) * H / 1.45
            fold = .0035 * H / 1.45 * math.sin(p.z / H * 150 + s * 2) * (gauss((p.z - D.KNEE.z) ** 2, .035 * H) + 1.6 * ss(D.ANK.z + .1 * H, D.ANK.z + .02 * H, p.z))
            hem = bot.get('bis', 0) * H
            q = p + n * (.0055 * H / 1.45 + weit * (.5 + .7 * ss(D.KNEE.z, hem + .02 * H, p.z) if hem < D.KNEE.z else .4) + fold)
        elif c == 'socke':
            s, t, ctr = leg_coord(p); n = (p - ctr); n.z = 0; n.normalize(); q = p + n * .0025 * H
        return q
    for v in body.data.vertices: v.co = f(v.co.copy())
    body.data.update()
    names = ['haut', 'top', 'hose', 'socke']
    for nm in names:
        if nm in REG: body.data.materials.append(REG[nm]['mat'])
        else: body.data.materials.append(REG['haut']['mat'])
    for pg in body.data.polygons:
        c = body_cover(pg.center, spec); pg.material_index = names.index(c) if c in names else 0

_BVB = {}
def bvh_of(o, key):
    _BVB[key] = BVHTree.FromObject(o, bpy.context.evaluated_depsgraph_get()); return _BVB[key]
def ring_fit(bvh, name, center, axis, w, d, regn, push=.002, n=22, reach=.14, out=None):
    """Saum-Ring, der sich an die Oberfläche legt (Strahlen vom Zentrum)"""
    a = Vector(axis).normalized(); b = a.orthogonal().normalized(); c2 = a.cross(b); pts = []
    for j in range(n):
        t = j / n * 2 * math.pi; dv = b * math.cos(t) + c2 * math.sin(t)
        hit = bvh.ray_cast(Vector(center), dv, reach); pts.append((hit[0] if hit[0] else Vector(center) + dv * reach * .5) + dv * push)
    pts.append(pts[0]); o = loft(name, pts, lambda t: w, lambda t: d, ring=4, n=n + 1, cap0=False, flat_up=tuple(a)); set_region(o, regn)
    if out is not None: out.append(o)
    return o

def loft_rings(name, rings, regn, closed=True, cap=False):
    """Fläche aus Ringen gleicher Punktzahl (Liste von Punktlisten) – für Röcke, Mäntel, Schürzen"""
    V = []; F = []; m = len(rings[0])
    for r in rings: V += [tuple(p) for p in r]
    for i in range(len(rings) - 1):
        for j in range(m if closed else m - 1):
            j1 = (j + 1) % m; F.append((i * m + j, i * m + j1, (i + 1) * m + j1, (i + 1) * m + j))
    o = obj_data(name, V, F); set_region(o, regn); return smooth(o)

def solidify(o, th, offset=-1):
    mod(o, 'SOLIDIFY', thickness=th, offset=offset, use_even_offset=True, use_rim=True); apply_mods(o); return smooth(o)

def skirt(spec, top_z, bot_z, flare, regn, front_gap=0., n=28, rows=7, folds=6, amp=.006, name='Rock', bvh=None, push=.006):
    """Rock/Mantelschoß: Ringe von top_z bis bot_z, Radius = Körper (Strahl) + Ausstellen, Falten radial; front_gap (rad) = offen vorn"""
    H = D.H; rings = []
    a0 = -math.pi / 2 + front_gap / 2; a1 = a0 + 2 * math.pi - front_gap; closed = front_gap <= 0
    for i in range(rows + 1):
        t = i / rows; z = lerp(top_z, bot_z, t); r = []
        for j in range(n if closed else n + 1):
            a = (a0 + (a1 - a0) * j / (n if closed else n)) if not closed else j / n * 2 * math.pi
            dv = Vector((math.cos(a), math.sin(a), 0))
            zz = max(z, D.HIP.z + .02 * H) if t < .35 else z
            w, d, off = torso_prof(min(zz, D.HIP.z + .06 * H)) if zz < D.HIP.z + .06 * H else torso_prof(zz)
            # Körperumfang an den Hüften inkl. Oberschenkeln
            base = Vector((math.cos(a) * w * (1.08 + .1 * ss(top_z, D.HIP.z, z)), math.sin(a) * d * (1.18 + .15 * ss(top_z, D.HIP.z, z)), 0))
            if bvh:
                hit = bvh.ray_cast(Vector((0, 0, max(z, D.HIP.z - .05 * H))), dv, .4)
                if hit[0]: base = Vector((hit[0].x, hit[0].y, 0)) + dv * .002
            fl = flare * H * ss(0, 1, t) ** 1.3
            fo = amp * H * math.sin(a * folds + .7) * ss(.1, 1, t) + amp * .5 * H * math.sin(a * folds * 2.3) * ss(.4, 1, t)
            p = base + dv * (push * H + fl + fo); p.z = z - .006 * H * ss(.6, 1, t) * (1 + math.sin(a * folds + .7))
            r.append(p)
        rings.append(r)
    return loft_rings(name, rings, regn, closed=closed)

def jacket_shell(body, spec, J, regn):
    """Jacke/Kittel: Kopie der Körperflächen im Bereich (Rumpf bis saum, Arme bis arm), nach außen gesetzt, vorn offen, Dicke per Solidify"""
    H = D.H; L = D.L_UA + D.L_FA
    bm = bmesh.new(); bm.from_mesh(body.data); bm.faces.ensure_lookup_table()
    def inside(c):
        ac = arm_coord(c)
        if ac and ac[1] > 0: return ac[1] < J['arm'] * L
        if c.z > D.NECK0.z - .012 * H or c.z < J['saum'] * H: return False
        if J.get('offen') and c.y < 0 and abs(c.x) < J['offen'] * H * (1 + 1.6 * ss(D.SH.z - .1 * H, D.SH.z, c.z)) and c.z < D.SH.z + .01 * H: return False
        if J.get('aermellos') and ac: return False
        return True
    kill = [f for f in bm.faces if not inside(f.calc_center_median())]
    bmesh.ops.delete(bm, geom=kill, context='FACES')
    me = bpy.data.meshes.new('Jacke'); bm.to_mesh(me); bm.free(); o = link(bpy.data.objects.new('Jacke', me))
    o.data.materials.clear(); o.data.materials.append(REG[regn]['mat'])
    for p in o.data.polygons: p.material_index = 0
    th = J.get('abstand', .011) * H / 1.45
    for v in o.data.vertices:
        p = v.co; ac = arm_coord(p)
        if ac and ac[1] > 0:
            s, t, rr = ac; S = Lr(D.SH, s); A = Lr(D.ARM, s); n = (p - (S + A * t)).normalized(); u = t / L
            e = D.L_UA / L
            fold = .004 * H / 1.45 * math.sin(t / H * 230 + s) * gauss((u - e) ** 2, .008) + .003 * H / 1.45 * ss(J['arm'] - .1, J['arm'], u) * math.sin(t / H * 300)
            v.co = p + n * (th * (.8 + .5 * ss(J['arm'] - .3, J['arm'], u)) + fold)
        else:
            n = Vector((p.x, p.y, 0)); n = n.normalized() if n.length > 1e-6 else Vector((0, -1, 0))
            ang = math.atan2(p.y, p.x); drape = ss(.7 * H, J['saum'] * H, p.z) * .006 * H * J.get('weit', 1)
            fold = .003 * H / 1.45 * math.sin(ang * 6 + p.z / H * 25) * ss(.7 * H, J['saum'] * H, p.z)
            if p.z > D.SH.z - .03 * H: n = (n + Vector((0, 0, .5)) * ss(D.SH.z - .03 * H, D.SH.z + .02 * H, p.z)).normalized()
            v.co = p + n * (th + drape + fold)
    o.data.update(); smooth(o)
    mod(o, 'SOLIDIFY', thickness=.004 * H / 1.45, offset=1, use_even_offset=True, use_rim=True); apply_mods(o); smooth(o)
    return o

def shoe(s, kind, col_reg='schuh'):
    H = D.H; A_ = Lr(D.ANK, s); k = H / 1.45; fl = D.FL; out = []
    cy = A_.y - fl * .38; sx = A_.x
    def sf(v, q):
        x, y, z = q.x, q.y, q.z
        if v.y < 0: z *= 1 - .45 * ss(.1, 1, -v.y)
        if v.z < -.3: z = max(z, -.03 * k)
        return Vector((x * (1 + .1 * ss(0, -1, v.y)), y, z))
    up = blob('Schuh', (sx, cy, .048 * k), (.052 * k, fl * .56, .05 * k), 4, sf); set_region(up, col_reg)
    deform(up, lambda p: Vector((p.x, p.y, max(p.z, .012 * k)))); out.append(up)
    so = blob('Sohle', (sx, cy, .013 * k), (.055 * k, fl * .58, .014 * k), 3, lambda v, q: Vector((q.x * (1 + .08 * ss(0, -1, v.y)), q.y, q.z))); set_region(so, 'sohle'); out.append(so)
    if kind == 'stiefel':
        sh = loft('Schaft', [A_ + Vector((0, .004 * k, -.01 * k)), A_ + Vector((0, .003 * k, .06 * k)), A_ + Vector((0, .0, .13 * k))], lambda t: (.04 - .006 * t) * k, lambda t: (.043 - .006 * t) * k, ring=12, n=6, cap0=False)
        set_region(sh, col_reg); out.append(sh)
    return out
