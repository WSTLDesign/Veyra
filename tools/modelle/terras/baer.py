# Flora-Starterlinie: 007 Knospi (Bärenjunges, Zweibeiner) · 008 Rankel (Jungbär im Laubfell, Zweibeiner) · 009 Blühro (Grizzly-Waldhüter, Vierbeiner)
# Eigene Entwürfe nach public/art/007_knospi.webp, 008_rankel.webp, 009_bluehro.webp: Blätterhaube mit Knospe, Blätterkragen, rosa Ballen; Endstufe mit Lilienblüte, Blättermähne, Ranken.
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tbau import *
ART = [a for a in sys.argv[1:] if a.isdigit()]; ART = ART[0] if ART else '007'
OUT = [a for a in sys.argv[1:] if a.endswith('.glb')]; OUT = OUT[0] if OUT else '/tmp/t%s.glb' % ART
FORM = '--form' in sys.argv
K = {'007': dict(name='t007', H=.55, k=1.0, fell='#a8703e', creme='#f3dfb4', blatt='#8cc63a', blatt2='#5f9e2a', bluete='#ff9fc0', coat=0, iris=('#9a6228', '#3a1a08', '#e0a860'), RE=.052),
     '008': dict(name='t008', H=.78, k=1.35, fell='#86b04a', creme='#f0dcae', blatt='#82c23e', blatt2='#4f8e2a', bluete='#ff9fc0', coat=1, iris=('#9a6228', '#3a1a08', '#e0a860'), RE=.044),
     '009': dict(name='t009', H=1.1, k=1.0, fell='#7aa848', creme='#efdcae', blatt='#7fc23e', blatt2='#3f7e22', bluete='#ff86b8', coat=2, iris=('#8a5a24', '#3a1a08', '#d8a860'), RE=.03)}[ART]
start(K['name'], K['H'])
treg('fell', K['fell']); treg('fell_kopf', K['fell']); treg('creme', K['creme']); treg('ohr_innen', '#f3dfb4'); treg('nase', '#3a2420', 'nase'); treg('ballen', '#ff9fb0', 'haut')
treg('blatt', K['blatt'], 'blatt'); treg('blatt2', K['blatt2'], 'blatt'); treg('stiel', '#5f9e2a', 'blatt'); treg('knospe', K['bluete'], 'bluete'); treg('kralle', '#5a4030', 'kralle')
C.KOPFREG = ('knospe',); C.TAILREG = ()
leaves = []
def blattkranz(ctr, n, r, L, W, down, regs=('blatt', 'blatt2'), tilt=0.0, ph=0.0, bvh=None):
    out = []
    for k in range(n):
        a = k / n * 2 * math.pi + ph; d = Vector((math.cos(a), math.sin(a), 0)); p = ctr + d * r
        if bvh:
            hit = bvh.ray_cast(ctr + d * r * 3 + V(0, 0, .0), -d)
            if hit[0]: p = hit[0] - d * .004
        out.append(blatt(p, (d + V(0, 0, -down)).normalized(), L * (.85 + .3 * ((k * 7) % 3) / 2), W, regs[k % 2], up=(0, 0, 1) if down < .9 else tuple(d), krumm=.25 + tilt))
    return out
if ART in ('007', '008'):
    s_ = K['k']; Hs = .55 * s_
    C.SPB = [V(0, 0, .17 * s_), V(0, -.005, .24 * s_), V(0, 0, .31 * s_), V(0, .005, .37 * s_), V(0, 0, .405 * s_)]
    C.ARM = [V(.095 * s_, -.005, .325 * s_), V(.125 * s_, -.02, .25 * s_), V(.12 * s_, -.06, .19 * s_), V(.115 * s_, -.085, .165 * s_)]
    C.LEG = [V(.06 * s_, 0, .16 * s_), V(.065 * s_, -.025, .09 * s_), V(.065 * s_, .0, .03 * s_), V(.065 * s_, -.06, .012 * s_)]
    C.TAIL = [V(0, .1 * s_, .14 * s_), V(0, .13 * s_, .15 * s_)]
    HR = (.17 * s_ ** .8, .155 * s_ ** .8, .15 * s_ ** .8); HC = C.SPB[4] + V(0, -.015 * s_, HR[2] * .72)
    body = glied('Rumpf', [V(0, .005, .08 * s_)] + C.SPB + [HC + V(0, 0, -.03)], [(.07 * s_, .06 * s_), (.11 * s_, .1 * s_), (.125 * s_, .115 * s_), (.115 * s_, .1 * s_), (.09 * s_, .08 * s_), (.07 * s_, .065 * s_), (.06 * s_, .06 * s_)], ring=20, n=36, flat=(0, -1, 0))
    def bauch(p):
        p = p.copy(); p.y -= .018 * s_ * gauss((p.z - .2 * s_) ** 2 / s_ ** 2, .06) * ss(0, -.05, p.y); return p
    deform(body, bauch); set_region(body, 'fell')
    limbs = []
    for s in (-1, 1):
        A = [S_(p, s) for p in C.ARM]; Lg = [S_(p, s) for p in C.LEG]
        limbs.append(glied('Arm', [A[0] + V(-s * .02 * s_, 0, .01 * s_)] + A, [.045 * s_, .042 * s_, .036 * s_, .032 * s_, .03 * s_], ring=12, n=20, flat=(0, -1, 0)))
        limbs.append(glied('Bein', [Lg[0] + V(-s * .02 * s_, 0, .02 * s_)] + Lg[:3], [.06 * s_, .058 * s_, .048 * s_, .04 * s_], ring=12, n=16, flat=(0, -1, 0)))
        ft = blob('Fuss', Lg[3] + V(0, .02 * s_, .006 * s_), (.04 * s_, .062 * s_, .026 * s_), 3, lambda v, q: Vector((q.x, q.y, max(q.z, -.012 * s_)))); set_region(ft, 'fell'); limbs.append(ft)
        pad = blob('Ballen', Lg[3] + V(0, -.04 * s_, .012 * s_), (.03 * s_, .006 * s_, .02 * s_), 2); set_region(pad, 'ballen'); limbs.append(pad)
        hp = blob('Pfote', A[3] + V(0, -.01, -.01 * s_), (.034 * s_, .032 * s_, .03 * s_), 3); set_region(hp, 'fell'); limbs.append(hp)
    tail = blob('Stummel', C.TAIL[1], (.03 * s_,) * 3, 3); set_region(tail, 'fell')
    body = join([body] + limbs + [tail], 'Rumpf')
    BVB = BVHTree.FromObject(body, bpy.context.evaluated_depsgraph_get())
    kopf(HC, HR, sn=.32, sn_drop=.12, sn_w=.05, sn_s=.42, stirn=.03, mulde=.04, backen=.1)
    ears_at = [(s * .62, .1, .72) for s in (-1, 1)]
    leaves += blattkranz(V(0, -.01, C.SPB[3].z + .01 * s_), 9, .07 * s_, .07 * s_, .035 * s_, .75, bvh=BVB)              # Blätterkragen
    if K['coat']:
        for k in range(14):
            z = C.SPB[0].z + (C.SPB[3].z - C.SPB[0].z) * ((k * 5) % 14) / 14; a = k * 2.4
            d = Vector((math.cos(a), math.sin(a) * .9, 0)); hit = BVB.ray_cast(V(0, 0, z) + d * .5, -d)
            if hit[0] and abs(hit[0].y) < .2 and hit[0].z > C.SPB[2].z - .02 * s_: leaves.append(blatt(hit[0] - d * .004, (d + V(0, 0, -1.2)).normalized(), .065 * s_, .03 * s_, ('blatt', 'blatt2')[k % 2], up=tuple(d), krumm=.3))
    parts = [body]
else:  # 009 Blühro: Vierbeiner (Sohlengänger), Schulterbuckel
    Lb, Lh = .46, .34; Wx = .11
    C.SPINE = [V(0, Lb * .5, Lh), V(0, Lb * .2, Lh * 1.04), V(0, -Lb * .12, Lh * 1.12), V(0, -Lb * .4, Lh * 1.14)]
    C.NECK = [C.SPINE[3] + V(0, -.06, .02), C.SPINE[3] + V(0, -.12, .02)]
    C.FL = [V(Wx, -Lb * .4, Lh * 1.0), V(Wx * 1.05, -Lb * .36, Lh * .55), V(Wx * 1.05, -Lb * .42, Lh * .14), V(Wx * 1.05, -Lb * .5, .02)]
    C.HL = [V(Wx * 1.05, Lb * .52, Lh * .92), V(Wx * 1.1, Lb * .36, Lh * .52), V(Wx * 1.1, Lb * .58, Lh * .16), V(Wx * 1.08, Lb * .5, .02)]
    C.TAIL = [C.SPINE[0] + V(0, .05, .0), C.SPINE[0] + V(0, .09, -.01), C.SPINE[0] + V(0, .11, -.03)]
    HR = (.19, .175, .165); HC = C.NECK[1] + V(0, -.09, .06)
    body = glied('Rumpf', [C.SPINE[0] + V(0, .07, -.01)] + C.SPINE + C.NECK + [HC + V(0, .06, -.03)], [(.13, .12), (.17, .17), (.19, .19), (.2, .21), (.19, .21), (.15, .16), (.13, .13), (.11, .11)], ring=22, n=40)
    deform(body, lambda p: p + V(0, 0, .03 * gauss((p.y + .08) ** 2, .06) * ss(Lh + .05, Lh + .15, p.z))); set_region(body, 'fell')   # Schulterbuckel
    legs = []
    for s in (-1, 1):
        F = [S_(p, s) for p in C.FL]; Hh = [S_(p, s) for p in C.HL]
        legs.append(glied('BeinV', [F[0] + V(-F[0].x * .4, 0, .02), F[0], F[1], F[2], F[3] + V(0, -.01, .02)], [(.09, .1), (.095, .1), (.075, .08), (.065, .062), (.07, .035)], ring=12, n=26, flat=(0, -1, 0)))
        legs.append(glied('BeinH', [Hh[0] + V(-Hh[0].x * .4, 0, .02), Hh[0], Hh[1], Hh[2], Hh[3] + V(0, -.01, .02)], [(.1, .12), (.1, .12), (.075, .085), (.062, .062), (.07, .035)], ring=12, n=26, flat=(0, -1, 0)))
        for PP in (F, Hh):
            pw = blob('Tatze', PP[3] + V(0, -.03, .015), (.06, .075, .03), 3, lambda v, q: Vector((q.x, q.y, max(q.z, -.012)))); set_region(pw, 'fell'); legs.append(pw)
            for kk in range(4):
                cl = blob('Kralle', PP[3] + V((kk - 1.5) * .025, -.1, .01), (.008, .014, .007), 2); set_region(cl, 'kralle'); legs.append(cl)
    tail = blob('Stummel', C.TAIL[1], (.035, .04, .035), 3); set_region(tail, 'fell')
    body = join([body] + legs + [tail], 'Rumpf')
    BVB = BVHTree.FromObject(body, bpy.context.evaluated_depsgraph_get())
    kopf(HC, HR, sn=.42, sn_drop=.15, sn_w=0, sn_s=.55, stirn=.04, mulde=.04, backen=.06)
    ears_at = [(s * .66, .15, .7) for s in (-1, 1)]
    # Blättermähne über Nacken/Schultern, Ranken um den Körper
    for k in range(30):
        y = C.NECK[1].y + (C.SPINE[1].y - C.NECK[1].y) * (k % 15) / 14; a = (-.75 if k < 15 else .75) * (.4 + .6 * ((k * 7) % 5) / 4) + .15 * math.sin(k * 1.3)
        d = Vector((math.sin(a), 0, math.cos(a))); hit = BVB.ray_cast(V(0, y, Lh) + d * .6, -d)
        if hit[0]: leaves.append(blatt(hit[0] - d * .012, (d * .35 + V(0, .9, -.25)).normalized(), .16 * (1.1 - .5 * abs(y - C.NECK[0].y)), .075, ('blatt', 'blatt2')[k % 2], up=tuple(d), krumm=.22, dick=.14))
    for k in range(7):   # Brustfell (Volumen-Klumpen, creme)
        a = (k - 3) / 3; hit = BVB.ray_cast(V(a * .1, -1, Lh * 1.0 - abs(a) * .03), V(0, 1, 0))
        if hit[0]: leaves.append(klumpen(hit[0] + V(0, .015, 0), V(a * .3, -.4, -.9), .08, .04, 'creme', up=(0, -1, 0), spitzen=3))
    for s in (-1, 1):   # Ranken (Spiralen um Brust und Vorderbein)
        pts = [S_(C.FL[0], s) + V(0, -.02, .05), S_(C.FL[1], s) + V(s * .06, -.04, .02), S_(C.FL[1], s) + V(-s * .02, -.08, -.06), S_(C.FL[2], s) + V(s * .06, -.02, .02)]
        r_ = glied('Ranke', pts, [.012, .012, .01, .008], ring=6, n=16, regn='stiel'); leaves.append(r_)
    parts = [body]
# Kopf-Details: Nase, Ohren rund, Augen, Mund, Blätterhaube + Knospe/Lilie, Blütchen
np_, nn = hsurf((0, -1, -.3)); C.NOSE = np_; hs = HR[0] / .15
nose = blob('Nase', np_ + nn * .004 * hs, (.026 * hs, .017 * hs, .018 * hs), 3); set_region(nose, 'nase'); C.parts_head.append(nose)
for s in (-1, 1):
    base, bn = hsurf(ears_at[0 if s < 0 else 1], -.01 * hs); up_ = Vector((s * .7, .1, 1)).normalized(); fw = Vector((0, -1, .2)).normalized()
    C.parts_head.append(ohr(s, base, up_, fw, .07 * hs, .042 * hs, .03 * hs, cup=.9, rund=1, regs=('fell_kopf', 'ohr_innen'), NU=8, NA=12))
augen(K['RE'], xn=.42, yn=-.88, zn=.1, spread=.34, lid_col=K['fell'])
maul(w=.2, z=-.5, smile=.15)
top = hsurf((0, .1, 1))[0]
C.parts_head += blattkranz(top + V(0, 0, -.015 * hs), 7, .06 * hs, .09 * hs, .045 * hs, .45, regs=('blatt', 'blatt2'))
if ART == '009':   # Lilienblüte: 5 Blütenblätter + Stempel
    for k in range(5):
        a = k / 5 * 2 * math.pi; d = Vector((math.cos(a), math.sin(a), 1.4)).normalized(); C.parts_head.append(blatt(top + V(0, 0, .01), d, .14, .06, 'knospe', up=(0, 0, 1), krumm=-.35))
    st = glied('Stempel', [top, top + V(0, 0, .05)], [.008, .006], ring=6, n=4, regn='stiel'); C.parts_head.append(st)
else:              # Knospen-Spross
    st = glied('Spross', [top, top + V(.005, 0, .04 * hs), top + V(.012, -.005, .075 * hs)], [.007 * hs, .006 * hs, .006 * hs], ring=6, n=8, regn='stiel'); C.parts_head.append(st)
    kn = blob('Knospe', top + V(.014, -.006, .1 * hs), (.026 * hs, .026 * hs, .036 * hs), 3, lambda v, q: Vector((q.x * (1 - .45 * max(0, v.z)), q.y * (1 - .45 * max(0, v.z)), q.z))); set_region(kn, 'knospe'); C.parts_head.append(kn)
    for k in range(2):
        a = k * math.pi + .5; C.parts_head.append(blatt(top + V(0, 0, .04 * hs), (math.cos(a), math.sin(a), .6), .045 * hs, .025 * hs, 'blatt', up=(0, 0, 1), krumm=.3))
zusammen(body_parts=parts + leaves, body_max=3200 if ART != '009' else 4200)
C.DIR = os.path.dirname(OUT) or '.'
if FORM: form_bild([C.HEAD, C.BODY, C.EYE_OBJ], K['H']); sys.exit(0)
C.FX = []
def paint(P):
    X, Y, Z, M, mix = P.X, P.Y, P.Z, P.M, P.mix
    hx, hy, hz = P.hx, P.hy, P.hz
    mix(M('fell_kopf'), K['creme'], ss(.5, .72, -hy) * ss(.15, -.2, hz))                                     # Schnauze
    mix(M('fell_kopf'), '#ffb0b8', .35 * ss(.25, .1, np.sqrt((np.abs(hx) - .55) ** 2 + (hz + .25) ** 2)) * (hy < -.3))
    if ART == '009': mix(M('fell'), K['creme'], ss(.05, -.05, Z - .3) * ss(.12, .05, np.abs(X)) * (Y < 0))
    else: mix(M('fell'), K['creme'], ss(.09 * K['k'], .05 * K['k'], np.sqrt(X ** 2 + (Y + .08 * K['k']) ** 2 * 0)) * ss(.0, -.06 * K['k'], Y) * (Z > .08 * K['k']) * (Z < .34 * K['k']))   # Bauch
    bl = M('blatt', 'blatt2')                                                                                # Blattadern: helle Mittelrippe über Zellrauschen
    F1, E, Hh = cells(P.Pm * (60 / C.H)); mix(bl, '#c8f070', .35 * ss(.06, 0, E)); mix(bl, '#2f5e1a', .25 * ss(.3, .6, F1))
    mix(M('knospe'), '#ffffff', .35 * ss(.4, .9, (Z - Z[M('knospe')].min() if M('knospe').any() else 0) / (.08 * C.H)))
    mix(M('fell'), '#4a2a14', .45 * (Z < .03 * C.H))
gang = {'007': dict(wL=.09, rL=.16, lift=.03), '008': dict(wL=.12, rL=.22, lift=.04)}
if ART == '009':
    rig_vierbeiner(1, ohren=True); standard_ablauf(OUT, body_allowed_vb, lambda: clips_vierbeiner(dict(wL=.3, rL=.5, wLift=.06, rLift=.1, bob=.012, plant=True, tail=.1)), paint, K['iris'], fur_scale=.8, nstr=.35, IR=.7)
else:
    rig_zweibeiner(True); standard_ablauf(OUT, body_allowed_zb, lambda: clips_zweibeiner(gang[ART]), paint, K['iris'], fur_scale=1.0, nstr=.4, IR=.72)
