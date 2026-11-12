# Funki – Teil 2 (von funki.py ausgeführt): Rig (35 Knochen), Gewichte, Shape Keys, Fell-Textur + Normalkarte, Clips, Export.
# Gesichts-Normalen weich (Ellipsoid), außer Schnauze/Nase
def face_w(p):
    d = p - HC; return .6 * ss(.0, .5, -d.y / HR[1]) * (1 - ss(.75, 1.05, -d.y / HR[1])) * ss(-.9, -.5, d.z / HR[2])
ellipsoid_normals(HEAD, HC + Vector((0, .01, 0)), (HR[0] * 1.05, HR[1] * 1.1, HR[2] * 1.05), face_w)

# ---------------- Rig ----------------
def S_(p, s): return p if s > 0 else mx(p)
TP = bezier([tuple(p) for p in TAIL], 6)
B = [('root', (0, 0, 0), (0, 0, .08), None), ('hips', tuple(SPINE[0]), tuple(SPINE[1]), 'root'), ('spine1', tuple(SPINE[1]), tuple(SPINE[2]), 'hips'),
     ('spine2', tuple(SPINE[2]), tuple(SPINE[3]), 'spine1'), ('chest', tuple(SPINE[3]), tuple(NECK[0]), 'spine2'), ('neck1', tuple(NECK[0]), tuple(NECK[1]), 'chest'),
     ('neck2', tuple(NECK[1]), tuple(HC + Vector((0, .02, -.04))), 'neck1'), ('head', tuple(HC + Vector((0, .02, -.04))), tuple(HC + Vector((0, -.02, .1))), 'neck2')]
for i in range(5): B.append(('tail%d' % (i + 1), tuple(TP[i]), tuple(TP[i + 1]), 'hips' if i == 0 else 'tail%d' % i))
for s in (-1, 1):
    k = 'L' if s > 0 else 'R'; F = [S_(p, s) for p in FL]; Hh = [S_(p, s) for p in HL]; C, f = EYES[s]; eb, eu = EARS[s]
    B += [('eye.' + k, tuple(C), tuple(C + f * .02), 'head'), ('ear1.' + k, tuple(eb), tuple(eb + eu * .07), 'head'), ('ear2.' + k, tuple(eb + eu * .07), tuple(eb + eu * .15), 'ear1.' + k),
          ('scapula.' + k, tuple(S_(Vector((.03, -.06, .26)), s)), tuple(F[0]), 'chest'), ('upper_f.' + k, tuple(F[0]), tuple(F[1]), 'scapula.' + k),
          ('lower_f.' + k, tuple(F[1]), tuple(F[2]), 'upper_f.' + k), ('paw_f.' + k, tuple(F[2]), tuple(F[3] + Vector((0, -.03, 0))), 'lower_f.' + k),
          ('thigh.' + k, tuple(Hh[0]), tuple(Hh[1]), 'hips'), ('shin.' + k, tuple(Hh[1]), tuple(Hh[2]), 'thigh.' + k), ('meta.' + k, tuple(Hh[2]), tuple(Hh[3]), 'shin.' + k),
          ('paw_h.' + k, tuple(Hh[3]), tuple(Hh[3] + Vector((0, -.035, 0))), 'meta.' + k)]
ARMO = armature('Funki_Rig', B); log('Knochen', len(B))
for o in (HEAD, BODY, EYE): bind(o, ARMO)
def head_fixed(co, r):
    for s in (-1, 1):
        eb, eu = EARS[s]; t = (co - eb).dot(eu)
        if t > -.005 and (co - eb - eu * t).length < .07 and co.z > HC.z + .03:
            w2 = ss(.04, .1, t); return {'head': 1 - ss(0, .04, t), ('ear1.' + ('L' if s > 0 else 'R')): ss(0, .04, t) * (1 - w2), ('ear2.' + ('L' if s > 0 else 'R')): w2}
    return {'head': 1}
weights_capsule(HEAD, ARMO, lambda co, r: ['head'], fixed=head_fixed, smooth_it=1)
weights_capsule(EYE, ARMO, lambda co, r: ['eye.L'], fixed=lambda co, r: {'eye.L' if co.x > 0 else 'eye.R': 1})
def body_allowed(co, r):
    k = 'L' if co.x > 0 else 'R'
    if r == 'flamme': return ['tail4', 'tail5']
    if co.y > .16 and co.z > .2: return ['hips'] + ['tail%d' % i for i in range(1, 6)]
    return ['hips', 'spine1', 'spine2', 'chest', 'neck1', 'neck2', 'scapula.' + k, 'upper_f.' + k, 'lower_f.' + k, 'paw_f.' + k, 'thigh.' + k, 'shin.' + k, 'meta.' + k, 'paw_h.' + k]
weights_capsule(BODY, ARMO, body_allowed, fall=5, smooth_it=3)

# ---------------- Shape Keys ----------------
def gw(o, name):
    gi = o.vertex_groups[name].index if name in o.vertex_groups else -1; out = {}
    for v in o.data.vertices:
        for g in v.groups:
            if g.group == gi: out[v.index] = g.weight
    return out
LIDS = {(w, s): gw(HEAD, 'lid_%s_%s' % (w, 'L' if s > 0 else 'R')) for w in 'ou' for s in (-1, 1)}
ROW = gw(HEAD, 'mund_reihe'); COL = gw(HEAD, 'mund_spalte')
def eye_frame(s):
    C, f = EYES[s]; r = Vector((0, 0, 1)).cross(f).normalized() * (-s); u = f.cross(r).normalized() * (-s)
    if u.z < 0: u = -u
    return C, f, r, u
def lid_move(co, s, which, ao=0, au=0, wide=0):
    C, f, r, u = eye_frame(s); q = co - C; R_ = q.length
    ph = math.degrees(math.atan2(q.dot(r), q.dot(f))); th = math.degrees(math.asin(max(-1, min(1, q.dot(u) / R_))))
    if which == 'o':
        e0, e1 = th_u(ph), th_l(ph) + .6; tgt = lerp(e0, e1, ao) + wide
        th2 = tgt + (th - e0) * (80 - tgt) / max(1e-3, 80 - e0) if th >= e0 - 3 else th + (tgt - e0)
    else:
        e0 = th_l(ph); tgt = e0 + au * (th_u(ph) - e0) * .45
        th2 = tgt + (th - e0) * (-75 - tgt) / min(-1e-3, -75 - e0) if th <= e0 + 3 else th + (tgt - e0)
    a, b = math.radians(ph), math.radians(th2); return C + (f * (math.cos(b) * math.cos(a)) + r * (math.cos(b) * math.sin(a)) + u * math.sin(b)) * R_
def sk_lids(ao=0, au=0, wide=0):
    def fn(i, co, reg):
        for (w, s), G_ in LIDS.items():
            if i in G_: return lid_move(co, s, w, ao, au, wide)
        return None
    return fn
def sk_maul(opn, smile=0):
    def fn(i, co, reg):
        if i in ROW:
            j = round(ROW[i] * 5) - 1; k = round(COL[i] * 9) - 1; t = k / 8 * 2 - 1; lens = (1 - t * t) ** .7
            zc = -.5 + .1 * t * t - .02 + smile * .06 * t * t; return mpt(t * .3 * (1 + .15 * opn), zc - (j / 4) * opn * lens * 2.2, .0012)
        if reg == 'lidlinie' and opn and (co - HC).z < -.03 and (co - HC).y < -.06 and abs(co.x) < .04 and i not in sum([list(g.keys()) for g in LIDS.values()], []):
            return None
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
        for s in (-1, 1):
            eb, eu = EARS[s]; t = (co - eb).dot(eu)
            if t > 0 and (co - eb - eu * t).length < .07 and co.z > HC.z + .03:
                ax = Vector((0, 1, 0)).cross(eu).normalized(); return eb + Quaternion(ax, ang * s * ss(0, .1, t)) @ (co - eb)
        return None
    return fn
shape_key(HEAD, 'Blinzeln', sk_lids(1, .3))
shape_key(HEAD, 'Augen_froh', sk_lids(.55, 1))
shape_key(HEAD, 'Maul_auf', sk_maul(.16, .3))
shape_key(HEAD, 'Staunen', sk_combo(sk_lids(0, 0, 7), ears_mv(-.25)))
shape_key(HEAD, 'Ohren_an', ears_mv(.5))
log('Shape Keys', [k.name for k in HEAD.data.shape_keys.key_blocks])
for o in (HEAD, BODY, EYE): write_masks(o)

# ---------------- UV + Backen + Malen ----------------
dec_uv = {li: tuple(HEAD.data.uv_layers['UVMap'].data[li].uv) for p in HEAD.data.polygons if HEAD.data.materials[p.material_index].name == 'mund_innen' for li in p.loop_indices}
uv_atlas([HEAD, BODY], lambda o, c: 1.7 if o is HEAD and (c - HC).y < .02 else 1.15 if o is HEAD else 1.0, margin=.006)
for li in dec_uv: HEAD.data.uv_layers['UVMap'].data[li].uv = (.9995, .9995)   # beim Backen: Aufkleber auf einen Punkt (gehört zur Augen-Textur)
W_ = bpy.data.worlds.new('W'); bpy.context.scene.world = W_; W_.light_settings.distance = .04
OBJS = [HEAD, BODY]
rid = bake_emit(OBJS, 'id', TEX); RID = np.floor(rid[..., 0] * 256).astype(int) - 1; COV = RID >= 0
Pm = bake_emit(OBJS, 'pos', TEX)[..., :3]; ao = bake(OBJS, 'AO', TEX, samples=40)[..., 0]
NAMES = {v['id']: k for k, v in REG.items()}
log('RID', {NAMES.get(i, i): int((RID == i).sum()) for i in np.unique(RID)})
def hash3(ix, iy, iz):
    h = (ix * 374761393 + iy * 668265263 + iz * 1274126177) & 0xffffffff; h = (h ^ (h >> 13)) * 1274126177 & 0xffffffff; return ((h ^ (h >> 16)) & 0xffff) / 65535.0
def vnoise(P, f):
    Q = P * f; I = np.floor(Q).astype(np.int64); Fr_ = Q - I; Fr_ = Fr_ * Fr_ * (3 - 2 * Fr_); out = 0
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                w = (Fr_[..., 0] if dx else 1 - Fr_[..., 0]) * (Fr_[..., 1] if dy else 1 - Fr_[..., 1]) * (Fr_[..., 2] if dz else 1 - Fr_[..., 2])
                out = out + w * hash3(I[..., 0] + dx, I[..., 1] + dy, I[..., 2] + dz)
    return out
X, Y, Z = Pm[..., 0], Pm[..., 1], Pm[..., 2]
col = np.zeros((TEX, TEX, 3), np.float32); hgt = np.zeros((TEX, TEX), np.float32)
for i, nm in NAMES.items():
    m = RID == i
    if m.any(): col[m] = hexrgb(REG[nm]['col'])
def M(*names): return np.isin(RID, [REG[n]['id'] for n in names])
def mix(mask, c, a=1.0):
    a = np.clip(a, 0, 1) * mask; col[:] = col * (1 - a[..., None]) + hexrgb(c) * a[..., None]
fur = M('fell', 'fell_kopf', 'creme', 'pfote', 'ohr_innen', 'lid')
# Fellstriche: Rumpf längs (y), Beine/Rute längs der Glieder → gestreckte Rauschfelder
dY = vnoise(Pm * np.array([1, .22, 1]), 520); dZ = vnoise(Pm * np.array([1, 1, .22]), 520); legs = (Z < .16) & (np.abs(Y) < .2)
tailm = (Y > .17) & (Z > .2); dT = vnoise(Pm * np.array([1, .45, .45]), 480)
streak = np.where(legs, dZ, np.where(tailm, dT, dY))
body_c = M('fell', 'fell_kopf')
# Zeichnung: Rücken dunkler, Bauch/Brust/Kehle/Schnauze/Wangen/Pfoten creme, Ohrspitzen dunkel, Stirnflamme
mix(body_c, '#d9581c', .45 * ss(.25, .29, Z) * (np.abs(Y) < .16) * (Z < .33))
belly = (Z < .2) & (np.abs(X) < .045) & (Y > -.13) & (Y < .13)
mix(body_c, '#f7e3c4', ss(.17, .14, Z) * ss(.06, .03, np.abs(X)) * (np.abs(Y) < .13))
chest = ss(.075, .05, np.sqrt(X ** 2 + ((Z - .21) * .55) ** 2)) * (Y < -.07) * (Y > -.2)
mix(body_c, '#f7e3c4', chest)
dh = Pm - np.array(HC); hx, hy, hz = dh[..., 0] / HR[0], dh[..., 1] / HR[1], dh[..., 2] / HR[2]
muzzle = ss(.55, .75, -hy) * ss(.05, -.15, hz) ; cheeks = ss(.5, .25, np.sqrt((np.abs(hx) - .7) ** 2 + (hz + .45) ** 2)) * ss(-.2, .3, -hy)
mix(M('fell_kopf'), '#f7e3c4', np.clip(muzzle + cheeks + ss(-.55, -.8, hz) * ss(.0, .4, -hy), 0, 1))
mix(M('fell_kopf') & (Z > HC.z + .09), '#7a2a12', ss(HC.z + .2, HC.z + .25, Z))                 # Ohrspitzen
mix(M('fell'), '#f7e3c4', ss(.065, .045, Z) * legs)                                                 # Socken
mix(M('fell'), '#ffd27a', ss(.47, .53, Z) * tailm); mix(M('fell'), '#fff1b0', ss(.53, .57, Z) * tailm)   # Rute geht in Flamme über
# Stirnflamme: drei Zungen
fx_, fz_ = dh[..., 0], dh[..., 2] - HR[2] * .45
fl = np.zeros(X.shape, bool)
for cx, h_, w_ in ((0, .055, .02), (-.022, .036, .013), (.022, .036, .013)):
    t_ = (fz_ + .01) / h_; fl |= (t_ > 0) & (t_ < 1) & (np.abs(fx_ - cx - .006 * np.sin(t_ * 5)) < w_ * (1 - t_) ** .7) & (dh[..., 1] < -.02)
mix(M('fell_kopf'), '#ffc83a', fl.astype(np.float32)); mix(M('fell_kopf') & fl, '#fff2b8', ss(.5, 0, np.abs(fx_) / .02) * .6)
mix(M('flamme'), '#ff8a1a', ss(.52, .47, Z)); mix(M('flamme'), '#fff3c0', ss(.57, .65, Z) * .7)
mix(M('lid'), '#e06a24', .5)
col *= (1 + (streak[..., None] - .5) * .12 * fur[..., None])
hgt += fur * (streak - .5) * 1.2
mix(M('ohr_innen'), '#fbe9d6', .4 * ss(.5, .8, streak))
mix(M('nase'), '#4a3434', ss(.0, 1, (Z - (HC.z - .04)) * 90) * .5)
aoN = np.clip(ao, 0, 1); col *= (.55 + .45 * aoN)[..., None]; col = np.clip(col, 0, 1)
alb = dilate(col, COV, 6); alb = np.where(COV[..., None], col, alb)
IMG_ALB = to_image(alb, 'Funki_Farbe')
hg = dilate(np.repeat(hgt[..., None], 3, 2), COV, 4)[..., 0]
nrm = height_to_normal_bake(OBJS, hg * .5 + .5, TEX, strength=.35); IMG_NRM = to_image(nrm[..., :3], 'Funki_Normal', 'Non-Color')
save_png(alb, os.path.join(DIR, 'funki_farbe.png'))
# Augen-/Maul-Textur
TW, TH = 512, 256; tex = np.zeros((TH, TW, 4), np.float32); tex[..., 3] = 1
vv, uu = np.mgrid[0:TH, 0:TW].astype(np.float32); u = (uu + .5) / TW; v = (vv + .5) / TH; ex = (u - .25) / .25; ey = (v - .5) / .5; rr = np.sqrt(ex ** 2 + ey ** 2)
def put(mask, c, a=1.0):
    a = np.clip(a, 0, 1) * mask; tex[..., :3] = tex[..., :3] * (1 - a[..., None]) + hexrgb(c) * a[..., None]
L_ = u < .5; put(L_, '#2a160e')                                         # Tieraugen: fast nur Iris
IR = .62; iris = L_ & (rr < IR); ang = np.arctan2(ey, ex)
put(iris, '#d87a1e'); put(iris, '#8a3a10', ss(-.1, .5, ey)); put(iris, '#ffc24a', .7 * ss(0, -.5, ey) * ss(.2, .5, rr)); put(iris, '#a8501a', .3 * (.5 + .5 * np.sin(ang * 21)) * ss(.25, .55, rr))
put(iris, '#3a1608', ss(.5, .6, rr)); put(L_ & (rr < .3), '#140806')
put(L_, '#ffffff', ((ex - .2) ** 2 + (ey - .22) ** 2 < .12 ** 2).astype(np.float32)); put(L_, '#ffffff', .85 * ((ex + .2) ** 2 + (ey + .2) ** 2 < .055 ** 2))
Rm = (u >= .5) & (v < .5); mxn = (u - .5) / .5; myn = v / .5; inside = (np.abs(2 * mxn - 1) ** 2.2 + np.abs(2 * myn - 1) ** 2) < 1
put(Rm, '#6a2028'); put(Rm, '#e07a80', (((2 * mxn - 1) / .5) ** 2 + ((myn - .15) / .3) ** 2 < 1).astype(np.float32))
for cx in (.25, .75): put(Rm, '#fbf6ee', ((np.abs(mxn - cx) < .05 * (myn - .62) / .38) & (myn > .62)).astype(np.float32))   # kleine Fangzähne
put(Rm, '#3a1a10', ss(.8, .98, np.abs(2 * mxn - 1) ** 2.2 + np.abs(2 * myn - 1) ** 2))
tex[..., 3] = np.where(Rm, inside.astype(np.float32), 1.0); IMG_EYE = to_image(tex, 'Funki_Augen'); save_png(tex, os.path.join(DIR, 'funki_augen.png'))
for li, uvv in dec_uv.items(): HEAD.data.uv_layers['UVMap'].data[li].uv = uvv
MAT_MAIN = final_material('Funki_Haupt', IMG_ALB, IMG_NRM); MAT_EYE = final_material('Funki_Augen', IMG_EYE)
nt = MAT_EYE.node_tree; tn = [n for n in nt.nodes if n.type == 'TEX_IMAGE'][0]; nt.links.new(tn.outputs['Alpha'], nt.nodes['Principled BSDF'].inputs['Alpha'])
swap_materials(BODY, MAT_MAIN)
me = HEAD.data; mats = list(me.materials); pidx = [1 if mats[p.material_index].name == 'mund_innen' else 0 for p in me.polygons]
me.materials.clear(); me.materials.append(MAT_MAIN); me.materials.append(MAT_EYE)
for p, i in zip(me.polygons, pidx): p.material_index = i
EYE.data.materials.clear(); EYE.data.materials.append(MAT_EYE)

# ---------------- Clips (Vierbeiner-IK in der Seitenebene) ----------------
import math as m_
def ang(v): return m_.atan2(v.z, v.y)
def ik2(A, Bk, Cc, T, sign):
    """2-Glieder-IK (y,z-Ebene): Ruhe A→Bk→Cc, Ziel T für Cc; sign = Knick-Richtung → (θ oben, θ unten relativ)"""
    a = (Bk - A).length; b = (Cc - Bk).length; d = T - A; d2 = Vector((0, d.y, d.z)); L = max(.01, min(a + b - 1e-4, d2.length))
    al = m_.acos(max(-1, min(1, (a * a + L * L - b * b) / (2 * a * L)))); base = m_.atan2(d2.z, d2.y); u_ang = base + sign * al
    kn = Vector((0, m_.cos(u_ang), m_.sin(u_ang))) * a; lo = Vector((0, d2.y, d2.z)) * (L / d2.length) - kn
    t1 = u_ang - ang(Bk - A); t2 = ang(lo) - ang(Cc - Bk) - t1; return t1, t2
def leg_f(s, T, root_off, paw_pitch=0):
    F = [S_(p, s) for p in FL]; k = 'L' if s > 0 else 'R'; t1, t2 = ik2(F[0] + root_off, F[1] + root_off, F[2] + root_off, T, -1)
    return {'upper_f.' + k: rx(t1), 'lower_f.' + k: rx(t2), 'paw_f.' + k: rx(-(t1 + t2) + paw_pitch)}
def leg_h(s, T, root_off, paw_pitch=0):
    Hh = [S_(p, s) for p in HL]; k = 'L' if s > 0 else 'R'; mv = Hh[3] - Hh[2]
    t1, t2 = ik2(Hh[0] + root_off, Hh[1] + root_off, Hh[2] + root_off, T - mv, 1)
    return {'thigh.' + k: rx(t1), 'shin.' + k: rx(t2), 'meta.' + k: rx(-(t1 + t2) + paw_pitch * .5), 'paw_h.' + k: rx(paw_pitch * .5)}
def foot_path(u, stance, Lstep, lift):
    if u < stance: w = u / stance; return Lstep * (.5 - w), 0.0
    w = (u - stance) / (1 - stance); e = .5 - .5 * m_.cos(m_.pi * w); return Lstep * (-.5 + e), lift * m_.sin(m_.pi * w)
def tail_sway(t, amp, base=0.0, up=0.0):
    return {'tail%d' % (i + 1): qmul(rz(amp * m_.sin(2 * m_.pi * t - i * .7) * (.5 + .15 * i)), rx(up * (1 if i < 2 else .3))) for i in range(5)}
def quad_gait(t, Lw, stance, lift, offs, bob, run=False):
    P = {}; ph = 2 * m_.pi * t; root = Vector((0, 0, -.004 - bob * (.5 + .5 * m_.cos(2 * ph)))); P['hips:loc'] = root
    P['spine1'] = rx(.03 * m_.sin(ph * 2) * (2 if run else 1)); P['chest'] = rz(.05 * m_.sin(ph)); P['neck1'] = rx(-.03 * m_.sin(2 * ph)); P['head'] = rx(.04 * m_.sin(2 * ph + .6))
    for s in (-1, 1):
        k = 'L' if s > 0 else 'R'
        u = (t + offs['f' + k]) % 1; dy, dz = foot_path(u, stance, Lw, lift); F = S_(FL[2], s); P.update(leg_f(s, F + Vector((0, -dy, dz)), root, .5 * dz / max(lift, 1e-3)))
        u = (t + offs['h' + k]) % 1; dy, dz = foot_path(u, stance, Lw, lift); Hh = S_(HL[3], s); P.update(leg_h(s, Hh + Vector((0, -dy, dz)), root, .6 * dz / max(lift, 1e-3)))
    P.update(tail_sway(t, .18 if not run else .1, up=-.1 if run else 0)); return P
def idle(t):
    ph = 2 * m_.pi * t; br = m_.sin(ph * 3); P = {'hips:loc': Vector((0, 0, -.002 + .001 * br)), 'spine2': rx(.012 * br), 'chest': rx(.02 * br),
        'neck1': rx(.03 * m_.sin(ph)), 'head': qmul(ry(.18 * ss(.35, .55, .5 + .5 * m_.sin(ph)) * m_.sin(ph)), rx(-.04 * m_.sin(ph * 2)))}
    for s in (-1, 1):
        k = 'L' if s > 0 else 'R'; tw = ss(.84, .88, t) * ss(.94, .9, t) * (s > 0)          # Ohrzucken
        P['ear1.' + k] = rx(-.25 * tw); P['ear2.' + k] = rx(-.15 * tw)
        P.update(leg_f(s, S_(FL[2], s), Vector((0, 0, -.002))))
        P.update(leg_h(s, S_(HL[3], s), Vector((0, 0, -.002))))
    P.update(tail_sway(t * 2, .22, up=.05)); return P
def attack(t):
    """Ducken (0–35 %), Sprung nach vorn mit Schnapp-Kopf (35–60 %), zurück (60–100 %)"""
    c = ss(0, .35, t) * (1 - ss(.35, .45, t)); j = ss(.35, .5, t) * (1 - ss(.62, 1, t)); P = {}
    root = Vector((0, -.09 * j, -.03 * c + .035 * m_.sin(m_.pi * min(1, max(0, (t - .35) / .3))))); P['hips:loc'] = root
    P['spine1'] = rx(.12 * c - .1 * j); P['chest'] = rx(.1 * c - .12 * j); P['neck1'] = rx(.15 * c - .25 * j); P['head'] = rx(.1 * c - .3 * j * (1 - ss(.5, .6, t)))
    for s in (-1, 1):
        k = 'L' if s > 0 else 'R'; P['ear1.' + k] = rx(.4 * c)
        P.update(leg_f(s, S_(FL[2], s) + Vector((0, -.1 * j, .05 * j * (1 - ss(.5, .62, t)))), root))
        P.update(leg_h(s, S_(HL[3], s) + Vector((0, .02 * c, 0)), root))
    P.update(tail_sway(t, .1, up=.25 * c - .2 * j)); return P
def joy(t):
    h = m_.sin(m_.pi * ss(.1, .55, t)) * (1 - ss(.55, .7, t)); P = {}; root = Vector((0, 0, .07 * h - .015 * ss(0, .1, t) * (1 - ss(.1, .2, t)))); P['hips:loc'] = root
    P['chest'] = rx(-.12 * h); P['head'] = qmul(rx(-.18 * h), rz(.15 * m_.sin(t * 4 * m_.pi)))
    for s in (-1, 1):
        k = 'L' if s > 0 else 'R'; P['ear1.' + k] = rx(-.2 * h)
        P.update(leg_f(s, S_(FL[2], s) + Vector((0, -.02 * h, .05 * h)), root)); P.update(leg_h(s, S_(HL[3], s) + Vector((0, .01 * h, .02 * h)), root))
    P.update(tail_sway(t * 3, .45, up=.15)); return P
def hit(t):
    k_ = m_.sin(m_.pi * min(1, t * 2.5)) * (1 - t); P = {'hips:loc': Vector((0, .04 * k_, -.01 * k_)), 'chest': rx(.12 * k_), 'head': qmul(rx(.25 * k_), ry(.2 * k_))}
    for s in (-1, 1):
        kk = 'L' if s > 0 else 'R'; P['ear1.' + kk] = rx(.5 * k_); P.update(leg_f(s, S_(FL[2], s), P['hips:loc'])); P.update(leg_h(s, S_(HL[3], s), P['hips:loc']))
    P.update(tail_sway(t, .05, up=.2 * k_)); return P
make_action(ARMO, 'idle', 90, idle)
make_action(ARMO, 'walk', 24, lambda t: quad_gait(t, .42 * .6, .6, .035, {'hL': 0, 'fL': .25, 'hR': .5, 'fR': .75}, .006))
make_action(ARMO, 'run', 15, lambda t: quad_gait(t, .8 * .4, .4, .06, {'hL': 0, 'hR': .08, 'fL': .5, 'fR': .58}, .02, run=True))
make_action(ARMO, 'attack', 24, attack, loop=False)
make_action(ARMO, 'joy', 30, joy, loop=False)
make_action(ARMO, 'hit', 15, hit, loop=False)
rest_pose(ARMO)
export_glb(OUT, [HEAD, BODY, EYE], ARMO)
meta = {'modell': 'funki', 'dreiecke': {'kopf': tris(HEAD), 'koerper': tris(BODY), 'augen': tris(EYE)}, 'knochen': len(B), 'shapeKeys': [k.name for k in HEAD.data.shape_keys.key_blocks][1:],
        'clips': ['idle', 'walk', 'run', 'attack', 'joy', 'hit'], 'textur': TEX, 'bauzeit_s': round(time.time() - T0, 1)}
meta['dreiecke']['gesamt'] = sum(meta['dreiecke'].values()); json.dump(meta, open(OUT.replace('.glb', '.json'), 'w'), indent=1); log('META', json.dumps(meta))
