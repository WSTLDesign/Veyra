# Flut-Starterlinie (Vorlage Wassertier): 004 Plippi (Seehund-Heuler) · 005 Wabbel (Seehund-Jungtier) · 006 Aquilo (Seeleopard)
# Eigene Entwürfe nach public/art/004_plippi.webp und docs/terras.md: liegende Robbe, runder Kopf, schwebende Wasserkrone mit Blasen, Tupfen.
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tbau import *
ART = [a for a in sys.argv[1:] if a.isdigit()]; ART = ART[0] if ART else '004'
OUT = [a for a in sys.argv[1:] if a.endswith('.glb')]; OUT = OUT[0] if OUT else '/tmp/t%s.glb' % ART
FORM = '--form' in sys.argv
K = {'004': dict(name='t004', L=.85, R=1.0, HR=(.14, .13, .135), haut='#5cb4f4', bauch='#f4fbff', tupf='#2f86d6', zacken=5, kopf=1.0, RE=.05, rueck=False, leucht=False, H=.5, iris=('#2f8ae0', '#0c3a8a', '#8fe0ff'), bmax=2800),
     '005': dict(name='t005', L=1.25, R=1.12, HR=(.13, .13, .118), haut='#3f9ae8', bauch='#eef8ff', tupf='#1f6cc0', zacken=7, kopf=.95, RE=.036, rueck=True, leucht=False, H=.62, iris=('#2a7ad8', '#0a3070', '#7fd4ff'), bmax=3200),
     '006': dict(name='t006', L=1.55, R=1.3, HR=(.14, .15, .122), haut='#1f4e9a', bauch='#e6f4ff', tupf='#5ff0ff', zacken=7, kopf=1.0, RE=.032, rueck=True, leucht=True, H=.8, iris=('#21c8f0', '#0a3a6a', '#b0ffff'), bmax=3800)}[ART]
start(K['name'], K['H'])
treg('haut', K['haut'], 'haut'); treg('fell_kopf', K['haut'], 'haut'); treg('bauch', K['bauch'], 'haut'); treg('flosse', K['haut'], 'haut'); treg('nase', '#1e2a40', 'nase')
treg('wasser', '#9fe6ff', 'kristall', (.5, 0, .9, .35)); treg('blase', '#dff8ff', 'kristall', (.3, 0, 1, .5)); treg('kralle', '#c8d8e8', 'kralle')
if K['leucht']: treg('leucht', '#7ff6ff', 'glut', (.3, 0, 0, 1))
C.FINREG = ('flosse',); C.KRONE = ('wasser', 'blase')
L, R = K['L'], K['R']
C.SPW = [V(0, .44 * L, .045 * R), V(0, .3 * L, .075 * R), V(0, .16 * L, .115 * R), V(0, .0, .15 * R), V(0, -.13 * L, .17 * R), V(0, -.21 * L, .23 * R), V(0, -.24 * L, .3 * R)]
HR = tuple(x * K['kopf'] * (R ** .5) for x in K['HR']); HC = C.SPW[6] + V(0, -.03, HR[2] * .38)
# Rumpf: ein Loft vom Schwanz bis in den Kopf (tropfenförmig, Bauch flach)
TOR = [C.SPW[0] + V(0, .03, 0)] + C.SPW + [HC + V(0, .03, -.03 * R), HC + V(0, .01, .02 * R)]
rr = [(.03, .022), (.055, .042), (.09, .075), (.135, .115), (.155, .135), (.15, .135), (.13, .125), (.125, .12), (.12, .115), (.09, .085)]
body = glied('Rumpf', TOR, [(a * R, b * R) for a, b in rr], ring=24, n=44, regn='haut')
def flach(p):
    p = p.copy(); f = ss(.02 * R, -.06 * R, p.z - C.SPW[3].z + .1 * R)
    if p.z < .03 * R: p.z = .03 * R + (p.z - .03 * R) * .25
    return p
deform(body, flach); set_region(body, 'haut')
BVB = BVHTree.FromObject(body, bpy.context.evaluated_depsgraph_get())
# Vorderflossen (flach, leicht gebogen) und Hinterflossen (Fächer)
C.FIN = [V(.1 * R, -.1 * L, .09 * R), V(.15 * R, -.12 * L, .045 * R), V(.2 * R, -.1 * L, .018 * R)]
C.FINH = V(.03 * R, .4 * L, .05 * R)
fins = []
for s in (-1, 1):
    F = [S_(p, s) for p in C.FIN]
    fins.append(glied('Flosse', F, [(.045 * R, .016 * R), (.05 * R, .014 * R), (.022 * R, .008 * R)], ring=10, n=14, flat=(0, 0, 1), regn='flosse'))
    FH = S_(C.FINH, s); d = Vector((s * .55, 1, .05)).normalized()
    fins.append(glied('FlosseH', [FH, FH + d * .07 * L, FH + d * .13 * L], [(.035 * R, .014 * R), (.075 * R, .014 * R), (.09 * R, .008 * R)], ring=10, n=12, flat=(0, 0, 1), regn='flosse'))
# Kopf: rund, kurze Schnauze mit Barthaar-Polstern
kopf(HC, HR, sn=.22, sn_drop=.05, sn_w=.1, sn_s=.4, stirn=.03, mulde=.03, backen=.08)
np_, nn = hsurf((0, -1, -.25)); C.NOSE = np_
nose = blob('Nase', np_ + nn * .003, (.022 * HR[0] / .13, .012, .014 * HR[0] / .13), 3); set_region(nose, 'nase'); C.parts_head.append(nose)
for s in (-1, 1):
    p, n = hsurf((s * .3, -1, -.38), -.004); pad = blob('Polster', p, (.04 * HR[0] / .13, .03, .032 * HR[0] / .13), 3); set_region(pad, 'bauch'); C.parts_head.append(pad)
augen(K['RE'], xn=.42, yn=-.9, zn=.06, spread=.38, lid_col=K['haut'])
maul(w=.24, z=-.52, smile=.14)
# Wasserkrone: Ring + Zacken mit Tropfenspitzen, schwebende Blasen (leuchten leicht)
crown = []; kc = HC + V(0, .01, HR[2] * 1.05); kr = HR[0] * .62; nz = K['zacken']
ring = loft('KronenRing', [kc + V(math.cos(a) * kr, math.sin(a) * kr * .9, 0) for a in np.linspace(0, 2 * math.pi, 25)], lambda t: .012 * R, lambda t: .018 * R, ring=8, n=48, flat_up=(0, 0, 1), cap0=False)
set_region(ring, 'wasser'); crown.append(ring)
for k in range(nz):
    a = k / nz * 2 * math.pi - math.pi / 2; p0 = kc + V(math.cos(a) * kr, math.sin(a) * kr * .9, .01); ht = (.09 if k == 0 or nz == 5 and k in (0,) else .065) * R * (1.15 if k == 0 else 1)
    z = glied('Zacke', [p0, p0 + V(math.cos(a) * .012, math.sin(a) * .012, ht * .6), p0 + V(math.cos(a) * .02, math.sin(a) * .02, ht)], [.018 * R, .013 * R, .002], ring=8, n=8, regn='wasser'); crown.append(z)
    b = blob('Blase', p0 + V(math.cos(a) * .02, math.sin(a) * .02, ht + .012 * R), (.012 * R,) * 3, 2); set_region(b, 'blase'); crown.append(b)
for k in range(4):
    a = k * 1.9 + .5; b = blob('Blase', kc + V(math.cos(a) * kr * 1.5, math.sin(a) * kr * 1.2, .05 * R + .03 * k * R), ((.01 + .004 * (k % 2)) * R,) * 3, 2); set_region(b, 'blase'); crown.append(b)
C.parts_head += crown
extra = []
if K['rueck']:   # Rückenflosse (Wabbel/Aquilo)
    hit = BVB.ray_cast(V(0, -.02 * L, 1), V(0, 0, -1)); p = hit[0]
    extra.append(glied('Rueckenflosse', [p - V(0, 0, .01), p + V(0, .04 * L, .06 * R), p + V(0, .1 * L, .1 * R)], [(.012 * R, .05 * R), (.008 * R, .035 * R), (.002, .008)], ring=10, n=10, flat=(1, 0, 0), regn='flosse'))
zusammen(body_parts=[body] + fins + extra, body_max=K['bmax'])
C.DIR = os.path.dirname(OUT) or '.'
if FORM: form_bild([C.HEAD, C.BODY, C.EYE_OBJ], K['H']); sys.exit(0)
C.FX = [('fx_krone', tuple(kc + V(0, 0, .05 * R)), tuple(kc + V(0, 0, .1 * R)), 'head')]
rig_wasser()
def paint(P):
    X, Y, Z, M, mix = P.X, P.Y, P.Z, P.M, P.mix
    sk = M('haut', 'fell_kopf', 'flosse')
    mix(sk, K['bauch'], ss(C.SPW[3].z - .02 * R, C.SPW[3].z - .09 * R, Z) * (Y > C.SPW[5].y - .05))                  # Bauch hell
    hx, hy, hz = P.hx, P.hy, P.hz
    mix(M('fell_kopf'), K['bauch'], ss(.55, .8, -hy) * ss(.05, -.25, hz))                                                    # Schnauze hell
    mix(M('fell_kopf'), '#ffb0c0', .35 * ss(.25, .1, np.sqrt((np.abs(hx) - .55) ** 2 + (hz + .3) ** 2)) * (hy < -.3))        # Wangenröte
    # Tupfen auf dem Rücken (Zellrauschen), bei Aquilo leuchtend
    F1, E, Hh = cells(P.Pm * (16 / C.H)); dots = ss(.28, .2, F1) * (Hh > .45) * ss(C.SPW[3].z - .03 * R, C.SPW[3].z + .05 * R, Z)
    mix(sk, K['tupf'], dots * .9)
    mix(M('flosse'), K['tupf'], .3)
    mix(M('wasser'), '#ffffff', .3 * ss(.0, 1, (Z - kc.z) / (.08 * R))); mix(M('blase'), '#ffffff', .3)
standard_ablauf(OUT, body_allowed_wasser, clips_wasser, paint, K['iris'], nstr=.25, ohren=False, sclera=None)
