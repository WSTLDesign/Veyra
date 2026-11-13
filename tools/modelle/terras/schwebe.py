# Route-1-Wildart 061 Blinki (Widderkaninchen mit Glühwürmchen-Merkmalen, Vorlage Schwebend): Schlappohren, Leuchtfühler, Flügelchen, leuchtende Laterne als Schwanz.
# Eigener Entwurf nach public/art/061_blinki.webp (Creme-Gelb / Lavendel / Leuchtgelb).
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tbau import *
OUT = [a for a in sys.argv[1:] if a.endswith('.glb')]; OUT = OUT[0] if OUT else '/tmp/t061.glb'
FORM = '--form' in sys.argv
start('t061', .55)
treg('fell', '#fcecb8'); treg('fell_kopf', '#fcecb8'); treg('lavendel', '#b79ae2'); treg('ohr_innen', '#f6d8e8'); treg('nase', '#d88aa0', 'nase')
treg('fluegel', '#fff2c8', 'kristall', (.4, 0, .9, .3)); treg('laterne', '#ffe27a', 'glut', (.2, 0, 0, 1)); treg('fuehler', '#ffeaa0', 'glut', (.2, 0, 0, 1)); treg('stiel', '#b79ae2', 'haut')
C.FLUEGEL = ('fluegel',); C.SCHWANZ = ('laterne', 'lavendel'); C.ARMREG = ()
z0 = .16
C.SPS = [V(0, .0, z0 + .04), V(0, -.005, z0 + .12), V(0, -.01, z0 + .17)]
HR = (.14, .13, .125); HC = C.SPS[2] + V(0, -.01, .1)
body = glied('Rumpf', [C.SPS[0] + V(0, .01, -.04), C.SPS[0], C.SPS[1], C.SPS[2] + V(0, 0, .02)], [(.05, .05), (.085, .08), (.08, .075), (.06, .06)], ring=18, n=24, flat=(0, -1, 0), regn='fell')
C.ARMS = [V(.06, -.04, z0 + .12), V(.05, -.08, z0 + .07)]; C.FLW = V(.05, .05, z0 + .13); C.TAILV = [V(0, .06, z0 + .03), V(0, .1, z0 - .035)]
parts = [body]
for s in (-1, 1):
    A = [S_(p, s) for p in C.ARMS]; parts.append(glied('Arm', A, [.028, .026], ring=10, n=8, regn='fell'))
    pw = blob('Pfote', A[1] + V(0, -.005, -.005), (.025, .025, .022), 3); set_region(pw, 'lavendel'); parts.append(pw)
    ft = blob('Fuss', S_(V(.05, -.03, z0 - .02), s), (.03, .045, .028), 3); set_region(ft, 'lavendel'); parts.append(ft)
    Fw = S_(C.FLW, s)
    for k, (dz, L) in enumerate(((.03, .16), (-.03, .12))):
        parts.append(blatt(Fw + V(0, 0, dz), (s * 1, .5, .5 - k * .9), L, .06, 'fluegel', up=(0, 1, 0), krumm=.05, dick=.04))
lat = blob('Laterne', C.TAILV[1], (.07, .065, .085), 4); set_region(lat, 'laterne'); parts.append(lat)
for k in range(5):
    a = k / 5 * 2 * math.pi; parts.append(blatt(C.TAILV[0] + V(0, .02, -.01), (math.cos(a) * .6, .7 + math.sin(a) * .2, -.5), .06, .035, 'lavendel', up=(0, 0, 1), krumm=-.2, dick=.12))
kopf(HC, HR, sn=.12, sn_drop=.05, sn_w=0, sn_s=.4, stirn=.0, mulde=.05, backen=.12)
np_, nn = hsurf((0, -1, -.25)); C.NOSE = np_
nose = blob('Nase', np_ + nn * .003, (.014, .009, .01), 3); set_region(nose, 'nase'); C.parts_head.append(nose)
for s in (-1, 1):   # Schlappohren (hängen seitlich), Spitzen lavendel
    base, bn = hsurf((s * .7, .1, .62), -.015); up_ = Vector((s * .75, .15, -.55)).normalized(); fw = Vector((0, -1, .3)).normalized()
    C.parts_head.append(ohr(s, base, up_, Vector((s * .3, -1, .2)).normalized(), .16, .075, .03, cup=.8, regs=('fell_kopf', 'ohr_innen'), rund=.6))
    fb, fn = hsurf((s * .2, -.1, 1), -.005); tip = fb + V(s * .03, -.02, .12)
    C.parts_head.append(glied('Fuehler', [fb, fb + V(s * .015, -.01, .06), tip], [.006, .005, .004], ring=6, n=8, regn='stiel'))
    gb = blob('Leuchtkugel', tip, (.022,) * 3, 3); set_region(gb, 'fuehler'); C.parts_head.append(gb)
for k in range(4):
    a = (k - 1.5) * .35; p, n = hsurf((a * .5, -.3, .9), -.006); C.parts_head.append(bueschel(p, n * .5 + V(a * .3, -.3, .6), .045, .03, 'fell_kopf', dick=1.0))
augen(.046, xn=.42, yn=-.86, zn=.08, spread=.32, lid_col='#fcecb8')
maul(w=.14, z=-.45, smile=.14)
zusammen(body_parts=parts, body_max=3200, head_max=3600)
C.DIR = os.path.dirname(OUT) or '.'
if FORM: form_bild([C.HEAD, C.BODY, C.EYE_OBJ], .55); sys.exit(0)
C.FX = [('fx_laterne', tuple(C.TAILV[1]), tuple(C.TAILV[1] + V(0, .02, -.04)), 'tail1')]
for s in (-1, 1): C.FX.append(('fx_fuehler.' + ('L' if s > 0 else 'R'), tuple(hsurf((s * .2, -.1, 1))[0] + V(s * .03, -.02, .12)), tuple(hsurf((s * .2, -.1, 1))[0] + V(s * .03, -.02, .15)), 'head'))
rig_schwebend()
def paint(P):
    X, Y, Z, M, mix = P.X, P.Y, P.Z, P.M, P.mix; hx, hy, hz = P.hx, P.hy, P.hz
    mix(M('fell_kopf'), '#b79ae2', ss(.35, .55, np.abs(hx) - .9) * (np.abs(X) > HR[0] * 1.1))          # Ohrspitzen lavendel
    mix(M('fell'), '#b79ae2', .8 * ss(z0 + .02, z0 - .02, Z)); mix(M('fell_kopf'), '#ffb0b8', .35 * ss(.25, .1, np.sqrt((np.abs(hx) - .55) ** 2 + (hz + .25) ** 2)) * (hy < -.3))
    mix(M('fluegel'), '#d8c0ff', .5 * ss(.06, .16, np.abs(X))); mix(M('laterne'), '#fff6c8', .5 * ss(z0 - .02, z0 - .14, Z))
standard_ablauf(OUT, body_allowed_schwebe, clips_schwebend, paint, ('#7a52c8', '#2a1060', '#c8a8ff'), fur_scale=1.0, nstr=.35, ohren=False)
