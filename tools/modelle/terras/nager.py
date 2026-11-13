# Route-1-Wildart 112 Knabbi (Biber, Vierbeiner klein, Sohlengänger): rundlich, Kellenschwanz mit Schuppen, Nagezähne. Eigener Entwurf nach docs/terras.md (Nussbraun/Creme).
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tbau import *
OUT = [a for a in sys.argv[1:] if a.endswith('.glb')]; OUT = OUT[0] if OUT else '/tmp/t112.glb'
FORM = '--form' in sys.argv
start('t112', .42)
treg('fell', '#b8865a'); treg('fell_kopf', '#b8865a'); treg('creme', '#f6e6cc'); treg('ohr_innen', '#e8c8a8'); treg('nase', '#3a2420', 'nase')
treg('kelle', '#6a5a52', 'schuppe'); treg('zahn', '#fff4d8', 'horn'); treg('kralle', '#4a3428', 'kralle'); treg('ballen', '#5a4038', 'haut')
C.TAILREG = ('kelle',)
Lb, Lh, Wx = .26, .17, .07
C.SPINE = [V(0, Lb * .5, Lh), V(0, Lb * .2, Lh * 1.08), V(0, -Lb * .12, Lh * 1.1), V(0, -Lb * .38, Lh * 1.06)]
C.NECK = [C.SPINE[3] + V(0, -.03, .02), C.SPINE[3] + V(0, -.06, .04)]
C.FL = [V(Wx, -Lb * .36, Lh * .9), V(Wx * 1.05, -Lb * .34, Lh * .5), V(Wx * 1.05, -Lb * .4, Lh * .16), V(Wx * 1.05, -Lb * .47, .015)]
C.HL = [V(Wx * 1.1, Lb * .48, Lh * .85), V(Wx * 1.2, Lb * .32, Lh * .5), V(Wx * 1.2, Lb * .5, Lh * .16), V(Wx * 1.15, Lb * .42, .015)]
C.TAIL = [C.SPINE[0] + V(0, .05, -.03), C.SPINE[0] + V(0, .12, -.07), C.SPINE[0] + V(0, .2, -.09)]
HR = (.11, .105, .095); HC = C.NECK[1] + V(0, -.06, .05)
body = glied('Rumpf', [C.SPINE[0] + V(0, .06, -.02)] + C.SPINE + C.NECK + [HC + V(0, .04, -.02)], [(.08, .07), (.115, .11), (.125, .12), (.12, .115), (.105, .1), (.085, .08), (.075, .072), (.065, .065)], ring=20, n=36, regn='fell')
legs = []
for s in (-1, 1):
    F = [S_(p, s) for p in C.FL]; Hh = [S_(p, s) for p in C.HL]
    legs.append(glied('BeinV', [F[0] + V(-F[0].x * .4, 0, .02), F[0], F[1], F[2], F[3] + V(0, -.005, .01)], [(.04, .045), (.04, .045), (.03, .032), (.026, .024), (.03, .016)], ring=10, n=20, flat=(0, -1, 0), regn='fell'))
    legs.append(glied('BeinH', [Hh[0] + V(-Hh[0].x * .4, 0, .02), Hh[0], Hh[1], Hh[2], Hh[3] + V(0, -.005, .01)], [(.055, .06), (.055, .06), (.04, .045), (.028, .026), (.034, .016)], ring=10, n=20, flat=(0, -1, 0), regn='fell'))
    for PP in (F, Hh):
        pw = blob('Pfote', PP[3] + V(0, -.02, .008), (.032, .042, .016), 3, lambda v, q: Vector((q.x, q.y, max(q.z, -.008)))); set_region(pw, 'ballen'); legs.append(pw)
# Kelle: breit, flach, geschuppt
kelle = glied('Kelle', C.TAIL, [(.03, .014), (.07, .016), (.055, .012)], ring=12, n=14, flat=(0, 0, 1), regn='kelle')
body = join([body] + legs + [kelle], 'Rumpf')
BVB = BVHTree.FromObject(body, bpy.context.evaluated_depsgraph_get())
kopf(HC, HR, sn=.45, sn_drop=.1, sn_w=.05, sn_s=.5, stirn=.04, mulde=.04, backen=.14)
np_, nn = hsurf((0, -1, -.15)); C.NOSE = np_
nose = blob('Nase', np_ + nn * .003, (.02, .012, .014), 3); set_region(nose, 'nase'); C.parts_head.append(nose)
for s in (-1, 1):
    zp, zn = hsurf((s * .09, -1, -.55), -.004); z = blob('Zahn', zp + V(0, -.004, -.012), (.011, .006, .017), 2); set_region(z, 'zahn'); C.parts_head.append(z)
    base, bn = hsurf((s * .62, .2, .62), -.008); C.parts_head.append(ohr(s, base, Vector((s * .8, .2, 1)).normalized(), Vector((0, -1, .3)).normalized(), .04, .032, .022, cup=.9, rund=1, regs=('fell_kopf', 'ohr_innen'), NU=6, NA=10))
    for k in range(2):
        p, n = hsurf((s * .9, -.25 + k * .1, -.3 - k * .1), -.006); C.parts_head.append(bueschel(p, n + V(s * .3, .6, -.3), .04, .022, 'creme', dick=1.0))
augen(.034, xn=.5, yn=-.82, zn=.12, spread=.45, lid_col='#b8865a')
maul(w=.18, z=-.42, smile=.12)
zusammen(body_parts=[body], body_max=3200, head_max=3600)
C.DIR = os.path.dirname(OUT) or '.'
if FORM: form_bild([C.HEAD, C.BODY, C.EYE_OBJ], .42); sys.exit(0)
rig_vierbeiner(2, ohren=True)
def paint(P):
    X, Y, Z, M, mix = P.X, P.Y, P.Z, P.M, P.mix; hx, hy, hz = P.hx, P.hy, P.hz
    mix(M('fell_kopf'), '#f6e6cc', ss(.45, .7, -hy) * ss(.2, -.3, hz)); mix(M('fell'), '#f6e6cc', ss(Lh - .02, Lh - .09, Z) * ss(.07, .03, np.abs(X)) * (Y < .1))
    mix(M('fell'), '#8a5a36', .45 * ss(Lh + .05, Lh + .11, Z)); mix(M('fell_kopf'), '#ffb0a0', .3 * ss(.25, .1, np.sqrt((np.abs(hx) - .6) ** 2 + (hz + .2) ** 2)) * (hy < -.3))
standard_ablauf(OUT, body_allowed_vb, lambda: clips_vierbeiner(dict(wL=.07, rL=.13, wLift=.025, rLift=.045, bob=.006, plant=True, tail=.12)), paint, ('#5a3418', '#2a1408', '#a87040'), fur_scale=1.0, nstr=.4)
