# Route-1-Wildart 059 Flausch (Schneeeulen-Küken, Vorlage Vogel): Federkugel, offene Flügel mit Minz-/Himmelblau-Schwingen, zwei Wirbel-Federkränze, V-Stirnmal.
# Eigener Entwurf nach public/art/059_flausch.webp.
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tbau import *
OUT = [a for a in sys.argv[1:] if a.endswith('.glb')]; OUT = OUT[0] if OUT else '/tmp/t059.glb'
FORM = '--form' in sys.argv
start('t059', .5)
treg('fell', '#fbf6ec', 'haut'); treg('fell_kopf', '#fbf6ec', 'haut'); treg('feder_s', '#fbf6ec', 'haut', (.3, .5, .1, 0)); treg('schwinge', '#ffffff', 'feder'); treg('wirbel', '#bfeee0', 'feder'); treg('schnabel', '#ffb43a', 'horn')
treg('bein', '#f2a830', 'schuppe'); treg('kralle', '#4a3428', 'kralle'); treg('nase', '#ffb43a', 'horn')
C.FLUEGEL = ('schwinge',); C.SCHWANZ = (); C.BEIN = ('bein', 'kralle')
C.SPV = [V(0, .02, .13), V(0, -.005, .2), V(0, -.01, .25), V(0, -.015, .28)]
HR = (.15, .14, .13); HC = V(0, -.02, .34)
body = glied('Rumpf', [V(0, .04, .03), V(0, .03, .09), V(0, .0, .16), V(0, -.01, .23), HC + V(0, .01, -.05)], [(.09, .08), (.135, .125), (.14, .13), (.135, .125), (.13, .12)], ring=20, n=30, flat=(0, -1, 0), regn='fell')
C.WING = [V(.12, .0, .22), V(.2, .02, .24), V(.28, .03, .23), V(.37, .05, .2)]
C.LEGV = [V(.045, .0, .07), V(.05, -.01, .03), V(.05, -.05, .008)]
C.TAILV = [V(0, .09, .08), V(0, .17, .05)]
parts = [body]
BVK = BVHTree.FromObject(body, bpy.context.evaluated_depsgraph_get())
for row in range(5):   # Brust- und Flankenfedern als Geometrie-Schuppen (überlappend, nach unten)
    z = .2 - row * .032; n_ = 9 - (row % 2)
    for k in range(n_):
        a = -1.25 + 2.5 * (k + .5 * (row % 2)) / (n_ - 1 + (row % 2)); d = Vector((math.sin(a), -math.cos(a), 0))
        hit = BVK.ray_cast(V(0, 0, z) + d * .5, -d)
        if hit[0]: parts.append(blatt(hit[0] - d * .004, (d * .45 + V(0, 0, -1)).normalized(), .055, .03, 'feder_s', up=tuple(d), krumm=-.25, dick=.22, n=5))
for s in (-1, 1):
    Wg = [S_(p, s) for p in C.WING]
    parts.append(glied('Arm', Wg, [(.03, .016), (.035, .014), (.03, .012), (.015, .008)], ring=8, n=14, flat=(0, 0, 1), regn='schwinge'))
    for k in range(8):   # Schwungfedern: außen länger, hängen nach hinten-unten
        t = k / 7; p0 = Wg[0].lerp(Wg[3], .15 + .85 * t); d = Vector((s * .35 * t, .35, -1)).normalized()
        parts.append(blatt(p0, d, (.09 + .07 * t), .03 + .008 * t, 'schwinge', up=(0, 1, 0) if False else (s * 0 + 0, -1, 0), krumm=.15, dick=.18))
    Lg = [S_(p, s) for p in C.LEGV]
    parts.append(glied('Bein', Lg[:2], [.022, .016], ring=8, n=6, regn='bein'))
    for k in range(3):
        a = (k - 1) * .45; parts.append(glied('Zehe', [Lg[1], Lg[1] + V(math.sin(a) * .03, -math.cos(a) * .04, -.02)], [.009, .006], ring=6, n=5, regn='bein'))
    for k in range(3):   # Bauchbüschel/Flanken (Federkugel-Silhouette)
        hit = None
for k in range(5):
    a = (k - 2) * .3; parts.append(blatt(C.TAILV[0], (math.sin(a), 1, -.3), .1, .035, 'schwinge', up=(0, 0, 1), krumm=.1, dick=.15))
for k in range(6):
    a = (k - 2.5) / 2.5; parts.append(klumpen(V(a * .11, -.12, .15 - abs(a) * .03), V(a * .3, -.5, -.8), .06, .03, 'fell', up=(0, -1, 0), spitzen=3))
for s in (-1, 1):
    for k in range(3):
        parts.append(klumpen(V(s * .145, .0 + k * .03, .1 + k * .05), V(s * .8, .3, -.5), .05, .025, 'fell', up=(0, 0, 1), spitzen=2))
kopf(HC, HR, sn=.05, sn_drop=0, sn_w=0, sn_s=.3, stirn=.0, mulde=.08, backen=.05, reg='fell_kopf')
bp, bn = hsurf((0, -1, -.15)); C.NOSE = bp
beak = glied('Schnabel', [bp - bn * .01, bp + bn * .018 + V(0, 0, -.006), bp + bn * .03 + V(0, 0, -.022)], [(.016, .012), (.012, .009), (.002, .002)], ring=8, n=8, regn='schnabel'); C.parts_head.append(beak)
for s in (-1, 1):   # Wirbel-Federkränze (Spirale) als „Ohren“
    base, bn2 = hsurf((s * .55, .1, .8), -.01); pts = []
    Cs = base + V(s * .09, .01, .1); d0 = base - Cs; th0 = math.atan2(d0.z, s * d0.x); r0 = d0.length
    for i in range(14):
        t = i / 13; th = th0 - t * 3.4 * math.pi / 1.15; r = r0 * (1 - .82 * t)
        pts.append(Cs + V(s * r * math.cos(th), -.01 * t, r * math.sin(th)))
    sp = glied('Wirbel', pts, [(.034 * (1 - .5 * i / 13), .018) for i in range(14)], ring=8, n=40, flat=(0, 1, 0), regn='wirbel'); C.parts_head.append(sp)
    C.EARS[s] = (base, Vector((s * .5, 0, 1)).normalized(), .12, Vector((0, -1, 0)), Vector((1, 0, 0)))
for k in range(5):
    a = (k - 2) * .35; p, n = hsurf((a * .6, -.4, .75), -.006); C.parts_head.append(bueschel(p, n * .4 + V(a * .3, .8, .3), .04, .03, 'fell_kopf', dick=1.0))
augen(.064, xn=.4, yn=-.86, zn=.1, spread=.28, lid_col='#fbf6ec')
maul(w=.12, z=-.32, smile=.1, mid=False)
zusammen(body_parts=parts, body_max=4600, head_max=3600)
C.DIR = os.path.dirname(OUT) or '.'
if FORM: form_bild([C.HEAD, C.BODY, C.EYE_OBJ], .5); sys.exit(0)
rig_vogel()
def paint(P):
    X, Y, Z, M, mix = P.X, P.Y, P.Z, P.M, P.mix; hx, hy, hz = P.hx, P.hy, P.hz
    sw = M('schwinge'); ax = np.abs(X)
    mix(sw, '#9fe6cc', ss(.16, .26, ax)); mix(sw, '#5fbff0', ss(.27, .36, ax)); mix(sw, '#9fe6cc', .6 * (Y > .08))
    mix(M('fell_kopf'), '#9fe6cc', ss(.2, .1, np.abs(np.abs(hx) * .9 - (hz - .45) * .8)) * (hz > .35) * (hy < 0))   # V-Stirnmal
    mix(M('fell_kopf'), '#f0e6d8', ss(.55, .3, np.sqrt(((np.abs(hx) - .42) * 1.2) ** 2 + (hz - .1) ** 2)) * (hy < -.2))    # Gesichtsschleier
    mix(M('feder_s'), '#9fe6cc', .85 * ((Z > .1) & (Z < .15)).astype(np.float32)); mix(M('feder_s'), '#ffffff', .3 * ss(.0, .06, -Y - .1))  # Brustband minz
    mix(M('wirbel'), '#5fbff0', .5 * ss(.3, .5, np.abs(X))); mix(M('wirbel'), '#ffffff', .4 * ss(.4, .45, Z - HC.z + .4))
standard_ablauf(OUT, body_allowed_vogel, clips_vogel, paint, ('#2f8ae0', '#0c3a8a', '#8fe0ff'), fur_scale=1.0, nstr=.35, ohren=False, IR=.76)
