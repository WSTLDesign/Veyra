# Figurenbaukasten Teil 2 (wird von figuren.py ausgeführt): Gesichtsnormalen, Rig (32 Knochen), Gewichte, Shape Keys, UV, Backen + Malen,
# Augen-/Mundtextur, Materialien, LOD 50 %, Clips (idle, walk, jog, run, winken, jubeln, werfen), Export + Kennzahlen.
# Erwartet: BODY, FACE, EYE, SPEC, FID, OUT, DIR, D (Maße) aus figuren.py/fkit.py.
H = D.H; K_ = SPEC['kleidung']; kk = H / 1.45; TEX = 1024
S_TEX = SPEC.get('tex', TEX)

# ---------------- Gesichtsnormalen (Ellipsoid-Mischung) ----------------
def face_w(p):
    d = p - D.HC; fz = -d.y / D.hd
    return .72 * ss(-.1, .5, fz) * ss(-1.05, -.7, d.z / D.hh) * (1 - ss(.55, .9, d.z / D.hh)) * (1 - ss(.85, 1.0, abs(d.x) / D.hw))
ELL_C = D.HC + Vector((0, .02 * D.hd, -.04 * D.hh)); ELL_R = (D.hw * 1.02, D.hd * 1.08, D.hh * 1.06)
def face_w_body(p):
    d = p - D.HC
    if d.length > max(D.hw, D.hh) * 1.25 or p.z < D.CHIN - .01: return 0.
    return face_w(p)
ellipsoid_normals(FACE, ELL_C, ELL_R, face_w)
# Körper: nur Hautflächen des Kopfes (Haare/Kleidung behalten ihre Normalen)
_mats = list(BODY.data.materials); _skin = {i for i, m in enumerate(_mats) if m.name in ('haut_kopf',)}
_vf = {}
for p_ in BODY.data.polygons:
    if p_.material_index in _skin:
        for vi in p_.vertices: _vf[vi] = 1
ellipsoid_normals(BODY, ELL_C, ELL_R, lambda p: face_w_body(p) if True else 0)

# ---------------- Rig: 32 Knochen ----------------
NZ = D.NECK0.z; HZ = D.HIP.z
B = [('root', (0, 0, 0), (0, 0, .1 * kk), None), ('hips', (0, 0, HZ), (0, 0, HZ + .07 * H), 'root'), ('spine', (0, 0, HZ + .07 * H), (0, .004 * H, lerp(HZ, D.SH.z, .62)), 'hips'),
     ('chest', (0, .004 * H, lerp(HZ, D.SH.z, .62)), (0, .006 * H, D.SH.z + .005 * H), 'spine'), ('neck', (0, D.NECK0.y, NZ - .01 * H), tuple(D.HC + Vector((0, .02 * D.hd, -.62 * D.hh))), 'chest'),
     ('head', tuple(D.HC + Vector((0, .02 * D.hd, -.62 * D.hh))), tuple(D.HC + Vector((0, .02 * D.hd, 1.0 * D.hh))), 'neck'),
     ('hair_vorn', tuple(D.HC + Vector((0, -.6 * D.hd, .7 * D.hh))), tuple(D.HC + Vector((0, -.9 * D.hd, .25 * D.hh))), 'head'),
     ('hair_hinten', tuple(D.HC + Vector((0, .7 * D.hd, .5 * D.hh))), tuple(D.HC + Vector((0, 1.0 * D.hd, -.4 * D.hh))), 'head')]
for s in (-1, 1):
    k = 'L' if s > 0 else 'R'; C, f = D.EYES[s]; S = Lr(D.SH, s); A = Lr(D.ARM, s); W = Lr(D.WR, s); HD = D.HANDS[s]
    fb = W + A * D.L_HA * .55; ft = sum(HD['tips'], Vector()) / 4; fm = fb.lerp(ft, .45)
    B += [('eye.' + k, tuple(C), tuple(C + f * .02 * kk), 'head'),
          ('shoulder.' + k, (s * .02 * H, D.SH.y, D.SH.z - .004 * H), tuple(S), 'chest'), ('upperarm.' + k, tuple(S), tuple(S + A * D.L_UA), 'shoulder.' + k),
          ('forearm.' + k, tuple(S + A * D.L_UA), tuple(W), 'upperarm.' + k), ('hand.' + k, tuple(W), tuple(fb), 'forearm.' + k),
          ('finger1.' + k, tuple(fb), tuple(fm), 'hand.' + k), ('finger2.' + k, tuple(fm), tuple(ft), 'finger1.' + k),
          ('thumb.' + k, tuple(W + A * D.L_HA * .25 + Vector((0, -.012 * kk, 0))), tuple(HD['thumb']), 'hand.' + k),
          ('thigh.' + k, tuple(Lr(D.HIP, s)), tuple(Lr(D.KNEE, s)), 'hips'), ('shin.' + k, tuple(Lr(D.KNEE, s)), tuple(Lr(D.ANK, s)), 'thigh.' + k),
          ('foot.' + k, tuple(Lr(D.ANK, s)), tuple(Lr(D.BALL, s)), 'shin.' + k), ('toe.' + k, tuple(Lr(D.BALL, s)), tuple(Lr(D.TOE, s)), 'foot.' + k)]
ARMO = armature(FID + '_Rig', B); log('Knochen', len(B))

# ---------------- Gewichte ----------------
for o in (BODY, FACE, EYE): bind(o, ARMO)
weights_capsule(FACE, ARMO, lambda co, r: ['head'], fixed=lambda co, r: {'head': 1})
weights_capsule(EYE, ARMO, lambda co, r: ['eye.L'], fixed=lambda co, r: {'eye.L' if co.x > 0 else 'eye.R': 1})
HEADR = {'haar', 'bart', 'haut_kopf', 'glas', 'blume', 'muetze', 'lidlinie', 'braue'}
def body_allowed(co, r):
    s = 'L' if co.x > 0 else 'R'
    if r in ('schuh', 'sohle'): return ['foot.' + s, 'toe.' + s, 'shin.' + s]
    if co.z > D.CHIN + .02 * H and abs(co.x) < D.hw * 1.6: return ['neck', 'head', 'chest']
    ac = arm_coord(co)
    if ac and ac[1] > D.L_UA + D.L_FA - .02 * H: return ['forearm.' + s, 'hand.' + s, 'finger1.' + s, 'finger2.' + s, 'thumb.' + s]
    return ['hips', 'spine', 'chest', 'neck', 'shoulder.' + s, 'upperarm.' + s, 'forearm.' + s, 'thigh.' + s, 'shin.' + s, 'foot.' + s]
LOOSE = {'rock', 'kittel', 'schuerze'}
def body_fixed(co, r):
    d = co - D.HC
    if r in HEADR and (d.length < max(D.hw, D.hh) * 1.9 and co.z > D.CHIN - .03 * H) and not (r == 'haar' and co.z < D.CHIN - .02 * H):
        if r == 'haar':
            out = max(0, d.length - D.hh * 1.0); w = ss(0, .06 * kk, out) * .6
            if w > .01: return {'head': 1 - w, ('hair_vorn' if d.y < 0 else 'hair_hinten'): w}
        return {'head': 1}
    if r == 'haar' and co.z < D.CHIN:   # Pferdeschwanz / lange Strähnen
        return {'head': .5, 'hair_hinten': .5}
    if r in ('dunkel', 'schirm') and co.x > D.SH.x: return {'forearm.L': 1}
    if r == 'glas' or r == 'metall':
        if d.length < D.hh * 1.8: return {'head': 1}
    if r in LOOSE and co.z < HZ + .02 * H:   # Rock/Mantelschoß/Schürze: Hüfte + Oberschenkel anteilig (folgt den Beinen)
        s = 'L' if co.x > 0 else 'R'; side = ss(.0, .06 * H, abs(co.x)); t = ss(HZ + .02 * H, D.KNEE.z, co.z)
        wl = (.15 + .45 * t) * (.35 + .65 * side); return {'hips': 1 - wl, 'thigh.' + s: wl * .85, 'shin.' + s: wl * .15 * t}
    if r in ('rucksack',) or (r == 'leder' and 'rucksack' in SPEC.get('extras', []) and co.y > .02 * H and co.z > HZ):
        return {'chest': .7, 'spine': .3}
    return None
weights_capsule(BODY, ARMO, body_allowed, fall=5, fixed=body_fixed, smooth_it=3)

# ---------------- Shape Keys (Gesicht) ----------------
def gw(o, name):
    gi = o.vertex_groups[name].index if name in o.vertex_groups else -1; out = {}
    for v in o.data.vertices:
        for g in v.groups:
            if g.group == gi: out[v.index] = g.weight
    return out
LIDS = {(w, s): gw(FACE, 'lid_%s_%s' % (w, 'L' if s > 0 else 'R')) for w in 'ou' for s in (-1, 1)}
ROW = gw(FACE, 'mund_reihe'); COL = gw(FACE, 'mund_spalte')
def eye_frame(s):
    C, f = D.EYES[s]; r = Vector((0, 0, 1)).cross(f).normalized() * (-s); u = f.cross(r).normalized() * (-s)
    if u.z < 0: u = -u
    return C, f, r, u
def lid_move(co, s, which, amt_o=0, amt_u=0, wide=0):
    C, f, r, u = eye_frame(s); q = co - C; R_ = q.length
    ph = math.degrees(math.atan2(q.dot(r), q.dot(f))); th = math.degrees(math.asin(max(-1, min(1, q.dot(u) / R_))))
    if which == 'o':
        e0, e1 = th_u(ph), th_l(ph) + 1.0
        tgt = lerp(e0, e1, amt_o) + wide; th2 = tgt + (th - e0) * (82 - tgt) / max(1e-3, 82 - e0) if th >= e0 - 4 else th + (tgt - e0)
    else:
        e0 = th_l(ph); tgt = e0 + amt_u * (th_u(ph) - e0) * .45 - wide * .4
        th2 = tgt + (th - e0) * (-76 - tgt) / min(-1e-3, -76 - e0) if th <= e0 + 4 else th + (tgt - e0)
    a, b = math.radians(ph), math.radians(th2)
    return C + (f * (math.cos(b) * math.cos(a)) + r * (math.cos(b) * math.sin(a)) + u * math.sin(b)) * R_
def sk_lids(side_set, ao=0, au=0, wide=0):
    def fn(i, co, reg):
        for (w, s), G_ in LIDS.items():
            if i in G_ and s in side_set: return lid_move(co, s, w, ao, au, wide)
        return None
    return fn
def mouth_grid(i, opn, wid, smile, oround=0):
    j = round(ROW[i] * 5) - 1; k = round(COL[i] * 9) - 1; xn = (k / 8 - .5) * D.MW * 1.05 * wid; t = 2 * k / 8 - 1
    lens = (1 - t * t) ** (.55 if oround else .8); zc = D.MZ + smile * .06 * t * t
    zn = zc + (j / 4 - .5) * opn * lens * 2 + opn * .02
    p, n = surf(xn, zn); return p + n * .0012
def sk_mouth(opn, wid, smile, oround=0, brow=None):
    def fn(i, co, reg):
        if i in ROW: return mouth_grid(i, opn, wid, smile, oround)
        if reg == 'mundlinie':
            xr = (co.x - D.HC.x) / D.hw; t = max(-1, min(1, xr / (D.MW / 2))); xn = xr * wid
            zn = (co.z - D.HC.z) / D.hh + smile * .06 * t * t + (opn * (.5 * (1 - t * t) ** .8 * 2 + .02) if opn else 0)
            p, n = surf(xn, zn); return p + n * .0012
        if reg == 'braue' and brow: return brow(co)
        return None
    return fn
def brow_mv(dz, inner=0):
    def f(co):
        xn = abs(co.x) / D.hw; w_in = ss(.6, .2, xn); return co + Vector((0, 0, (dz + inner * w_in) * kk)) - Vector((0, .0015 * kk * abs(inner) / .005 * w_in, 0))
    return f
def sk_combo(*fns):
    def fn(i, co, reg):
        for f in fns:
            r = f(i, co, reg)
            if r is not None: return r
        return None
    return fn
shape_key(FACE, 'Blinzeln_L', sk_lids({1}, 1, .3)); shape_key(FACE, 'Blinzeln_R', sk_lids({-1}, 1, .3))
shape_key(FACE, 'Augen_froh', sk_lids({1, -1}, .5, 1.0))
shape_key(FACE, 'Laecheln', sk_combo(sk_mouth(0, 1.08, 1), lambda i, co, reg: brow_mv(.0015)(co) if reg == 'braue' else None))
shape_key(FACE, 'Mund_A', sk_mouth(.13, 1.0, .3)); shape_key(FACE, 'Mund_O', sk_mouth(.11, .55, 0, 1))
shape_key(FACE, 'Staunen', sk_combo(sk_lids({1, -1}, 0, 0, 7), sk_mouth(.06, .6, 0, 1, brow=brow_mv(.0075))))
shape_key(FACE, 'Aerger', sk_combo(sk_lids({1, -1}, .22, .15), sk_mouth(0, .92, -.4, brow=brow_mv(-.0018, -.0055))))
shape_key(FACE, 'Traurig', sk_combo(sk_lids({1, -1}, .25, 0), sk_mouth(0, .9, -.7, brow=brow_mv(0, .0065))))
for _k in FACE.data.shape_keys.key_blocks[1:]: _k.value = 0
log('Shape Keys', [k.name for k in FACE.data.shape_keys.key_blocks])

# ---------------- Masken ----------------
for o in (BODY, FACE, EYE): write_masks(o)

# ---------------- UV-Atlas ----------------
dec_uv = {}
for p_ in FACE.data.polygons:
    if FACE.data.materials[p_.material_index].name == 'mund_innen':
        for li in p_.loop_indices: dec_uv[li] = tuple(FACE.data.uv_layers['UVMap'].data[li].uv)
def isl(o, c):
    d = c - D.HC
    if o is FACE: return 2.2
    if d.length < D.hh * 1.25 and d.y < 0 and c.z > D.CHIN - .01: return 2.3     # Gesicht
    if d.length < D.hh * 1.6 and c.z > D.CHIN: return 1.25                        # Kopf/Haare
    ac = arm_coord(c)
    if ac and ac[1] > D.L_UA + D.L_FA - .02 * H: return 1.3                         # Hände
    if c.z < .1 * H: return 1.05
    return 1.0
uv_atlas([BODY, FACE], isl, margin=.005)
for li in dec_uv: FACE.data.uv_layers['UVMap'].data[li].uv = (.9995, .9995)

# ---------------- Backen ----------------
W_ = bpy.data.worlds.new('W'); bpy.context.scene.world = W_; W_.light_settings.distance = .07 * kk
OBJS = [BODY, FACE]
rid = bake_emit(OBJS, 'id', TEX); RID = np.floor(rid[..., 0] * 256).astype(int) - 1; COV = RID >= 0
pos = bake_emit(OBJS, 'pos', TEX); Pm = pos[..., :3]
ao = bake(OBJS, 'AO', TEX, samples=SPEC.get('ao_samples', 40))[..., 0]
NAMES = {v['id']: k for k, v in REG.items()}; log('Abdeckung', round(COV.mean(), 3))

# ---------------- Malen ----------------
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
X, Y, Z = Pm[..., 0], Pm[..., 1], Pm[..., 2]; Pn = Pm / kk
col = np.zeros((TEX, TEX, 3), np.float32); hgt = np.zeros((TEX, TEX), np.float32)
for i, nm in NAMES.items():
    m = RID == i
    if m.any(): col[m] = hexrgb(REG[nm]['col'])
def M(*names): return np.isin(RID, [REG[n]['id'] for n in names if n in REG])
def mix(mask, c, a=1.0):
    a = np.clip(a, 0, 1) * mask; col[:] = col * (1 - a[..., None]) + hexrgb(c) * a[..., None]
FC = SPEC['farben']
# Körperzonen je Texel (Haut / Oberteil / Hose / Socke) aus der 3D-Position – wie body_cover, vektorisiert
L_ = D.L_UA + D.L_FA; armT = np.full(X.shape, -1.0)
for s_ in (-1, 1):
    S_ = Lr(D.SH, s_); A_v = Lr(D.ARM, s_)
    t_ = (X - S_.x) * A_v.x + (Y - S_.y) * A_v.y + (Z - S_.z) * A_v.z
    qx, qy, qz = X - S_.x - A_v.x * t_, Y - S_.y - A_v.y * t_, Z - S_.z - A_v.z * t_; rad = np.sqrt(qx * qx + qy * qy + qz * qz)
    sel = (np.sign(X) == s_) & (np.abs(X) > D.SH.x * .72) & (t_ > -.03 * H) & (rad < .09 * kk) & (Z > HZ * .9); armT = np.where(sel, t_, armT)
isArm = armT > 0; TOP = K_.get('top'); BOT = K_.get('unten')
zTop = np.zeros(X.shape, bool); zBot = np.zeros(X.shape, bool); zSock = np.zeros(X.shape, bool)
nkr = D.T['neck'] * H * (1.5 if TOP and TOP['art'] in ('hemd', 'bluse', 'pulli') else 1.75)
if TOP: zTop = np.where(isArm, armT < TOP['arm'] * L_, (Z > TOP['saum'] * H - .002 * H) & ((Z < D.NECK0.z - .005 * H) | ((np.hypot(X, Y - D.NECK0.y) >= nkr) & (Z < D.CHIN))))
if BOT: zBot = (~isArm) & (Z < BOT.get('bund', .6) * H + .004 * H) & (Z > BOT.get('bis', 0) * H) & ~zTop
if K_.get('socken'): zSock = (~isArm) & (Z < D.ANK.z + K_['socken'] * H) & ~zTop & ~zBot
BOD = M('haut', 'top', 'hose', 'socke')
botname = 'hose' if 'hose' in FC else 'haut'
col[BOD] = hexrgb(FC['haut'])
if TOP: col[BOD & zTop] = hexrgb(FC['top'])
if BOT and BOT['art'] != 'beine': col[BOD & zBot] = hexrgb(FC.get('hose', FC['haut']))
if K_.get('socken'): col[BOD & zSock] = hexrgb(FC.get('socke', '#efe6d2'))
def setid(mask, name): global RID; RID = np.where(mask, REG[name]['id'] if name in REG else RID, RID)
if TOP: setid(BOD & zTop, 'top')
if BOT and BOT['art'] != 'beine' and 'hose' in REG: setid(BOD & zBot, 'hose')
if K_.get('socken') and 'socke' in REG: setid(BOD & zSock, 'socke')
skin = M('haut', 'haut_kopf', 'lid', 'nase'); skin_b = skin & ~(BOD & (zTop | zBot | zSock)) if True else skin
n1 = vnoise(Pn, 90); n2 = vnoise(Pn, 300); n3 = vnoise(Pn, 700)
col *= (1 + (n1[..., None] - .5) * .035)
# --- Haut: weicher Verlauf, Wangenröte, Nase, Ohren, Lippen, Lidschatten ---
HC = D.HC; hw, hh, hd = D.hw, D.hh, D.hd; frontM = (Y < HC.y - .3 * hd)
mix(skin_b, '#c98a72', .10 * ss(.4 * H, .0, Z - HC.z + .4 * H) * 0)
for s in (-1, 1):
    cx, cz = s * .52 * hw, HC.z - .36 * hh
    mix(skin_b, '#f09c8e', (.3 if D.kid else .18) * gauss((X - cx) ** 2 + ((Z - cz) * 1.5) ** 2, .13 * hw) * frontM)
    mix(skin_b, '#e8a892', .45 * gauss((X - s * hw * .92) ** 2 + (Z - (HC.z - .05 * hh)) ** 2, .14 * hw))                           # Ohren rosig
    mix(skin_b, '#d79a86', .35 * gauss((X - s * .1 * hw) ** 2 + ((Z - (HC.z - .37 * hh)) * 1.6) ** 2, .045 * hw) * frontM)           # Nasenflügel
mix(skin_b, '#f0a898', .3 * gauss(X ** 2 + (Z - (HC.z - .3 * hh)) ** 2, .07 * hw) * frontM)                                      # Nasenspitze
mix(skin_b, '#c78672', .4 * gauss(X ** 2 * .6 + ((Z - (HC.z - .41 * hh)) * 2.2) ** 2, .06 * hw) * frontM)                          # Schatten unter der Nase
mix(skin_b, '#d98a80', .38 * gauss((X / 1.6) ** 2 + ((Z - (HC.z + (D.MZ - .085) * hh)) * 2.4) ** 2, .07 * hw) * frontM)          # Unterlippe
mix(skin_b, '#e2a08a', .25 * gauss((X / 1.2) ** 2 + ((Z - (HC.z + (D.MZ + .07) * hh)) * 3) ** 2, .06 * hw) * frontM)            # Oberlippe
mix(skin_b, '#d4a089', .3 * ss(D.CHIN + .02 * H, D.CHIN - .01 * H, Z) * ss(D.NECK0.z - .02 * H, D.NECK0.z + .01 * H, Z) * (Y < .02 * H))  # Halsschatten unterm Kinn
mix(M('lid'), FC.get('lidschatten', '#e8ad98'), .6)
if SPEC.get('gesicht', {}).get('sommersprossen'):
    fr = (vnoise(Pn, 2600) > .78) & frontM & (np.abs(Z - (HC.z - .2 * hh)) < .16 * hh) & (np.abs(X) > .12 * hw) & (np.abs(X) < .7 * hw)
    mix(skin_b, '#c07a52', .5 * fr)
if D.T['stoop']:   # ältere Haut: leichte Falten unter den Augen / Lachfalten (dezent)
    for s in (-1, 1):
        mix(skin_b, '#d7a088', .25 * (np.abs(((X - s * .42 * hw) ** 2 + ((Z - (HC.z - .25 * hh)) * 1.5) ** 2) ** .5 - .16 * hw) < .006 * hw * 1.6) * frontM * (Z < HC.z - .15 * hh))
        mix(skin_b, '#d7a088', .22 * (np.abs(((X - s * .3 * hw) ** 2 + ((Z - (HC.z - .55 * hh)) * .9) ** 2) ** .5 - .22 * hw) < .006 * hw * 1.6) * frontM * (np.abs(X) > .25 * hw))
mix(skin_b & isArm, '#e9b89c', .2 * ss(L_ - .03 * H, L_ + .06 * H, armT))   # Hände wärmer
# --- Haare: dunkler zum Ansatz, Strähnen, Glanzband, Spitzen (haar_hi) ---
hair = M('haar'); dist = np.sqrt((X - HC.x) ** 2 + (Y - HC.y) ** 2 + (Z - HC.z) ** 2)
hc = hexrgb(FC['haar']); dark = '#%02x%02x%02x' % tuple(int(c * 255 * .6) for c in hc); lite = '#%02x%02x%02x' % tuple(min(255, int(c * 255 * 1.25 + 18)) for c in hc)
mix(hair, dark, .35 * ss(hh * 1.18, hh * .98, dist))
streak = vnoise(Pn * np.array([1, 1, .3]), 520); mix(hair, lite, .18 * ss(.62, .86, streak)); mix(hair, dark, .28 * ss(.38, .14, streak))
hgt += hair * (streak - .5) * .35
if FC.get('haar_hi'): mix(hair, FC['haar_hi'], ss(hh * 1.32, hh * 1.55, dist) * .95)
beard = M('bart')
if beard.any():
    bc = hexrgb(FC.get('bart', FC['haar'])); bd = '#%02x%02x%02x' % tuple(int(c * 255 * .78) for c in bc)
    st2 = vnoise(Pn * np.array([1, 1, .25]), 600); mix(beard, bd, .35 * ss(.4, .15, st2)); hgt += beard * (st2 - .5) * .6
# --- Stoffe: Struktur, Nähte ---
cloth = M('top', 'top2', 'jacke', 'kittel', 'hose', 'rock', 'schuerze', 'saum', 'saum2', 'muetze', 'rucksack', 'socke')
weave = (np.sin(Pn[..., 0] * 2600) * np.sin(Pn[..., 2] * 2600) + np.sin(Pn[..., 1] * 2600) * np.sin(Pn[..., 2] * 2600)) * .5
col *= np.where(cloth, 1 + weave * .025 + (n2 - .5) * .07, 1.0)[..., None]
hgt += cloth * (weave * .22 + (n2 - .5) * .25)
def seam(mask, dist_field, w=.0016, c='#000000', a=.25, h=.6):
    sm = mask & (np.abs(dist_field) < w * kk); mix(sm, c, a); hgt[:] -= sm * h
def shade_of(name, f):
    c = hexrgb(FC[name] if name in FC else REG[name]['col']); return '#%02x%02x%02x' % tuple(int(min(255, max(0, x * 255 * f))) for x in c)
# Nähte: Saum-Steppnaht, Seitennähte Hose, Schulternähte
if TOP:
    seam(M('top'), Z - (TOP['saum'] * H + .012 * H), c=shade_of('top', .7), a=.5)
    seam(M('top') & ~isArm, np.abs(X) - torso_prof(D.SH.z - .02 * H)[0] * .62, w=.0012, c=shade_of('top', .75), a=.25)
if BOT and BOT['art'] in ('cargo', 'hose'):
    side = (np.abs(X) > D.HIP.x * 1.2) & (np.abs(Y) < .006 * kk) & (Z < BOT['bund'] * H)
    mix(M('hose') & side, shade_of('hose', .72), .65); hgt -= M('hose') * side * .7
    for s in (-1, 1):   # Taschen vorn (Kante)
        r_ = np.sqrt((X - s * .07 * H) ** 2 + ((Z - (BOT['bund'] * H - .01 * H)) * 1.0) ** 2)
        seam(M('hose') & (Y < 0) & (Z < BOT['bund'] * H) & (np.abs(X) < .1 * H), r_ - .04 * kk, w=.0013, c=shade_of('hose', .7), a=.5)
    mix(M('hose'), shade_of('hose', 1.15), .25 * ss(.5, .9, n2) * ss(D.KNEE.z - .03 * H, D.KNEE.z + .03 * H, Z) * ss(D.KNEE.z + .08 * H, D.KNEE.z + .02 * H, Z))
for nm in ('jacke', 'kittel'):
    if nm in FC:
        J = K_.get(nm); mk = M(nm)
        seam(mk, np.abs(X) - J['offen'] * H * 1.15, w=.0014, c=shade_of(nm, .72), a=.45)                    # Vorderkante Steppnaht
        seam(mk, Z - (J['saum'] * H + .012 * H), c=shade_of(nm, .72), a=.4)
        mix(mk & (np.abs(np.abs(X) - J['offen'] * H * 1.05) < .006 * kk) & (Y < 0), FC.get('saum', '#888888'), .9)   # Blende in Saumfarbe
        if nm == 'kittel':
            for s in (-1, 1):   # Brusttasche + Seitentaschen
                seam(mk & (Y < 0), np.maximum(np.abs(X - s * .065 * H) - .03 * H, np.abs(Z - (D.SH.z - .1 * H)) - .025 * H), w=.0012, c=shade_of(nm, .72), a=.5)
                seam(mk & (Y < 0), np.maximum(np.abs(X - s * .09 * H) - .04 * H, np.abs(Z - (HZ - .02 * H)) - .035 * H), w=.0012, c=shade_of(nm, .72), a=.5)
if 'schuerze' in FC:
    seam(M('schuerze'), np.abs(np.abs(X) - .0) - 10, w=.001)
    if 'karo_schuerze' in SPEC.get('muster', []):
        ch = (np.sin(X / kk * 260) > .6) | (np.sin(Z / kk * 260) > .6); mix(M('schuerze') & ch, shade_of('schuerze', .86), .55)
if 'schuerze' in FC:
    pk = M('schuerze') & (np.abs(X) < .06 * H) & (np.abs(Z - (HZ - .03 * H)) < .04 * H); mix(pk, shade_of('schuerze', .85), .9)
    seam(M('schuerze'), np.maximum(np.abs(X) - .06 * H, np.abs(Z - (HZ - .03 * H)) - .04 * H), w=.0014, c=shade_of('schuerze', .6), a=.6)
if 'rock' in FC:
    mix(M('rock'), shade_of('rock', 1.12), .2 * ss(.55, .9, n2))
if 'strick' in SPEC.get('muster', []) and 'jacke' in FC:
    knit = np.sin(Z / kk * 900 + np.sign(X) * np.abs(X) / kk * 420 * np.sign(np.sin(X / kk * 420))) ; mix(M('jacke'), shade_of('jacke', .82), .3 * (knit > .5)); hgt += M('jacke') * (knit * .4)
# Hemd/Bluse: Knopfleiste + Knöpfe vorn
if TOP and TOP['art'] in ('hemd', 'bluse'):
    pl = M('top') & ~isArm & (Y < 0) & (np.abs(X) < .006 * kk)
    seam(M('top') & ~isArm & (Y < 0), np.abs(X) - .0065 * kk, w=.0009, c=shade_of('top', .72), a=.5)
    for i in range(6):
        zb = D.NECK0.z - .045 * H - i * .07 * H
        if zb < TOP['saum'] * H: break
        b_ = M('top') & (Y < 0) & ((X ** 2 + (Z - zb) ** 2) < (.0045 * kk) ** 2); mix(b_, FC.get('knopf', '#efe6d2'), 1); hgt += b_ * .8
if TOP and TOP['art'] == 'pulli':
    mix(M('top') & ~isArm & (Y < 0) & (np.abs(Z - lerp(HZ, D.SH.z, .32)) < .045 * H) & (np.abs(X) < .07 * H), shade_of('top', .85), .9)   # Bauchtasche
    seam(M('top') & ~isArm & (Y < 0), np.maximum(np.abs(X) - .07 * H, np.abs(Z - lerp(HZ, D.SH.z, .32)) - .045 * H), w=.0012, c=shade_of('top', .65), a=.6)
if 'reissverschluss' in SPEC.get('extras', []) and 'jacke' in FC:
    zp = M('jacke') & (Y < 0) & (np.abs(np.abs(X) - K_['jacke']['offen'] * H * 1.0) < .0022 * kk); mix(zp, '#9a9aa2', .9); hgt += zp * ((np.sin(Z / kk * 1400) > 0) * .6)
# Muster
mus = SPEC.get('muster', [])
if 'blatt' in mus:   # Blatt-Emblem links auf der Brust
    ex_, ez_ = X - .045 * H, Z - (D.SH.z - .085 * H); ca, sa = math.cos(.5), math.sin(.5); lx = (ex_ * ca - ez_ * sa) / kk; lz = (ex_ * sa + ez_ * ca) / kk
    leaf = (lx / .028) ** 2 + (lz / .0135) ** 2 * (1 + 1.2 * ss(-.02, .03, lx)) < 1; front = Y < -.03 * kk
    mix(M('top') & front, FC.get('emblem', '#e9d27a'), leaf.astype(np.float32)); mix(M('top') & front, '#c9a84a', (leaf & (np.abs(lz + lx * .1) < .0018)).astype(np.float32))
    hgt += (M('top') & front & leaf) * .5
if 'flamme' in mus and 'jacke' in FC:   # Flammenzeichen auf dem Rücken der Jacke (Glut-Rivale)
    fx_, fz_ = X / kk, (Z - lerp(HZ, D.SH.z, .62)) / kk; back = Y > .02 * kk
    fl = (fx_ ** 2 / (.035 * (1 - ss(-.04, .06, fz_)) + 1e-4) ** 2 + (fz_ / .06) ** 2 < 1) | ((np.abs(fx_ - .022 * np.sin(fz_ * 60)) < .008 * (1 - ss(0, .08, fz_))) & (fz_ > 0) & (fz_ < .08))
    mix(M('jacke') & back, FC['saum'], fl.astype(np.float32)); mix(M('jacke') & back, '#f0a040', (fl & (fz_ < .01) & (np.abs(fx_) < .015)).astype(np.float32))
if 'blatt_wappen' in mus and 'kittel' in FC:
    ex_, ez_ = X + .065 * H, Z - (D.SH.z - .09 * H); lx, lz = ex_ / kk, ez_ / kk
    leaf = (lx / .02) ** 2 + (lz / .012) ** 2 < 1; mix(M('kittel') & (Y < 0), FC['saum'], leaf.astype(np.float32))
if 'kreuz_blatt' in SPEC.get('extras', []) and 'kittel' in FC:   # Heil-Zeichen (eigenes Symbol: Kreuz mit Blatt)
    lx, lz = (X + .06 * H) / kk, (Z - (D.SH.z - .085 * H)) / kk
    cr = ((np.abs(lx) < .006) & (np.abs(lz) < .018)) | ((np.abs(lz) < .006) & (np.abs(lx) < .018)); mix(M('kittel') & (Y < 0), FC['saum'], cr.astype(np.float32))
# Mütze: Strick (Beanie) bzw. Naht (Schirmmütze)
if 'muetze' in FC:
    mk = M('muetze'); rib = np.sin(np.arctan2(Y - HC.y, X - HC.x) * 40) > 0; mix(mk, shade_of('muetze', .85), .35 * rib); hgt += mk * rib * .5
    mix(mk, shade_of('muetze', .82), ss(HC.z + .2 * hh, HC.z + .12 * hh, Z) * .8)
if 'rucksack' in FC:
    seam(M('rucksack'), np.abs(X) - .05 * H, w=.0012, c=shade_of('rucksack', .7), a=.5)
# Schuhe
shoe = M('schuh'); kind = K_.get('schuhe', 'sneaker')
for s in (-1, 1):
    ax = Lr(D.ANK, s).x; lx = X - ax; cy = Lr(D.ANK, s).y - D.FL * .38
    if kind == 'sneaker':
        sid = (np.abs(lx) > .026 * kk) & (lx * s > 0); arc = np.abs(Z - (.035 * kk + .03 * kk * ss(cy - .07 * kk, cy + .07 * kk, Y))) < .007 * kk
        mix(shoe & sid, FC.get('streifen', FC.get('akzent', '#8fbf4a')), arc.astype(np.float32))
        lace = shoe & (np.abs(lx) < .016 * kk) & (Y > cy - .06 * kk) & (Y < cy + .03 * kk) & (Z > .07 * kk)
        mix(lace, FC.get('akzent', '#d81b72'), (np.sin(Y / kk * 380) > .2).astype(np.float32) * (np.abs(lx) < .014 * kk))
    else:
        mix(shoe, shade_of('schuh', 1.25), .35 * ss(cy - .02 * kk, cy - .09 * kk, Y))   # Kappe heller
        lace = shoe & (np.abs(lx) < .012 * kk) & (Y > cy - .04 * kk) & (Y < cy + .03 * kk) & (Z > .065 * kk)
        mix(lace, FC.get('akzent', shade_of('schuh', .6)), .8 * (np.sin(Y / kk * 380) > .3)); hgt += lace * .4
mix(M('sohle'), '#000000', .25 * ss(.012 * kk, .004 * kk, Z))
mix(M('glas'), '#ffffff', .45 * ss(.3, .9, vnoise(Pn, 400)))
mix(M('schirm'), '#e8ffff', .5 * ss(.3, .9, vnoise(Pn, 900)))
mix(M('leder'), shade_of('leder', 1.2), .25 * ss(.5, .9, n2)); hgt += M('leder') * (n3 - .5) * .4
# AO einrechnen (weich), Gesicht schwächer
aoN = np.clip(ao, 0, 1); faceM = M('haut_kopf', 'lid', 'nase') & frontM
col *= np.where(faceM, .88 + .12 * aoN, np.where(M('haar', 'bart'), .5 + .5 * aoN, .6 + .4 * aoN))[..., None]
col = np.clip(col, 0, 1); alb = dilate(col, COV, 6); alb = np.where(COV[..., None], col, alb); log('Malen fertig')
IMG_ALB = to_image(alb, FID + '_Farbe'); IMG_ALB.colorspace_settings.name = 'sRGB'
hg = dilate(np.repeat(hgt[..., None], 3, 2), COV, 4)[..., 0]
nrm = height_to_normal_bake(OBJS, np.clip(hg * .5 + .5, 0, 1), TEX, strength=.3)
IMG_NRM = to_image(nrm[..., :3], FID + '_Normal', 'Non-Color')
save_png(alb, os.path.join(DIR, FID + '_farbe.png'))

# ---------------- Augen-/Mund-Textur (512×256): links Auge, rechts unten Mundhöhle ----------------
TW, TH = 512, 256; tex = np.zeros((TH, TW, 4), np.float32); tex[..., 3] = 1
vv, uu = np.mgrid[0:TH, 0:TW].astype(np.float32); u = (uu + .5) / TW; v = (vv + .5) / TH
ex = (u - .25) / .25; ey = (v - .5) / .5; rr = np.sqrt(ex ** 2 + ey ** 2)
def put(mask, c, a=1.0):
    a = np.clip(a, 0, 1) * mask; tex[..., :3] = tex[..., :3] * (1 - a[..., None]) + hexrgb(c) * a[..., None]
Le = u < .5; ic = hexrgb(SPEC['augen'])
hx = lambda c, f: '#%02x%02x%02x' % tuple(int(min(255, max(0, x * 255 * f))) for x in c)
put(Le, '#fbfaf6'); put(Le, '#c6cede', .55 * ss(.1, .6, ey))
IR = D.IRIS; iris = Le & (rr < IR); ang = np.arctan2(ey, ex); streaks = .5 + .5 * np.sin(ang * 23) * np.sin(ang * 7 + 1)
put(iris, hx(ic, 1.0)); put(iris, hx(ic, .55), ss(-.1, .45, ey)); put(iris, hx(ic, 1.5), .6 * ss(-.05, -.4, ey) * ss(.1, .34, rr))
put(iris, hx(ic, .75), .3 * streaks * ss(.12, .36, rr)); put(iris, hx(ic, .3), ss(IR - .08, IR - .01, rr))
put(Le & (rr < .17), '#0d1210'); put(Le & (rr < .19) & (rr >= .17), '#0d1210', .6)
put(Le, '#ffffff', ((ex - .14) ** 2 + (ey - .16) ** 2 < .085 ** 2).astype(np.float32))
put(Le, '#ffffff', .85 * ((ex + .13) ** 2 + (ey + .15) ** 2 < .04 ** 2))
Rm = (u >= .5) & (v < .5); mxn = (u - .5) / .5; myn = v / .5
inside = (np.abs(2 * mxn - 1) ** 2.4 + np.abs(2 * myn - 1) ** 2) < 1
put(Rm, '#5a2028'); put(Rm, '#7c2f36', ss(.2, .7, 1 - np.abs(2 * mxn - 1)) * .5)
put(Rm, '#f6f2ec', ((myn > .74) & (np.abs(2 * mxn - 1) < .62)).astype(np.float32))
put(Rm, '#d8757a', (((2 * mxn - 1) / .55) ** 2 + ((myn - .12) / .26) ** 2 < 1).astype(np.float32))
put(Rm, '#7a3b33', ss(.82, .98, np.abs(2 * mxn - 1) ** 2.4 + np.abs(2 * myn - 1) ** 2))
tex[..., 3] = np.where(Rm, inside.astype(np.float32), 1.0)
IMG_EYE = to_image(tex, FID + '_Augen')

# ---------------- Endmaterialien ----------------
for li, uvv in dec_uv.items(): FACE.data.uv_layers['UVMap'].data[li].uv = uvv
MAT_MAIN = final_material(FID + '_Haupt', IMG_ALB, IMG_NRM)
MAT_EYE = final_material(FID + '_Augen', IMG_EYE)
try: MAT_EYE.surface_render_method = 'DITHERED'
except Exception: pass
nt = MAT_EYE.node_tree; tn = [n for n in nt.nodes if n.type == 'TEX_IMAGE'][0]; nt.links.new(tn.outputs['Alpha'], nt.nodes['Principled BSDF'].inputs['Alpha'])
swap_materials(BODY, MAT_MAIN)
me = FACE.data; mats = list(me.materials); pidx = [1 if mats[p.material_index].name == 'mund_innen' else 0 for p in me.polygons]
me.materials.clear(); me.materials.append(MAT_MAIN); me.materials.append(MAT_EYE)
for p, i in zip(me.polygons, pidx): p.material_index = i
EYE.data.materials.clear(); EYE.data.materials.append(MAT_EYE)

# ---------------- LOD 1 (≈ 50 %) ----------------
activate(BODY); bpy.ops.object.duplicate(); LOD1 = bpy.context.active_object; LOD1.name = 'Koerper_LOD1'; LOD1.data.name = 'Koerper_LOD1'
for m in list(LOD1.modifiers):
    if m.type == 'ARMATURE': LOD1.modifiers.remove(m)
dm = LOD1.modifiers.new('Dez', 'DECIMATE'); dm.ratio = SPEC.get('lod', .5); dm.use_collapse_triangulate = True; activate(LOD1); bpy.ops.object.modifier_apply(modifier=dm.name)
try: LOD1.data.free_normals_split()
except Exception: pass
try:
    activate(LOD1); bpy.ops.mesh.customdata_custom_splitnormals_clear()
except Exception: pass
smooth(LOD1); LOD1.parent = ARMO; am = LOD1.modifiers.new('Armature', 'ARMATURE'); am.object = ARMO
log('LOD1', tris(LOD1))

# ---------------- Clips (30 fps, auf der Stelle) ----------------
import math as m_
def leg_ik(s, hip_off, foot_pos, foot_pitch):
    k = 'L' if s > 0 else 'R'; Hp0 = Lr(D.HIP, s); Hp = Hp0 + hip_off; Kn = Lr(D.KNEE, s); An = Lr(D.ANK, s)
    a = (Kn - Hp0).length; b = (An - Kn).length
    d = foot_pos - Hp; dl = max(.2 * kk, min(a + b - .002 * kk, Vector((0, d.y, d.z)).length))
    phi = m_.atan2(-d.y, -d.z); al = m_.acos(max(-1, min(1, (a * a + dl * dl - b * b) / (2 * a * dl))))
    kn = m_.pi - m_.acos(max(-1, min(1, (a * a + b * b - dl * dl) / (2 * a * b))))
    r0 = Kn - Hp0; phi0 = m_.atan2(-r0.y, -r0.z)
    th = -(phi + al - phi0); roll = m_.atan2(d.x - (An.x - Hp0.x), -d.z) * .8
    return {'thigh.' + k: qmul(ry(-roll), rx(th)), 'shin.' + k: rx(kn), 'foot.' + k: rx(-(th + kn) + foot_pitch)}
def arm_pose(s, down=.56, fwd=.08, elbow=.35, twist=.15, wrist=.12, curl=.42, thumb=.2, sh=0., roll=0.):
    """Natürliche Armhaltung: A-Pose (42°) → hängend (down), vor/zurück (fwd > 0 = nach vorn), Ellbogen, Handgelenk, Finger"""
    k = 'L' if s > 0 else 'R'; A = Lr(D.ARM, s); ax = Vector((A.z, 0, -A.x)).normalized()
    return {'upperarm.' + k: qmul(rx(-fwd), ry(s * down), Quaternion(A, -s * roll)), 'forearm.' + k: qmul(Quaternion(ax, elbow), Quaternion(A, -s * twist)),
            'hand.' + k: Quaternion(ax, wrist), 'finger1.' + k: ry(s * curl), 'finger2.' + k: ry(s * curl * 1.25), 'thumb.' + k: ry(s * thumb), 'shoulder.' + k: ry(-s * sh)}
ANK_H = D.ANK.z
STIL = SPEC.get('stil', {})
def gait(t, L, stance, hipz, bob, lift, lean, armsw, elbow, run=False):
    P = {}; ph = 2 * m_.pi * t
    hz = -hipz + bob * (m_.cos(4 * m_.pi * t) if not run else -m_.cos(4 * m_.pi * t)); sway = .009 * kk * m_.sin(ph) * (0 if run else 1)
    off = Vector((sway, 0, hz)); P['hips:loc'] = off
    P['hips'] = qmul(rz(.1 * m_.sin(ph)), ry(.035 * m_.cos(ph)))
    P['spine'] = qmul(rx(lean * .5), rz(-.06 * m_.sin(ph))); P['chest'] = qmul(rx(lean * .4), rz(-.1 * m_.sin(ph)))
    P['neck'] = rx(-lean * .45); P['head'] = qmul(rx(-lean * .35), rz(.035 * m_.sin(ph)))
    for s, sh in ((1, 0), (-1, .5)):
        u = (t + sh) % 1.0
        if u < stance:
            w = u / stance; fy = L * (.5 - w) * stance
            pitch = (-.22 * (1 - ss(0, .2, w)) + .38 * ss(.72, 1, w)) * (1 if not run else .7)
            fz = .02 * kk * ss(.75, 1, w) + .01 * kk * (1 - ss(0, .15, w))
        else:
            w = (u - stance) / (1 - stance); e = .5 - .5 * m_.cos(m_.pi * w)
            fy = L * (-.5 + e) * stance; fz = lift * m_.sin(m_.pi * w) ** (1.2 if not run else .8) + .02 * kk * (1 - w)
            pitch = .5 * (1 - ss(0, .5, w)) - .22 * ss(.6, 1, w)
            if run: fz += .05 * kk * m_.sin(m_.pi * w); fy -= L * .06 * m_.sin(m_.pi * w)
        foot = Vector((Lr(D.ANK, s).x, Lr(D.ANK, s).y - fy, ANK_H + fz))
        P.update(leg_ik(s, off, foot, pitch))
    for s in (1, -1):
        sw = armsw * m_.cos(ph) * (-1 if s > 0 else 1)   # linkes Bein vorn bei t=0 → rechter Arm vorn
        P.update(arm_pose(s, down=.58 if not run else .52, fwd=sw + (.08 if run else .02), elbow=elbow + .35 * max(0, sw) * (1 if not run else .5), twist=.2, wrist=.1, curl=.5 if not run else .95, thumb=.3, roll=.1 if run else 0))
    return P
def idle(t):
    ph = 2 * m_.pi * t; br = m_.sin(ph * 3)          # 3 Atemzüge je 4 s
    P = {}; sway = .01 * kk * m_.sin(ph) + .008 * kk; P['hips:loc'] = Vector((sway, 0, -.006 * kk + .0012 * kk * br))
    P['hips'] = qmul(ry(.035 + .015 * m_.sin(ph)), rz(.04 * m_.sin(ph * .5)))          # Gewicht auf einem Bein (Kontrapost)
    P['spine'] = qmul(rx(.03 - .008 * br), ry(-.03)); P['chest'] = qmul(rx(.02 - .02 * br), ry(-.015 * m_.sin(ph)))
    look = .14 * ss(.25, .45, (t % 1)) * (1 - ss(.6, .8, (t % 1))) - .08 * ss(.82, .95, t % 1) * (1 - ss(.97, 1, t % 1))
    P['neck'] = qmul(rz(look * .5), rx(-.03)); P['head'] = qmul(rz(look * .6), rx(.0 + .015 * m_.sin(ph * 2)), ry(-.05))
    for s in (-1, 1):
        lean = Vector((sway, 0, -.006 * kk))
        foot = Vector((Lr(D.ANK, s).x + s * .012 * kk, Lr(D.ANK, s).y + (-.03 * kk if s < 0 else .015 * kk), ANK_H))
        P.update(leg_ik(s, lean + Vector((0, 0, (.004 * kk if s > 0 else -.002 * kk))), foot, .0))
    st = STIL.get('idle', 'locker')
    if st == 'haende_hinten':
        for s in (-1, 1): P.update(arm_pose(s, down=.62, fwd=-.32, elbow=.95, twist=.9, wrist=.2, curl=.6, thumb=.3, sh=.05))
    elif st == 'huefte':
        for s in (-1, 1): P.update(arm_pose(s, down=.2, fwd=-.12, elbow=1.55, twist=.4, wrist=-.35, curl=.95, thumb=.4, sh=.0))
    else:
        for s in (-1, 1): P.update(arm_pose(s, down=.62 + .012 * br, fwd=.06 + .02 * (s > 0), elbow=.3 + .05 * (s < 0) + .02 * br, twist=-.35, wrist=.08, curl=.3, thumb=.15, sh=.03 * br))
    P['hair_vorn'] = rx(.03 * m_.sin(ph * 2)); P['hair_hinten'] = rx(.02 * m_.sin(ph * 2 + 1))
    return P
def env_(t, a, b, c, d): return ss(a, b, t) * (1 - ss(c, d, t))
def once_base(t):
    P = idle(0); return P
def winken(t):
    P = idle(t * .25); e = env_(t, 0, .2, .8, 1); w = m_.sin(t * 2 * m_.pi * 3.0) * e
    P.update(arm_pose(-1, down=lerp(.6, -.45, e), fwd=lerp(.05, .25, e), elbow=lerp(.28, 1.5 + .25 * w, e), twist=lerp(.18, .3, e), wrist=lerp(.14, .05, e), curl=lerp(.45, .08, e), thumb=.1, roll=lerp(0, 1.35 + .35 * w, e)))
    P['chest'] = qmul(P['chest'], rz(-.05 * e), ry(.05 * e)); P['head'] = qmul(P['head'], rz(.1 * e), ry(.08 * e))
    return P
def jubeln(t):
    P = idle(0); crouch = env_(t, 0, .18, .2, .34); jump = m_.sin(m_.pi * ss(.3, .62, t)) * (1 - ss(.62, .63, t)); land = env_(t, .6, .66, .7, .85)
    e = env_(t, .12, .32, .82, 1)
    P['hips:loc'] = Vector((0, 0, -.045 * kk * crouch + .1 * kk * jump - .03 * kk * land))
    for s in (-1, 1):
        foot = Vector((Lr(D.ANK, s).x + s * .01 * kk, Lr(D.ANK, s).y, ANK_H + .1 * kk * jump * .85))
        P.update(leg_ik(s, P['hips:loc'], foot, -.25 * jump))
        P.update(arm_pose(s, down=lerp(.6, -1.95, e), fwd=lerp(.05, .25, e), elbow=lerp(.28, .5, e) + .2 * m_.sin(t * 22) * e, twist=lerp(.18, .6, e), wrist=.1, curl=lerp(.45, 1.15, e), thumb=.5, roll=lerp(0, 1.2, e)))
    P['chest'] = qmul(rx(.12 * e), ry(0)); P['head'] = rx(.18 * e - .05 * crouch); P['neck'] = rx(.06 * e)
    P['spine'] = rx(-.12 * crouch + .06 * e)
    return P
def werfen(t):
    P = idle(0); wind = env_(t, .0, .32, .42, .5); thr = env_(t, .4, .52, .7, 1); step = ss(.25, .5, t) * (1 - ss(.85, 1, t))
    P['hips:loc'] = Vector((0, -.04 * kk * step, -.02 * kk * step)); P['hips'] = rz(.25 * wind - .3 * thr)
    P['spine'] = qmul(rz(.25 * wind - .35 * thr), rx(-.12 * wind + .25 * thr)); P['chest'] = qmul(rz(.2 * wind - .3 * thr), rx(.15 * thr))
    P['head'] = qmul(rz(-.2 * wind + .25 * thr), rx(-.1 * thr))
    for s in (-1, 1):
        lead = s > 0
        foot = Vector((Lr(D.ANK, s).x, Lr(D.ANK, s).y + (-.16 * kk * step if lead else .06 * kk * step), ANK_H + (.05 * kk * env_(t, .2, .3, .38, .48) if lead else 0)))
        P.update(leg_ik(s, P['hips:loc'], foot, 0))
    P.update(arm_pose(-1, down=lerp(lerp(.6, -.55, wind), .35, thr), fwd=lerp(lerp(.05, -.55, wind), 1.05, thr), elbow=lerp(lerp(.28, 1.5, wind), .25, thr), twist=.4, wrist=lerp(-.3, .4, thr), curl=lerp(.95, .1, thr), thumb=.4, roll=lerp(0, 1.3, wind) * (1 - thr)))
    P.update(arm_pose(1, down=lerp(.6, .1, wind), fwd=lerp(.05, .65, wind) - .5 * thr, elbow=.5, twist=.2, wrist=.1, curl=.4))
    return P
STRIDE_W, STRIDE_J, STRIDE_R = {'kind': (1.05, 2.05, 3.0), 'teen': (1.2, 2.25, 3.2)}.get(D.spec['typ'], (1.32, 2.4, 3.3))   # Doppelschritt (m) je Clip-Durchlauf
FR = {'walk': 30, 'jog': 21, 'run': 17}
CLIPS = {}
CLIPS['idle'] = make_action(ARMO, 'idle', 120, idle)
CLIPS['walk'] = make_action(ARMO, 'walk', FR['walk'], lambda t: dict(gait(t, STRIDE_W, .6, .016 * kk, .009 * kk, .085 * kk, .05, .32, .22), hair_vorn=rx(-.04 + .03 * m_.sin(4 * m_.pi * t)), hair_hinten=rx(.05 + .03 * m_.sin(4 * m_.pi * t))))
CLIPS['jog'] = make_action(ARMO, 'jog', FR['jog'], lambda t: dict(gait(t, STRIDE_J, .42, .045 * kk, .016 * kk, .13 * kk, .12, .45, .95, run=True), hair_vorn=rx(-.1 + .05 * m_.sin(4 * m_.pi * t)), hair_hinten=rx(.12 + .05 * m_.sin(4 * m_.pi * t))))
CLIPS['run'] = make_action(ARMO, 'run', FR['run'], lambda t: dict(gait(t, STRIDE_R, .34, .07 * kk, .022 * kk, .17 * kk, .22, .62, 1.25, run=True), hair_vorn=rx(-.16 + .06 * m_.sin(4 * m_.pi * t)), hair_hinten=rx(.2 + .06 * m_.sin(4 * m_.pi * t))))
CLIPS['winken'] = make_action(ARMO, 'winken', 54, winken, loop=False)
CLIPS['jubeln'] = make_action(ARMO, 'jubeln', 42, jubeln, loop=False)
CLIPS['werfen'] = make_action(ARMO, 'werfen', 36, werfen, loop=False)
rest_pose(ARMO)

# ---------------- Export ----------------
for o in (BODY, FACE, EYE, LOD1): o.data.update()
export_glb(OUT, [BODY, FACE, EYE, LOD1], ARMO)
meta = {'modell': FID, 'typ': D.spec['typ'], 'dreiecke': {'koerper': tris(BODY), 'gesicht': tris(FACE), 'augen': tris(EYE)}, 'lod1': tris(LOD1), 'knochen': len(B),
        'shapeKeys': [k.name for k in FACE.data.shape_keys.key_blocks][1:], 'clips': {n: round(CLIPS[n].frame_range[1] / 30, 3) for n in CLIPS},
        'schritt': {'walk': [round(STRIDE_W, 3), FR['walk'] / 30], 'jog': [round(STRIDE_J, 3), FR['jog'] / 30], 'run': [round(STRIDE_R, 3), FR['run'] / 30]},
        'hoehe': round(H, 3), 'textur': TEX, 'bauzeit_s': round(time.time() - T0, 1)}
meta['dreiecke']['gesamt'] = sum(meta['dreiecke'].values())
json.dump(meta, open(OUT.replace('.glb', '.json'), 'w'), indent=1); log('META', json.dumps(meta))
