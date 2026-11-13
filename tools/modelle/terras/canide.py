# Glut-Starterlinie (Vorlage Vierbeiner): 001 Funki (Rotfuchs-Welpe, Runde 2) · 002 Loddo (Rotfuchs-Jungtier) · 003 Flammel (Mähnenwolf)
# Eigene Entwürfe nach public/art/001_funki.webp und docs/terras.md. Aufruf: <venv>/bin/python canide.py <001|002|003> <aus.glb> [--form]
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tbau import *
ART = [a for a in sys.argv[1:] if a.isdigit()]; ART = ART[0] if ART else '001'
OUT = [a for a in sys.argv[1:] if a.endswith('.glb')]; OUT = OUT[0] if OUT else '/tmp/t%s.glb' % ART
FORM = '--form' in sys.argv

K = {
 '001': dict(name='t001', bmax=3000, IR=.74, Lb=.17, Lh=.16, Wx=.05, Rb=.084, leg=1.2, HR=(.178, .162, .158), hoff=(-.22, .78), sn=.3, sn_s=.4, RE=.064, eyez=.04, eyex=.42,
             ear=(.13, .068, .045, (.55, .05, .74)), tail=[(0, 0, 0), (0, .07, .03), (0, .13, .1), (0, .155, .19), (0, .14, .28), (0, .1, .34)], tailR=.105,
             fell='#ee6a22', dunkel='#c9481a', creme='#f9e4c4', ohrspitze='#6a2412', bein=None, flame='ball', kragen=False, basalt=False, H=.62,
             iris=('#e07a1a', '#6a2a0c', '#ffc65a'), gang=dict(wL=.09, rL=.17, wLift=.028, rLift=.045, bob=.006)),
 '002': dict(name='t002', Lb=.31, Lh=.28, Wx=.058, Rb=.085, leg=1.0, HR=(.125, .13, .108), hoff=(-.42, .7), sn=.55, sn_s=.28, RE=.031, eyez=.15, eyex=.48,
             ear=(.155, .064, .038, (.52, .1, .8)), tail=[(0, 0, 0), (0, .1, .015), (0, .2, .05), (0, .28, .11), (0, .34, .19), (0, .37, .27)], tailR=.095,
             fell='#ea5a18', dunkel='#b8401a', creme='#f8e0bc', ohrspitze='#3a1a12', bein='#4a1e12', flame='tip', kragen=True, basalt=False, H=.8,
             iris=('#e07a1a', '#7a300c', '#ffd060'), gang=dict(wL=.17, rL=.32, wLift=.045, rLift=.08, bob=.008)),
 '003': dict(name='t003', Lb=.38, Lh=.46, Wx=.064, Rb=.095, leg=.92, HR=(.13, .145, .112), hoff=(-.5, .6), sn=.72, sn_s=.26, RE=.029, eyez=.17, eyex=.46,
             ear=(.19, .072, .04, (.5, .1, .82)), tail=[(0, 0, 0), (0, .1, -.01), (0, .2, -.02), (0, .29, .01), (0, .36, .06), (0, .41, .12)], tailR=.1,
             fell='#de4a1a', dunkel='#a8361a', creme='#f6dcb4', ohrspitze='#2a1612', bein='#2a1a16', flame='tip', kragen=True, basalt=True, H=1.05,
             iris=('#f0a020', '#8a3a0c', '#ffe27a'), gang=dict(wL=.26, rL=.5, wLift=.07, rLift=.12, bob=.01)),
}[ART]
start(K['name'], K['H'])
treg('fell', K['fell']); treg('fell_kopf', K['fell']); treg('creme', K['creme']); treg('ohr_innen', '#f7dcc0'); treg('nase', '#2a1d1d', 'nase')
treg('flamme', '#ffb02a', 'glut'); treg('flamme_kern', '#fff2b0', 'glut', (.15, 0, 0, 1)); treg('pfote', K['creme']); treg('ballen', '#3a2a28', 'haut'); treg('kralle', '#4a3430', 'kralle')
if K['basalt']: treg('basalt', '#3a3232', 'horn'); treg('lava', '#ff7a1a', 'glut')
C.TAILREG = ('flamme', 'flamme_kern')
Lb, Lh, Wx, Rb, lg = K['Lb'], K['Lh'], K['Wx'], K['Rb'], K['leg']
pz = .014 * Lh / .2 + .004
C.SPINE = [V(0, Lb * .55, Lh), V(0, Lb * .225, Lh * 1.05), V(0, -Lb * .125, Lh * 1.075), V(0, -Lb * .425, Lh * 1.12)]
C.NECK = [C.SPINE[3] + V(0, -.032 * Lb / .2, .045 * Lh / .2), C.SPINE[3] + V(0, -.06 * Lb / .2, .095 * Lh / .2)]
C.FL = [V(Wx, -Lb * .42, Lh * 1.07), V(Wx * 1.08, -Lb * .36, Lh * .64), V(Wx * 1.06, -Lb * .45, Lh * .25), V(Wx * 1.06, -Lb * .54, pz)]
C.HL = [V(Wx * 1.1, Lb * .575, Lh * .95), V(Wx * 1.24, Lb * .33, Lh * .58), V(Wx * 1.2, Lb * .66, Lh * .27), V(Wx * 1.16, Lb * .57, pz)]
HR = K['HR']; HC = C.NECK[1] + V(0, K['hoff'][0] * HR[1], K['hoff'][1] * HR[2])
tb = C.SPINE[0] + V(0, .045 * Lb / .2, .012); C.TAIL = [tb + V(*p) * (Lb / .2 if ART != '001' else 1.0) for p in K['tail']]
rk = Rb / .075
# ---------------- Rumpf + Beine (Lofts: glatte Querschnitte, Beine stecken im Rumpf) ----------------
ls = lg * (Lh / .2) ** (.35 if ART != '003' else .18)
tz = lambda p, dz: p + V(0, 0, dz)
TOR = [C.SPINE[0] + V(0, .045 * Lb / .2, .0), C.SPINE[0], C.SPINE[1], C.SPINE[2] + V(0, 0, -.004 * rk), C.SPINE[3] + V(0, 0, -.01 * rk), C.NECK[0] + V(0, -.004, -.01 * rk), C.NECK[1], C.NECK[1] + (HC - C.NECK[1]) * .45]
TR = [(.045 * rk, .045 * rk), (.068 * rk, .066 * rk), (.074 * rk, .07 * rk), (.078 * rk, .076 * rk), (.08 * rk, .084 * rk), (.064 * rk * (1.12 if K['kragen'] else 1), .07 * rk), (.054 * rk * (1.1 if K['kragen'] else 1), .056 * rk), (.05 * rk, .05 * rk)]
body = glied('Rumpf', TOR, TR, ring=20, n=40)
legs = []
for s in (-1, 1):
    F = [S_(p, s) for p in C.FL]; Hh = [S_(p, s) for p in C.HL]
    legs.append(glied('BeinV', [F[0] + V(-F[0].x * .45, .008, .005 * rk), F[0] + V(-F[0].x * .1, 0, -.012 * rk), F[1], F[2], F[3] + V(0, -.002, .008 * ls)], [(.036 * ls, .046 * ls), (.04 * ls, .048 * ls), (.031 * ls, .035 * ls), (.022 * ls, .023 * ls), (.021 * ls, .019 * ls)], ring=12, n=26, flat=(0, -1, 0)))
    legs.append(glied('BeinH', [Hh[0] + V(-Hh[0].x * .45, -.01, .005 * rk), Hh[0] + V(-Hh[0].x * .1, 0, -.01 * rk), Hh[1], Hh[2], Hh[3] + V(0, -.004, .008 * ls)], [(.044 * ls, .056 * ls), (.05 * ls, .06 * ls), (.042 * ls, .05 * ls), (.023 * ls, .025 * ls), (.021 * ls, .019 * ls)], ring=12, n=26, flat=(0, -1, 0)))
def body_shape(p):
    p = p.copy(); y = p.y / (Lb / .2)
    if abs(p.x) < .12 * rk and p.z < Lh and -Lb * .5 < p.y < Lb * .65:
        p.z += .012 * rk * gauss((y - .06) ** 2, .045) * ss(Lh, Lh - .05 * rk, p.z)        # Bauch eingezogen
    return p
deform(body, body_shape)
body = join([body] + legs, 'Rumpf'); set_region(body, 'fell')
BVB = BVHTree.FromObject(body, bpy.context.evaluated_depsgraph_get())
# ---------------- Kopf ----------------
kopf(HC, HR, sn=K['sn'], sn_drop=.1, sn_w=.28, sn_s=K['sn_s'], stirn=.07, mulde=.05, backen=.06 if ART == '001' else .03)
np_, nn = hsurf((0, -1, -.34)); C.NOSE = np_
nose = blob('Nase', np_ + nn * .004 * HR[0] / .12, (.017 * HR[0] / .12, .012 * HR[0] / .12, .011 * HR[0] / .12), 3, lambda v, q: Vector((q.x * (1 - .2 * (v.z < 0)), q.y, q.z * (1 - .25 * (v.z < 0))))); set_region(nose, 'nase'); C.parts_head.append(nose)
hs = HR[0] / .12
# Wangenfell: große, weiche Büschel (Silhouette)
for s in (-1, 1):
    for k in range(4 if ART == '001' else 3):
        p, n = hsurf((s * .95, -.2 + k * .07, -.28 - k * .13), -.012 * hs)
        C.parts_head.append(klumpen(p, n * .6 + V(s * .2, .45 + .1 * k, -.8 - .1 * k), (.07 - .008 * k) * hs * (1.1 if ART == '001' else 1), .03 * hs, 'creme', up=(0, 0, 1), bend=(0, .01 * hs, -.012 * hs)))
for k in range(3):
    a = (k - 1); p, n = hsurf((a * .3, .25, .97), -.012 * hs); C.parts_head.append(klumpen(p, n * .35 + V(a * .3, .95, .05), .05 * hs, .024 * hs, 'fell_kopf', up=tuple(n), dick=.6, bend=(0, .005, -.012 * hs)))
# Ohren: volumetrisch (Rand dick, Innenseite hohl), Innenfell-Büschel, dunkle Spitze (Farbe)
eL, eW, eD, ep = K['ear']
for s in (-1, 1):
    base, bn = hsurf((s * ep[0], ep[1], ep[2]), -.02 * hs); up_ = Vector((s * (.75 if ART == '001' else .5), .14, 1)).normalized(); fw = Vector((s * (.25 if ART == '001' else 0), -1, .15)).normalized()
    C.parts_head.append(ohr(s, base, up_, fw, eL * hs / (HR[0] / .12) * (HR[0] / .12), eW * hs / (HR[0] / .12) * (HR[0] / .12), eD, cup=1.25, regs=('fell_kopf', 'ohr_innen')))
    eb, eu, L, fwv, side = C.EARS[s]
    for k in range(3):
        p0 = eb + eu * (.012 * hs) + fwv * (eD * .1) + side * ((k - 1) * .016 * hs)
        C.parts_head.append(bueschel(p0, eu * .95 + fwv * .35 + side * ((k - 1) * .22), (.05 - .01 * abs(k - 1)) * hs, .022 * hs, 'ohr_innen', up=tuple(fwv), dick=.5))
augen(K['RE'], xn=K['eyex'], yn=-.86, zn=K['eyez'], spread=.3 if ART == '001' else .42, lid_col=K['fell'])
maul(w=.3, z=-.52, smile=.12)
# Stirnflamme (erhabene Flammenzungen, leuchten)
for cx, h_, w_ in ((0, .17, .022), (-.16, .11, .014), (.16, .11, .014)):
    d0 = Vector((cx, -.62, .5)).normalized(); pts = [HC + Vector((cx + (cx * .4 + .03 * math.sin(k * 1.7)) * k / 6, -.62 + .35 * h_ * k / 6 * 2, .5 + h_ * k / 6 * 1.4)).normalized() * max(HR) for k in range(7)]
    pts = auf_kopf(pts, .0018 * hs); qn = hsurf(d0)[1]
    C.parts_head.append(loft('Stirnflamme', pts, lambda t, w_=w_: w_ * hs * (1 - t) ** .8 * (.7 + .3 * math.sin(t * 3)) + .0003, lambda t: .0016 * hs, ring=6, n=10, flat_up=tuple(qn))); set_region(C.parts_head[-1], 'flamme')
# ---------------- Rute + Flammen ----------------
tR = K['tailR'] * (1 if ART == '001' else Lb / .2 * .55)
if K['flame'] == 'ball':
    tail, TP = rute(C.TAIL, lambda t: .03 + tR * math.sin(min(1, t * 1.25 + .05) * math.pi) ** .75 * (1 - .35 * t), 'fell', spike=.18, n=24)
else:
    tail, TP = rute(C.TAIL, lambda t: .03 * rk + tR * math.sin(min(1, t * 1.1 + .05) * math.pi) ** .8 * (1 - .25 * t), 'fell', spike=.18, n=24)
flames = []; tip = TP[-1]; td = (TP[-1] - TP[-5]).normalized(); fs = 1.0 if ART == '001' else .9 * (Lb / .2) ** .6
FT = tip - td * (.08 if ART == '001' else .05) * fs; C.FT = FT
if K['flame'] == 'ball':   # Flammenball an der Rutenspitze (wie das Bild): Kern + 9 Zungen
    core = blob('Flammenkern', FT + td * .02, (.045, .045, .05), 4); set_region(core, 'flamme_kern'); flames.append(core)
    for k in range(9):
        a = k / 9 * 2 * math.pi; rd = Vector((math.cos(a), math.sin(a) * .8, 0)); d = (td * 1.2 + rd * .9 + V(0, 0, .5)).normalized()
        flames.append(flamme(FT + rd * .028 + td * .005, (d + td * .6).normalized(), (.065 + .022 * (k % 3)) * fs, .036 * fs, up=tuple(rd.cross(d).normalized() if rd.cross(d).length > .1 else V(1, 0, 0))))
    flames.append(flamme(FT + td * .03, (td + V(0, -.15, .4)).normalized(), .11 * fs, .042 * fs, up=(1, 0, 0)))
else:
    core = blob('Flammenkern', FT + td * .015, (.035 * fs, .035 * fs, .04 * fs), 3); set_region(core, 'flamme_kern'); flames.append(core)
    for k in range(6):
        a = k / 6 * 2 * math.pi; rd = Vector((math.cos(a), math.sin(a) * .8, 0)); d = (td * 1.4 + rd * .7 + V(0, 0, .3)).normalized()
        flames.append(flamme(FT + rd * .02 * fs, d, (.08 + .03 * (k % 2)) * fs, .032 * fs, up=(1, 0, 0)))
    flames.append(flamme(FT + td * .03, (td + V(0, -.1, .35)).normalized(), .14 * fs, .04 * fs, up=(1, 0, 0)))
# Halskrause: weiche Büschel (creme) – Funki rund, Loddo/Flammel zusätzlich Flammenkragen
ruff = []
hb_ = BVB.ray_cast(Vector((0, C.NECK[0].y - .4, C.NECK[0].z - .03 * rk)), Vector((0, 1, 0)))
bib = blob('Latz', hb_[0] + V(0, .022 * rk, -.004 * rk), (.046 * rk, .03 * rk, .058 * rk), 4, rot=(-.3, 0, 0)); set_region(bib, 'creme'); ruff.append(bib)
for k in range(5):
    a = (k - 2) / 2; p0 = V(a * .045 * rk, C.NECK[0].y - .04 * rk + abs(a) * .012 * rk, C.NECK[0].z - .085 * rk + abs(a) * .02 * rk)
    ruff.append(klumpen(p0, V(a * .35, -.3, -.9), (.05 - .01 * abs(a)) * rk, .026 * rk, 'creme', up=(0, -1, 0), dick=.9, bend=(0, .012 * rk, 0)))
if K['kragen']:
    nk_ = 16 if ART == '003' else 12; mf = 1.6 if ART == '003' else 1.15
    for k in range(nk_):
        a = k / nk_ * 2 * math.pi; ctr = C.NECK[1].lerp(C.NECK[0], .4); rd = Vector((math.cos(a), math.sin(a) * .35, math.sin(a) * .9)).normalized()
        if rd.z < -.55: continue
        hit = BVB.ray_cast(ctr + rd * .3, -rd)
        if hit[0]: flames.append(flamme(hit[0] - rd * .005, (rd + V(0, .9, .35)).normalized(), (.08 + .03 * (k % 2)) * Lb / .31 * mf, .045 * Lb / .31 * mf, up=tuple(V(0, 1, 0).cross(rd).normalized() if V(0, 1, 0).cross(rd).length > .1 else V(1, 0, 0))))
# Ellbogen-/Hüftbüschel, Fersenfell (Silhouette)
for s in (-1, 1):
    F1 = S_(C.FL[1], s); hit = BVB.ray_cast(F1 + V(s * .002, .12, 0), V(0, -1, 0))
    if hit[0]: ruff.append(klumpen(hit[0], V(s * .15, .9, -.4), .035 * rk, .016 * rk, 'fell', up=(s, 0, 0), spitzen=2))
    Hh0 = S_(C.HL[0], s); hit = BVB.ray_cast(Hh0 + V(s * .2, .02, -.01), V(-s, 0, 0))
    if hit[0]: ruff.append(klumpen(hit[0], V(s * .6, .7, -.3), .04 * rk, .018 * rk, 'fell', up=(0, 0, 1), spitzen=2))
    hit = BVB.ray_cast(V(s * .2, C.SPINE[1].y, C.SPINE[1].z - .02 * rk), V(-s, 0, 0))
    if hit[0]: ruff.append(klumpen(hit[0], V(s * .7, .6, -.5), .035 * rk, .017 * rk, 'fell', up=(0, 0, 1), spitzen=2))
# Basaltplatten mit Glutfugen (Flammel)
plates = []
if K['basalt']:
    lava = loft('Lava', [C.SPINE[0] + V(0, 0, .07), C.SPINE[1] + V(0, 0, .085), C.SPINE[2] + V(0, 0, .09), C.SPINE[3] + V(0, 0, .085)], lambda t: .03, lambda t: .012, ring=8, n=12, flat_up=(0, 0, 1))
    set_region(lava, 'lava'); plates.append(lava)
    for k in range(5):
        y = C.SPINE[0].y + (C.SPINE[3].y - C.SPINE[0].y) * k / 6
        for s in ((0,) if k % 2 else (-1, 1)):
            hit = BVB.ray_cast(V(s * .035, y, 1.0), V(0, 0, -1))
            if hit[0]:
                pl = blob('Platte', hit[0] + hit[1] * .006, (.022, .02, .008), 3, lambda v, q: Vector((q.x * (1 + .15 * math.sin(v.y * 5)), q.y, q.z)), rot=(0, s * .35, k * .4)); set_region(pl, 'basalt'); plates.append(pl)
# Pfoten: runde Zehenballen (creme) mit dunklen Sohlenballen, kleine Krallen
paws = []
for s_ in (-1, 1):
    for PP in (C.FL, C.HL):
        pw = S_(PP[3], s_); r_ = .03 * ls
        pa = blob('Pfote', pw + V(0, -.012 * ls, .006 * ls), (r_, r_ * 1.2, r_ * .62), 3, lambda v, q: Vector((q.x, q.y, max(q.z, -.012 * ls)))); set_region(pa, 'pfote'); paws.append(pa)
        for k in range(4):
            xx = (k - 1.5) * r_ * .5; cl = blob('Kralle', pw + V(xx, -r_ * 1.25, .001), (.004 * ls, .007 * ls, .004 * ls), 2); set_region(cl, 'kralle'); paws.append(cl)
zusammen(body_parts=[body, tail] + flames + ruff + plates + paws, body_max=K.get('bmax', 2600))
C.DIR = os.path.dirname(OUT) or '.'
if FORM: form_bild([C.HEAD, C.BODY, C.EYE_OBJ], K['H']); sys.exit(0)

sp_, sn_ = hsurf((0, -.55, .62))
C.FX = [('fx_flamme', tuple(FT + td * .03), tuple(FT + td * .08), 'tail5'), ('fx_stirn', tuple(sp_), tuple(sp_ + sn_ * .03), 'head')]
if K['kragen']: C.FX.append(('fx_kragen', tuple(C.NECK[1].lerp(C.NECK[0], .4) + V(0, 0, .02)), tuple(C.NECK[1] + V(0, 0, .05)), 'neck2'))
rig_vierbeiner(5)
def paint(P):
    X, Y, Z, M, mix = P.X, P.Y, P.Z, P.M, P.mix
    bc = M('fell', 'fell_kopf')
    mix(bc, K['dunkel'], .5 * ss(Lh + .3 * Rb, Lh + .8 * Rb, Z) * (Y > C.SPINE[3].y - .03) * (Y < C.SPINE[0].y + .04) * (np.abs(X) < Rb))          # Sattel
    mix(bc, K['creme'], ss(Lh - .35 * Rb, Lh - .75 * Rb, Z) * ss(.06 * rk, .025 * rk, np.abs(X)) * (Y > C.SPINE[3].y - .05) * (Y < C.SPINE[0].y + .02))   # Bauch
    chest = ss(.085 * rk, .045 * rk, np.sqrt(X ** 2 + ((Z - C.NECK[0].z + .02) * .55) ** 2)) * (Y < C.SPINE[3].y + .02) * (Y > C.NECK[1].y - .1)
    mix(bc, K['creme'], chest)
    hx, hy, hz = P.hx, P.hy, P.hz
    muzzle = ss(.5, .72, -hy) * ss(.1, -.15, hz); cheeks = ss(.55, .25, np.sqrt((np.abs(hx) - .7) ** 2 + (hz + .45) ** 2)) * ss(-.25, .3, -hy)
    mix(M('fell_kopf'), K['creme'], np.clip(muzzle + cheeks + ss(-.5, -.8, hz) * ss(-.1, .4, -hy), 0, 1))
    mix(M('fell_kopf'), '#ffffff', .25 * ss(.3, -.1, np.abs(hx) - .25 + hz) * ss(.6, .8, -hy))
    mix(M('fell_kopf'), K['ohrspitze'], ss(HC.z + HR[2] * .6 + K['ear'][0] * .6, HC.z + HR[2] * .6 + K['ear'][0] * .85, Z))
    mix(M('fell_kopf'), K['dunkel'], .45 * ss(.15, .55, hz) * ss(.2, -.4, hy) * (Z < HC.z + K['ear'][0] * .45))
    if K['bein']:
        legs = (Z < Lh * .62) & (np.abs(Y) < Lb * .8); mix(M('fell'), K['bein'], ss(Lh * .62, Lh * .42, Z) * legs)
        mix(M('pfote'), K['bein'], .7)
    # Rute: Spitze geht in Flamme über
    dT = np.sqrt(((P.Pm - np.array(C.FT)) ** 2).sum(-1)); tailm = (Y > C.SPINE[0].y + .02 * Lb / .2) & (Z > Lh * .7)
    mix(M('fell') & tailm, '#ff9a2a', ss(.16 * fs, .07 * fs, dT)); mix(M('fell') & tailm, '#ffd27a', ss(.09 * fs, .045 * fs, dT))
    mix(M('fell') & tailm, K['creme'], .35 * ss(.3, .18, dT) * ss(.12, .2, dT))
    # Flammen: heißer Kern → Gelb → Orange → rote Spitzen
    fl = M('flamme'); fd = np.sqrt(((P.Pm - np.array(C.FT)) ** 2).sum(-1))
    mix(fl, '#ffb81e', 1.0); mix(fl, '#ff6a10', ss(.06 * fs, .13 * fs, fd)); mix(fl, '#d8300a', ss(.12 * fs, .19 * fs, fd)); mix(fl, '#ffe070', ss(.06 * fs, .02 * fs, fd))
    nb = (P.Pm - np.array(HC)); mix(fl & (np.sqrt((nb ** 2).sum(-1)) < max(HR) * 1.3), '#ff8a1a', 1.0)
    if K['kragen']:
        nd = np.sqrt(((P.Pm - np.array(C.NECK[1].lerp(C.NECK[0], .4))) ** 2).sum(-1)); mk = fl & (nd < .2 * Lb / .31)
        mix(mk, '#ffd25a', ss(.12 * Lb / .31, .06 * Lb / .31, nd)); mix(mk, '#e8461a', ss(.11 * Lb / .31, .16 * Lb / .31, nd))
    mix(M('flamme_kern'), '#ffd040', .6)
    mix(M('pfote'), '#ffffff', .15); mix(M('nase'), '#5a4040', ss(0, 1, (Z - (np_.z)) * 120) * .5)
    if K['basalt']: mix(M('lava'), '#ffd25a', .4)
    mix(M('ohr_innen'), '#fff0e0', .35 * ss(.5, .8, P.fur) if 'fur' in P.__dict__ else 0)
standard_ablauf(OUT, body_allowed_vb, lambda: clips_vierbeiner(K['gang']), paint, K['iris'], fur_scale=1.0 if ART == '001' else .8, nstr=.45, IR=K.get('IR', .62))
