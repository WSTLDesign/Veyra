# Noa – Teil 2 (wird von noa.py ausgeführt): Rig, Gewichte, Shape Keys, Textur (Backen + Malen), Clips, Export.
# Erwartet die Objekte HEAD, BODY, EYE und die Maße aus noa.py.

# ---------------- Kragen-/Saum-Korrektur fertig, jetzt Normalen im Gesicht (Ellipsoid-Mischung) ----------------
def face_w(p):
    d = p - HC; fz = -d.y / hd
    return .72 * ss(-.1, .5, fz) * ss(-1.05, -.7, d.z / hh) * (1 - ss(.55, .9, d.z / hh))
ellipsoid_normals(HEAD, HC + Vector((0, .01, -.012)), (hw * 1.02, hd * 1.05, hh * 1.05), face_w)

# ---------------- Rig: 30 Knochen ----------------
def Lr(v, s): return v if s > 0 else mx(v)
B = [('root', (0, 0, 0), (0, 0, .12), None), ('hips', (0, 0, .70), (0, 0, .80), 'root'), ('spine', (0, 0, .80), (0, 0, .92), 'hips'),
     ('chest', (0, 0, .92), (0, .005, 1.06), 'spine'), ('neck', (0, .008, 1.07), (0, .01, 1.15), 'chest'), ('head', (0, .01, 1.15), (0, .01, 1.40), 'neck'),
     ('hair_vorn', (0, -.07, 1.36), (0, -.11, 1.30), 'head'), ('hair_hinten', (0, .09, 1.33), (0, .13, 1.22), 'head')]
for s in (-1, 1):
    k = 'L' if s > 0 else 'R'; C, f = EYES[s]; S = Lr(SH, s); A = Lr(ARM, s)
    B += [('eye.' + k, tuple(C), tuple(C + f * .02), 'head'),
          ('shoulder.' + k, (s * .02, .01, 1.04), tuple(S), 'chest'), ('upperarm.' + k, tuple(S), tuple(S + A * L_UA), 'shoulder.' + k),
          ('forearm.' + k, tuple(S + A * L_UA), tuple(S + A * (L_UA + L_FA)), 'upperarm.' + k),
          ('hand.' + k, tuple(S + A * (L_UA + L_FA)), tuple(S + A * (L_UA + L_FA + .07)), 'forearm.' + k),
          ('fingers.' + k, tuple(S + A * (L_UA + L_FA + .07)), tuple(S + A * (L_UA + L_FA + .12) + Vector((-s * .015, 0, 0))), 'hand.' + k),
          ('thumb.' + k, tuple(S + A * (L_UA + L_FA + .03) + Vector((0, -.015, 0))), tuple(S + A * (L_UA + L_FA + .06) + Vector((-s * .02, -.03, -.02))), 'hand.' + k),
          ('thigh.' + k, tuple(Lr(HIP, s)), tuple(Lr(KNEE, s)), 'hips'), ('shin.' + k, tuple(Lr(KNEE, s)), tuple(Lr(ANK, s)), 'thigh.' + k),
          ('foot.' + k, tuple(Lr(ANK, s)), tuple(Lr(BALL, s)), 'shin.' + k), ('toe.' + k, tuple(Lr(BALL, s)), tuple(Lr(TOE, s)), 'foot.' + k)]
ARMO = armature('Noa_Rig', B); log('Knochen', len(B))

# ---------------- Gewichte ----------------
for o in (HEAD, BODY, EYE): bind(o, ARMO)
weights_capsule(HEAD, ARMO, lambda co, r: ['head'], fixed=lambda co, r: {'head': 1})
weights_capsule(EYE, ARMO, lambda co, r: ['eye.L'], fixed=lambda co, r: {'eye.L' if co.x > 0 else 'eye.R': 1})
HAIRR = {'haar', 'band', 'brille', 'glas'}
def body_allowed(co, r):
    s = 'L' if co.x > 0 else 'R'
    if r in ('schuh', 'sohle'): return ['foot.' + s, 'toe.' + s, 'shin.' + s]
    if co.z > 1.12: return ['neck', 'head', 'chest']
    L = ['hips', 'spine', 'chest', 'neck', 'shoulder.' + s, 'upperarm.' + s, 'forearm.' + s, 'hand.' + s, 'fingers.' + s, 'thumb.' + s, 'thigh.' + s, 'shin.' + s, 'foot.' + s]
    return L
def body_fixed(co, r):
    if r in HAIRR:
        d = co - HC; out = max(0, d.length - .12); w = ss(.0, .05, out) * .7 * (1 if r == 'haar' else 0)
        return {'head': 1 - w, ('hair_vorn' if d.y < 0 else 'hair_hinten'): w} if w > .01 else {'head': 1}
    if r in ('geraet', 'schirm'): return {'forearm.L': 1}
    return None
weights_capsule(BODY, ARMO, body_allowed, fall=5, fixed=body_fixed, smooth_it=3)

# ---------------- Shape Keys (Gesicht) ----------------
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
def lid_move(co, s, which, amt_o=0, amt_u=0, wide=0):
    C, f, r, u = eye_frame(s); q = co - C; R_ = q.length
    ph = math.degrees(math.atan2(q.dot(r), q.dot(f))); th = math.degrees(math.asin(max(-1, min(1, q.dot(u) / R_))))
    if which == 'o':
        e0, e1 = th_u(ph), th_l(ph) + .6
        tgt = lerp(e0, e1, amt_o) + wide; th2 = tgt + (th - e0) * (78 - tgt) / max(1e-3, 78 - e0) if th >= e0 - 3 else th + (tgt - e0)
    else:
        e0 = th_l(ph); tgt = e0 + amt_u * (th_u(ph) - e0) * .45
        th2 = tgt + (th - e0) * (-72 - tgt) / min(-1e-3, -72 - e0) if th <= e0 + 3 else th + (tgt - e0)
    a, b = math.radians(ph), math.radians(th2)
    return C + (f * (math.cos(b) * math.cos(a)) + r * (math.cos(b) * math.sin(a)) + u * math.sin(b)) * R_
def sk_lids(side_set, ao=0, au=0, wide=0):
    def fn(i, co, reg):
        for (w, s), G_ in LIDS.items():
            if i in G_ and s in side_set: return lid_move(co, s, w, ao, au, wide)
        return None
    return fn
shape_key(HEAD, 'Blinzeln_L', sk_lids({1}, 1, .25))
shape_key(HEAD, 'Blinzeln_R', sk_lids({-1}, 1, .25))
shape_key(HEAD, 'Augen_froh', sk_lids({1, -1}, .55, 1))
def mouth_grid(i, opn, wid, smile, oround=0):
    """Mundhöhlen-Gitter: Zeile j, Spalte k → Punkt auf der Gesichtsfläche"""
    j = round(ROW[i] * 5) - 1; k = round(COL[i] * 9) - 1; xn = (k / 8 - .5) * .36 * wid; t = 2 * k / 8 - 1
    lens = (1 - t * t) ** (.55 if oround else .8); zc = MZ + smile * .05 * t * t
    zn = zc + (j / 4 - .5) * opn * lens * 2 + opn * .02
    p, n = surf(xn, zn); return p + n * .0009
def line_pt(co, dz_fn):
    xn = co.x / hw; t = max(-1, min(1, xn / .17)); dz = dz_fn(t); p, n = surf(xn, (co.z - HC.z) / hh + dz)
    return p + n * .0007 + (co - surf(xn, (co.z - HC.z) / hh)[0]) * 0
def sk_mouth(opn, wid, smile, oround=0, line_dz=None, cheek=0, brow=None):
    def fn(i, co, reg):
        if i in ROW: return mouth_grid(i, opn, wid, smile, oround)
        if reg == 'mundlinie':
            xn = co.x / hw * wid; t = max(-1, min(1, co.x / hw / .17)); zn = (co.z - HC.z) / hh + smile * .05 * t * t + opn * (.5 * (1 - t * t) ** .8 * 2 + .02) * (1 if opn else 0)
            p, n = surf(xn, zn); return p + n * .0012
        if reg == 'haut_kopf' and cheek:
            d = co - HC; xn, zn = d.x / hw, d.z / hh
            w = gauss((abs(xn) - .45) ** 2 + ((zn + .38) * 1.2) ** 2, .16) * ss(.2, .6, -d.y / hd)
            if w > .01: return co + Vector((0, -.0025, .004)) * w * cheek
        if reg == 'braue' and brow: return brow(co)
        return None
    return fn
shape_key(HEAD, 'Laecheln', sk_mouth(0, 1.06, 1, cheek=1))
shape_key(HEAD, 'Mund_A', sk_mouth(.11, 1.0, .25))
shape_key(HEAD, 'Mund_O', sk_mouth(.1, .55, 0, 1))
def brow_mv(dz, inner=0, tilt=0):
    def f(co):
        xn = abs(co.x) / hw; w_in = ss(.5, .2, xn)
        return co + Vector((0, 0, dz + inner * w_in)) - Vector((0, .0015 * abs(inner) * w_in, 0))
    return f
def sk_combo(*fns):
    def fn(i, co, reg):
        for f in fns:
            r = f(i, co, reg)
            if r is not None: return r
        return None
    return fn
shape_key(HEAD, 'Staunen', sk_combo(sk_lids({1, -1}, 0, 0, 6), sk_mouth(0, 1, 0, brow=brow_mv(.0065))))
shape_key(HEAD, 'Aerger', sk_mouth(0, 1, -.35, brow=brow_mv(-.0015, -.005)))
shape_key(HEAD, 'Traurig', sk_mouth(0, .95, -.6, brow=brow_mv(0, .0055)))
log('Shape Keys', [k.name for k in HEAD.data.shape_keys.key_blocks])

# ---------------- Masken (Vertexfarbe) ----------------
for o in (HEAD, BODY, EYE): write_masks(o)

# ---------------- UV-Atlas (Kopf doppelte Texeldichte) ----------------
dec_uv = {l.index: tuple(HEAD.data.uv_layers['UVMap'].data[l.index].uv) for p in HEAD.data.polygons if HEAD.data.materials[p.material_index].name == 'mund_innen' for l in [HEAD.data.loops[i] for i in p.loop_indices]}
def isl(o, c):
    if o is HEAD: return 2.1 if (c - HC).y < .0 else 1.4
    if c.z < .14: return 1.1
    ac = arm_coord(c)
    if ac and ac[1] > L_UA + L_FA - .02: return 1.3
    return 1.0
uv_atlas([HEAD, BODY], isl, margin=.006)
for li in dec_uv: HEAD.data.uv_layers['UVMap'].data[li].uv = (.9995, .9995)   # beim Backen: Aufkleber auf einen Punkt (gehört zur Augen-Textur)

# ---------------- Backen: Region-ID, Position, AO ----------------
W_ = bpy.data.worlds.new('W'); bpy.context.scene.world = W_; W_.light_settings.distance = .06
OBJS = [HEAD, BODY]
rid = bake_emit(OBJS, 'id', TEX); RID = np.floor(rid[..., 0] * 256).astype(int) - 1; COV = RID >= 0
pos = bake_emit(OBJS, 'pos', TEX); Pm = pos[..., :3]
ao = bake(OBJS, 'AO', TEX, samples=48)[..., 0]
NAMES = {v['id']: k for k, v in REG.items()}
log('Abdeckung', round(COV.mean(), 3))

# ---------------- Malen (sRGB, je Texel aus 3D-Position) ----------------
def hash3(ix, iy, iz):
    h = (ix * 374761393 + iy * 668265263 + iz * 1274126177) & 0xffffffff; h = (h ^ (h >> 13)) * 1274126177 & 0xffffffff; return ((h ^ (h >> 16)) & 0xffff) / 65535.0
def vnoise(P, f):
    Q = P * f; I = np.floor(Q).astype(np.int64); Fr = Q - I; Fr = Fr * Fr * (3 - 2 * Fr); out = 0
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                w = (Fr[..., 0] if dx else 1 - Fr[..., 0]) * (Fr[..., 1] if dy else 1 - Fr[..., 1]) * (Fr[..., 2] if dz else 1 - Fr[..., 2])
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
# Körperzonen je Texel (statt Flächen-Treppen): Shirt / Hose / Haut aus 3D-Position
BOD = M('haut', 'shirt', 'hose'); armT = np.full(X.shape, -1.0)
for s_ in (-1, 1):
    S_ = SH if s_ > 0 else mx(SH); A_v = ARM if s_ > 0 else mx(ARM)
    t_ = (X - S_.x) * A_v.x + (Y - S_.y) * A_v.y + (Z - S_.z) * A_v.z
    qx, qy, qz = X - S_.x - A_v.x * t_, Y - S_.y - A_v.y * t_, Z - S_.z - A_v.z * t_; rad = np.sqrt(qx * qx + qy * qy + qz * qz)
    sel = (np.sign(X) == s_) & (np.abs(X) > .1) & (t_ > -.02) & (rad < .075) & (Z > .55); armT = np.where(sel, t_, armT)
isArm = armT > 0
zShirt = np.where(isArm, armT < .118, (Z > .655) & (Z < 1.09)); zPants = (~isArm) & (Z < .7) & (Z > .095) & ~zShirt
col[BOD] = hexrgb(REG['haut']['col']); col[BOD & zShirt] = hexrgb(REG['shirt']['col']); col[BOD & zPants] = hexrgb(REG['hose']['col'])
RID = np.where(BOD & zShirt, REG['shirt']['id'], np.where(BOD & zPants, REG['hose']['id'], np.where(BOD, REG['haut']['id'], RID)))
skin = M('haut', 'haut_kopf', 'lid')
n1 = vnoise(Pm, 90); n2 = vnoise(Pm, 300)
col *= (1 + (n1[..., None] - .5) * .04)
# Haut: Wangenröte, Nasenspitze, Ohren, Lidschatten, Knöchel
for s in (-1, 1):
    mix(skin, '#f2a596', .42 * gauss((X - s * .056) ** 2 + ((Z - (HC.z - .05)) * 1.2) ** 2, .013) * (Y < HC.y - .06))
    mix(skin, '#eab196', .5 * gauss((X - s * hw * .95) ** 2 + (Z - (HC.z - .03)) ** 2, .016))
mix(skin, '#f0aa98', .35 * gauss(X ** 2 + (Z - (HC.z + hh * -.3)) ** 2, .009) * (Y < HC.y - .09))
mix(M('lid'), '#eeb79b', .55)
# Nasenlöcher angedeutet
for s in (-1, 1): mix(skin, '#c98d78', .45 * gauss((X - s * .008) ** 2 + (Z - (HC.z + hh * -.345)) ** 2 * 3, .0028) * (Y < HC.y - .09))
mix(skin, '#e9b896', .25 * ss(1.15, 1.09, Z) * ss(1.0, 1.05, Z) * (np.abs(X) < .07))   # Hals unter dem Kinn wärmer
# Haare: dunkler zum Ansatz, Strähnenstruktur
hair = M('haar')
dist = np.sqrt((X - HC.x) ** 2 + (Y - HC.y) ** 2 + (Z - HC.z) ** 2)
mix(hair, '#5a3418', .3 * ss(.15, .125, dist))
streak = vnoise(Pm * np.array([1, 1, .25]), 420); mix(hair, '#a8703c', .35 * ss(.6, .85, streak)); mix(hair, '#55321a', .3 * ss(.4, .15, streak))
hgt += hair * (streak - .5) * .6
# Shirt: Blatt-Emblem (links auf der Brust), Nähte an den Säumen, leichte Stoffstruktur
shirt = M('shirt', 'shirt_saum', 'kragen')
ex_, ez_ = X - .058, Z - .975; ca, sa = math.cos(.5), math.sin(.5); lx = ex_ * ca - ez_ * sa; lz = ex_ * sa + ez_ * ca
leaf = (lx / .028) ** 2 + (lz / .0135) ** 2 * (1 + 1.2 * ss(-.02, .03, lx)) < 1
front = Y < -.04
mix(M('shirt') & front, '#e9d27a', leaf.astype(np.float32))
mix(M('shirt') & front, '#c9a84a', (leaf & (np.abs(lz + lx * .1) < .0018)).astype(np.float32))   # Mittelrippe
mix(M('shirt'), '#2f5f2c', .55 * (np.abs(Z - .676) < .0012) * (np.sin(np.arctan2(Y, X) * 260) > 0))   # Steppnaht unten
mix(M('shirt'), '#5f9a56', .25 * ss(.45, .9, n2))
hgt += M('shirt') * (n2 - .5) * .25 - M('shirt') * .6 * (np.abs(Z - .676) < .0015)
mix(M('kragen'), '#d8ccb2', .3 * (np.sin(np.arctan2(Y, X) * 90) > .3))
# Hose: Seitennaht, Kniefalte, Taschennaht, Stoff
pants = M('hose', 'tasche')
side = np.abs(np.abs(X) - .074) - .0 ; outer = (np.abs(X) > .11) & (np.abs(Y + .0) < .006 + .0)
mix(pants, '#4e3420', .7 * outer)
mix(pants, '#7a5a3c', .3 * ss(.5, .9, n2)); hgt += pants * (n2 - .5) * .3 - pants * outer * .8
mix(M('tasche'), '#4a3220', .5 * (vnoise(Pm, 700) > .8))
# Schuhe: Zehenkappe, grüner Seitenstreifen, Schnürsenkel (Signatur), Ösen
shoe = M('schuh')
for s in (-1, 1):
    ax = s * .083; lx = X - ax; sid = (np.abs(lx) > .028) & (lx * s > 0)
    arc = np.abs(Z - (.035 + .03 * ss(-.11, .03, Y))) < .007
    mix(shoe & sid & (np.abs(lx) > .03), '#8fbf4a', arc.astype(np.float32))
    lace = shoe & (np.abs(lx) < .016) & (Y > -.085) & (Y < -.005) & (Z > .07)
    mix(lace, '#d81b72', (np.sin(Y * 380) > .2).astype(np.float32) * (np.abs(lx) < .014))
    mix(shoe & (np.abs(lx) < .02) & (Y > -.09) & (Y < -.0) & (Z > .065), '#f4f0e8', .0)
mix(shoe, '#d9d2c4', .5 * ss(-.08, -.13, Y))
mix(M('sohle'), '#8e8c88', ss(.01, .004, Z)); mix(M('sohle'), '#dedbd6', ss(.016, .022, Z))
# Brille / Glas / Gerät
mix(M('glas'), '#bff4ff', .6 * ss(.0, 1, (Z - 1.33) * 60) * (X < 0))
mix(M('schirm'), '#e8ffff', .5 * ss(.3, .9, vnoise(Pm, 900)))
mix(M('brille'), '#c79a4a', .4 * ss(.5, .9, n1))
# AO einrechnen (weich), Ränder ausdehnen
aoN = np.clip(ao, 0, 1); face_ = M('haut_kopf', 'lid'); col *= np.where(face_, .86 + .14 * aoN, .58 + .42 * aoN)[..., None]
col = np.clip(col, 0, 1)
alb = dilate(col, COV, 6); alb = np.where(COV[..., None], col, alb)
log('Malen fertig')
IMG_ALB = to_image(alb, 'Noa_Farbe'); IMG_ALB.colorspace_settings.name = 'sRGB'
# Normalkarte aus Höhenkarte (Tangentenraum, Cycles)
hg = dilate(np.repeat(hgt[..., None], 3, 2), COV, 4)[..., 0]
nrm = height_to_normal_bake(OBJS, hg * .5 + .5, TEX, strength=.35)
IMG_NRM = to_image(nrm[..., :3], 'Noa_Normal', 'Non-Color')
save_png(alb, os.path.join(DIR, 'noa_farbe.png')); save_png(nrm[..., :3], os.path.join(DIR, 'noa_normal.png'))

# ---------------- Augen-/Mund-Textur (512×256): links Auge, rechts unten Mundhöhle ----------------
TW, TH = 512, 256; tex = np.zeros((TH, TW, 4), np.float32); tex[..., 3] = 1
vv, uu = np.mgrid[0:TH, 0:TW].astype(np.float32); u = (uu + .5) / TW; v = (vv + .5) / TH
ex = (u - .25) / .25; ey = (v - .5) / .5; rr = np.sqrt(ex ** 2 + ey ** 2)
def put(mask, c, a=1.0):
    a = np.clip(a, 0, 1) * mask; tex[..., :3] = tex[..., :3] * (1 - a[..., None]) + hexrgb(c) * a[..., None]
L_ = u < .5
put(L_, '#fbfaf6'); put(L_, '#c9d2e0', .45 * ss(.12, .55, ey))          # Lederhaut + Lidschatten oben
IR = .36; iris = L_ & (rr < IR)
ang = np.arctan2(ey, ex); streaks = .5 + .5 * np.sin(ang * 23) * np.sin(ang * 7 + 1)
put(iris, '#5aa845'); put(iris, '#2f6a2a', ss(-.05, .3, ey)); put(iris, '#9fd86a', .55 * ss(-.05, -.32, ey) * ss(.08, .3, rr))
put(iris, '#3d7d33', .25 * streaks * ss(.1, .32, rr)); put(iris, '#1b3618', ss(.27, .35, rr))
put(L_ & (rr < .15), '#0f1410'); put(L_ & (rr < .17) & (rr >= .15), '#0f1410', .6)
put(L_, '#ffffff', ((ex - .13) ** 2 + (ey - .14) ** 2 < .07 ** 2).astype(np.float32))   # Glanzpunkte (gemalt)
put(L_, '#ffffff', .85 * ((ex + .12) ** 2 + (ey + .13) ** 2 < .035 ** 2))
Rm = (u >= .5) & (v < .5); mxn = (u - .5) / .5; myn = v / .5
inside = (np.abs(2 * mxn - 1) ** 2.4 + np.abs(2 * myn - 1) ** 2) < 1
put(Rm, '#5a2028'); put(Rm, '#7c2f36', ss(.2, .7, 1 - np.abs(2 * mxn - 1)) * .5)
put(Rm, '#f6f2ec', ((myn > .74) & (np.abs(2 * mxn - 1) < .62)).astype(np.float32))
put(Rm, '#d8757a', (((2 * mxn - 1) / .55) ** 2 + ((myn - .12) / .26) ** 2 < 1).astype(np.float32))
put(Rm, '#7a3b33', ss(.82, .98, np.abs(2 * mxn - 1) ** 2.4 + np.abs(2 * myn - 1) ** 2))
tex[..., 3] = np.where(Rm, inside.astype(np.float32), 1.0)
IMG_EYE = to_image(tex, 'Noa_Augen')
save_png(tex, os.path.join(DIR, 'noa_augen.png'))

# ---------------- Endmaterialien ----------------
for li, uvv in dec_uv.items(): HEAD.data.uv_layers['UVMap'].data[li].uv = uvv
MAT_MAIN = final_material('Noa_Haupt', IMG_ALB, IMG_NRM)
MAT_EYE = final_material('Noa_Augen', IMG_EYE); MAT_EYE.blend_method = 'CLIP' if hasattr(MAT_EYE, 'blend_method') else None
try: MAT_EYE.surface_render_method = 'DITHERED'
except Exception: pass
nt = MAT_EYE.node_tree; tn = [n for n in nt.nodes if n.type == 'TEX_IMAGE'][0]; nt.links.new(tn.outputs['Alpha'], nt.nodes['Principled BSDF'].inputs['Alpha'])
swap_materials(BODY, MAT_MAIN)
# Kopf: Hauptmaterial + Augenmaterial für die Mundhöhle
me = HEAD.data; mats = list(me.materials); pidx = [1 if mats[p.material_index].name == 'mund_innen' else 0 for p in me.polygons]
me.materials.clear(); me.materials.append(MAT_MAIN); me.materials.append(MAT_EYE)
for p, i in zip(me.polygons, pidx): p.material_index = i
EYE.data.materials.clear(); EYE.data.materials.append(MAT_EYE)

# ---------------- Clips (30 fps, in place) ----------------
import math as m_
def leg_ik(s, hip_off, foot_pos, foot_pitch):
    """Sagittal-IK: Hüftgelenk (Ruhe + hip_off), Knöchelziel → Delta-Drehungen thigh/shin/foot (Armature-Achsen)"""
    k = 'L' if s > 0 else 'R'; Hp = Lr(HIP, s) + hip_off; Kn = Lr(KNEE, s); An = Lr(ANK, s)
    a = (Kn - Lr(HIP, s)).length; b = (An - Kn).length
    d = foot_pos - Hp; dl = max(.2, min(a + b - .002, Vector((0, d.y, d.z)).length))
    phi = m_.atan2(-d.y, -d.z); al = m_.acos(max(-1, min(1, (a * a + dl * dl - b * b) / (2 * a * dl))))
    kn = m_.pi - m_.acos(max(-1, min(1, (a * a + b * b - dl * dl) / (2 * a * b))))
    r0 = Kn - Lr(HIP, s); phi0 = m_.atan2(-r0.y, -r0.z); r1 = An - Kn; k0 = m_.atan2(-r1.y, -r1.z) - phi0
    th = -(phi + al - phi0); sh = (kn + k0 * 0)
    roll = m_.atan2(d.x - (An.x - Lr(HIP, s).x), -d.z) * .8
    return {'thigh.' + k: qmul(ry(-roll), rx(th)), 'shin.' + k: rx(sh), 'foot.' + k: rx(-(th + sh) + foot_pitch)}
def arms(sw, bend, dn=.66, spread=0., wrist=0.):
    P = {}
    for s in (-1, 1):
        k = 'L' if s > 0 else 'R'; A = Lr(ARM, s); ax = Vector((A.z, 0, -A.x)).normalized()
        P['upperarm.' + k] = qmul(rx(sw * s), ry(s * (dn - spread)))
        P['forearm.' + k] = Quaternion(ax, bend[0] if s > 0 else bend[1])
        P['hand.' + k] = Quaternion(ax, wrist); P['fingers.' + k] = Quaternion(ax, .35); P['thumb.' + k] = Quaternion(ax, .15)
    return P
ANK_H = ANK.z
def gait(t, L, stance, hipz, bob, lift, lean, armsw, elbow, run=False):
    P = {}; ph = 2 * m_.pi * t
    hz = -hipz + bob * (m_.cos(4 * m_.pi * t) if not run else -m_.cos(4 * m_.pi * t)); sway = .012 * m_.sin(ph) * (0 if run else 1)
    off = Vector((sway, 0, hz)); P['hips:loc'] = off
    P['hips'] = qmul(rz(.09 * m_.sin(ph)), ry(.03 * m_.cos(ph)))
    P['spine'] = qmul(rx(-lean * .5), rz(-.05 * m_.sin(ph)))
    P['chest'] = qmul(rx(-lean * .5), rz(-.09 * m_.sin(ph)))
    P['neck'] = rx(lean * .5); P['head'] = qmul(rx(lean * .45), rz(.03 * m_.sin(ph)))
    for s, sh in ((1, 0), (-1, .5)):
        u = (t + sh) % 1.0
        if u < stance:
            w = u / stance; fy = L * (.5 - w) * (stance if not run else stance); fz = 0; pitch = (-.25 * (1 - ss(0, .2, w)) + .35 * ss(.75, 1, w)) * (1 if not run else .6)
            fz = .02 * ss(.75, 1, w) + .012 * (1 - ss(0, .15, w))
        else:
            w = (u - stance) / (1 - stance); e = .5 - .5 * m_.cos(m_.pi * w)
            fy = L * (-.5 + e) * stance * (1 if not run else 1); fz = lift * m_.sin(m_.pi * w) ** (1.2 if not run else .8) + .02 * (1 - w)
            pitch = .45 * (1 - ss(0, .5, w)) - .2 * ss(.6, 1, w)
            if run: fy += .1 * m_.sin(m_.pi * w) * -0 ; fz += .06 * m_.sin(m_.pi * w)
        foot = Vector((Lr(ANK, s).x + sway * 0, Lr(ANK, s).y - fy, ANK_H + fz))
        P.update(leg_ik(s, off, foot, pitch))
    a = arms(armsw * m_.sin(ph), (elbow + .25 * armsw * (m_.sin(ph) + 1), elbow + .25 * armsw * (1 - m_.sin(ph))), dn=.6 if not run else .5)
    # Arm gegengleich zum Bein: linkes Bein vorn (t=0) → rechter Arm vorn
    a['upperarm.L'] = qmul(rx(armsw * m_.sin(ph)), ry(.6 if not run else .5)); a['upperarm.R'] = qmul(rx(-armsw * m_.sin(ph)), ry(-(.6 if not run else .5)))
    P.update(a); return P
def idle(t):
    ph = 2 * m_.pi * t; br = m_.sin(ph * 3)          # 3 Atemzüge je 4 s
    P = {}; sway = .006 * m_.sin(ph); P['hips:loc'] = Vector((sway, 0, -.004 + .001 * br))
    P['hips'] = ry(.02 * m_.sin(ph)); P['spine'] = rx(.008 * br); P['chest'] = qmul(rx(.018 * br), ry(-.02 * m_.sin(ph)))
    P['neck'] = rz(.05 * m_.sin(ph * 2 + .5) * ss(.2, .5, .5 + .5 * m_.sin(ph))); P['head'] = qmul(rz(.08 * m_.sin(ph + 1)), rx(-.03 + .02 * m_.sin(ph * 2)))
    for s in (-1, 1): P.update(leg_ik(s, Vector((sway, 0, -.004)), Vector((Lr(ANK, s).x + s * .01, Lr(ANK, s).y, ANK_H)), 0))
    P.update(arms(0, (.18 + .02 * br, .16 + .02 * br), dn=.66 + .015 * br))
    P['shoulder.L'] = ry(-.03 * br); P['shoulder.R'] = ry(.03 * br)
    P['hair_vorn'] = rx(.03 * m_.sin(ph * 2)); P['hair_hinten'] = rx(.02 * m_.sin(ph * 2 + 1))
    return P
CLIPS = {}
CLIPS['idle'] = make_action(ARMO, 'idle', 120, idle)
STRIDE_W, STRIDE_R = .9, 1.7
CLIPS['walk'] = make_action(ARMO, 'walk', 30, lambda t: dict(gait(t, STRIDE_W, .6, .018, .01, .085, .06, .38, .25), hair_vorn=rx(-.05 + .04 * m_.sin(4 * m_.pi * t)), hair_hinten=rx(.06 + .04 * m_.sin(4 * m_.pi * t))))
CLIPS['run'] = make_action(ARMO, 'run', 20, lambda t: dict(gait(t, STRIDE_R, .35, .07, .02, .16, .2, .5, 1.15, run=True), hair_vorn=rx(-.15 + .06 * m_.sin(4 * m_.pi * t)), hair_hinten=rx(.18 + .06 * m_.sin(4 * m_.pi * t))))
rest_pose(ARMO)

# ---------------- Export ----------------
for o in (HEAD, BODY, EYE): o.data.update()
export_glb(OUT, [HEAD, BODY, EYE], ARMO)
meta = {'modell': 'noa', 'dreiecke': {'kopf': tris(HEAD), 'koerper': tris(BODY), 'augen': tris(EYE)}, 'knochen': len(B),
        'shapeKeys': [k.name for k in HEAD.data.shape_keys.key_blocks][1:], 'clips': {'idle': 4.0, 'walk': 1.0, 'run': 20 / 30},
        'schritt': {'walk': STRIDE_W, 'run': STRIDE_R}, 'hoehe': H, 'textur': TEX, 'bauzeit_s': round(time.time() - T0, 1)}
meta['dreiecke']['gesamt'] = sum(meta['dreiecke'].values())
json.dump(meta, open(OUT.replace('.glb', '.json'), 'w'), indent=1); log('META', json.dumps(meta))
