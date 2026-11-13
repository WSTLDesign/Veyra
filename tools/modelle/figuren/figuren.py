# Veyra Figuren Runde 2 – Steckbriefe + Zusammenbau. Eigene Entwürfe passend zu src/34-figures.js (Farben/Frisuren der Figuren).
# Aufruf: <venv>/bin/python tools/modelle/figuren/figuren.py <id> <ausgabe.glb> [--form]   (--form = nur Formen + Kontrollbilder)
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fkit import *

SPECS = {
 # Held Noa (Stufe 0 „Startkleidung“): grünes T-Shirt mit Blatt, braune Cargohose, helle Turnschuhe mit Signatur-Schnürsenkeln, Schutzbrille auf der Stirn, Handgelenk-Gerät
 'noa': dict(typ='kind', augen='#4a9a3a', haar='wuschel', gesicht=dict(mund_laune=.03),
   farben=dict(haut='#f6d3b3', haar='#7a4a26', braue='#5a3418', top='#3f7a3a', saum='#2e5a2c', hose='#6a4a30', saum2='#5a3e28', schuh='#ece6da', sohle='#b9b6b0',
               leder='#4d5236', metall='#b08a48', glas='#6fcde4', dunkel='#3a3f4a', akzent='#d81b72', streifen='#8fbf4a', emblem='#e9d27a'),
   kleidung=dict(top=dict(art='tshirt', saum=.565, arm=.27, weit=.008), unten=dict(art='cargo', bund=.575, bis=0, weit=.009), schuhe='sneaker'),
   extras=['schutzbrille', 'geraet', 'cargotaschen'], muster=['blatt'], groesse='kind'),
 # Rivale Rayan: schwarze Stacheln mit roten Spitzen, dunkle Zip-Jacke (rot abgesetzt) über grauem Shirt, dunkle Cargohose, Stiefel
 'rayan': dict(typ='kind', augen='#c0302a', haar='stachel', gesicht=dict(mund_laune=.0, braue_z=.27, lid_o=27),
   farben=dict(haut='#f1cfae', haar='#1e1a22', haar_hi='#d0303a', braue='#1e1a22', top='#7a7680', jacke='#2a2730', saum='#c0303a', hose='#2c2a32', saum2='#24222a',
               schuh='#26232c', sohle='#8a8890', leder='#3a3038', metall='#c0303a', dunkel='#3a3038', akzent='#e04040'),
   kleidung=dict(top=dict(art='tshirt', saum=.565, arm=.25, weit=.006), jacke=dict(saum=.552, arm=.78, offen=.026, abstand=.011), unten=dict(art='cargo', bund=.575, bis=0, weit=.008), schuhe='stiefel'),
   extras=['cargotaschen', 'reissverschluss'], muster=['flamme'], groesse='kind'),
 # Prof. Veyran: weiße Wolkenhaare, Vollbart, runde Brille, cremefarbenes Hemd, grüner Forschermantel mit Goldsaum
 'veyran': dict(typ='alt_m', augen='#5a7a4a', haar='wolke', bart='vollbart', gesicht=dict(mund_laune=.035, auge_r=.19, lid_o=24),
   farben=dict(haut='#f0cdb0', haar='#eeeae4', bart='#f2efe8', braue='#d8d4cc', top='#e9e2cf', kittel='#4c8a4a', saum='#d9c27a', hose='#6a5e50', saum2='#5a5044',
               schuh='#6a4a30', sohle='#3a2e26', metall='#c9a24a', glas='#dff2f6', knopf='#d9c27a'),
   kleidung=dict(top=dict(art='hemd', saum=.56, arm=.98, weit=.007), kittel=dict(saum=.57, arm=.93, offen=.034, bis=.30, abstand=.013), unten=dict(art='hose', bund=.565, bis=0, weit=.009), schuhe='halbschuh'),
   extras=['brille_rund', 'kragen'], muster=['blatt_wappen'], groesse='alt'),
 # Mama: Dutt mit losen Strähnen, korallfarbene Bluse, Schürze, blauer Rock, Stiefeletten
 'mama': dict(typ='frau', augen='#6a4a2a', haar='dutt_lose', gesicht=dict(mund_laune=.035),
   farben=dict(haut='#f3cfae', haar='#7a4a26', braue='#5a3418', top='#e07a6a', saum='#b8564a', rock='#6a8ab8', schuerze='#f3ead8', saum2='#d8c8a8', schuh='#7a5434', sohle='#4a3426', knopf='#ffffff', socke='#efe6d2'),
   kleidung=dict(top=dict(art='bluse', saum=.555, arm=.86, weit=.008), rock=dict(oben=.575, bis=.25, weite=.05), schuerze=dict(oben=.70, bis=.33), unten=dict(art='beine', bund=.5, bis=0), schuhe='stiefel', socken=.04),
   extras=['kragen'], muster=['karo_schuerze'], groesse='frau'),
 # Mirael (Kreaturenstation): Dutt mit weißer Blüte, Sommersprossen, weißer Heilerkittel mit grünem Saum, grüner Rock
 'mirael': dict(typ='frau', augen='#3a9a4a', haar='dutt', gesicht=dict(mund_laune=.04, sommersprossen=1),
   farben=dict(haut='#f6d6bc', haar='#8a4a26', braue='#6a3418', top='#eaf3e4', kittel='#f6f1e6', saum='#5cb85a', rock='#4c8a4a', schuh='#7a5434', sohle='#4a3426', socke='#efe6d2', blume='#ffffff', knopf='#5cb85a', metall='#d0d8e0'),
   kleidung=dict(top=dict(art='hemd', saum=.555, arm=.86, weit=.006), kittel=dict(saum=.56, arm=.86, offen=.03, bis=.33, abstand=.012), rock=dict(oben=.565, bis=.36, weite=.03), unten=dict(art='beine', bund=.5, bis=0), schuhe='stiefel', socken=.07),
   extras=['blume', 'kragen', 'kreuz_blatt'], muster=[], groesse='frau'),
 # Ladenbesitzer (eigener Entwurf): kräftig, Schnurrbart, hellblaues Hemd mit hochgekrempelten Ärmeln, grüne Schürze, Schirmmütze
 'haendler': dict(typ='kraeftig', augen='#6a4a2a', haar='muetze', bart='schnurr', gesicht=dict(mund_laune=.04, auge_r=.19),
   farben=dict(haut='#efc9a4', haar='#5a3a24', bart='#4a2e1c', braue='#4a2e1c', top='#7aa6d8', saum='#5a86b8', schuerze='#3e6a4a', saum2='#2e5a3a', hose='#4a4038', muetze='#3e6a4a', schuh='#5a3a26', sohle='#2e2420', knopf='#efe6d2'),
   kleidung=dict(top=dict(art='hemd', saum=.55, arm=.5, weit=.008), schuerze=dict(oben=.74, bis=.30), unten=dict(art='hose', bund=.56, bis=0, weit=.01), schuhe='halbschuh', muetze='schirm'),
   extras=['kragen', 'aufschlag'], muster=[], groesse='kraeftig'),
 # Stadtbewohnerin (jung): blonder Pferdeschwanz, rostrote kurze Jacke über weißem Shirt, Jeans, Turnschuhe
 'buerger_a': dict(typ='frau', augen='#3a6aa8', haar='pferd', gesicht=dict(mund_laune=.03),
   farben=dict(haut='#f3cfae', haar='#c8a050', braue='#8a6a3a', top='#f2f0ea', jacke='#c8603a', saum='#a84a2a', hose='#3a4a6a', saum2='#2e3c58', schuh='#f2f0ea', sohle='#c8c4bc', knopf='#e0d0a0', akzent='#c8603a'),
   kleidung=dict(top=dict(art='tshirt', saum=.56, arm=.2, weit=.005), jacke=dict(saum=.585, arm=.9, offen=.04, abstand=.011), unten=dict(art='hose', bund=.56, bis=0, weit=.006), schuhe='sneaker'),
   extras=[], muster=[], groesse='frau'),
 # Stadtbewohnerin (älter): kurze graue Locken, violette Strickjacke über heller Bluse, grauer Rock, Brille
 'buerger_b': dict(typ='alt_w', augen='#5a5a5a', haar='locken_kurz', gesicht=dict(mund_laune=.035, auge_r=.19),
   farben=dict(haut='#f1c8a0', haar='#d8d4cc', braue='#b8b4ac', top='#efe6d2', jacke='#8a6aa8', saum='#6a4a88', rock='#5a5a62', schuh='#3a3030', sohle='#2a2222', socke='#c8b8a8', glas='#dff2f6', metall='#9a8a78', knopf='#e8d8a8'),
   kleidung=dict(top=dict(art='bluse', saum=.555, arm=.86, weit=.006), jacke=dict(saum=.535, arm=.92, offen=.035, abstand=.012, weit=1.4), rock=dict(oben=.565, bis=.22, weite=.035), unten=dict(art='beine', bund=.5, bis=0), schuhe='halbschuh', socken=.06),
   extras=['brille_rund'], muster=['strick'], groesse='alt_w'),
 # Stadtbewohner (Mann): kurzes dunkles Haar, kurzer Bart, grünes Hemd mit gekrempelten Ärmeln, braune Hose, Stiefel, Umhängetasche
 'buerger_c': dict(typ='mann', augen='#3a6aa8', haar='kurz', bart='kurzbart', gesicht=dict(mund_laune=.025),
   farben=dict(haut='#e2b48c', haar='#2a1d16', bart='#2a1d16', braue='#2a1d16', top='#5a8a6a', saum='#4a7a5a', hose='#5a4a36', saum2='#4a3c2c', schuh='#4a3426', sohle='#2a2020', leder='#8a5a30', knopf='#e8dcc0', metall='#c9a24a'),
   kleidung=dict(top=dict(art='hemd', saum=.555, arm=.5, weit=.008), unten=dict(art='hose', bund=.56, bis=0, weit=.009), schuhe='stiefel'),
   extras=['kragen', 'aufschlag', 'tasche'], muster=[], groesse='mann'),
 # Stadtbewohner (jugendlich): gelbe Mütze, blauer Kapuzenpulli, graue Hose, Turnschuhe, Rucksack
 'buerger_d': dict(typ='teen', augen='#4a6a3a', haar='muetze', gesicht=dict(mund_laune=.035),
   farben=dict(haut='#c98f62', haar='#2a1d16', braue='#2a1d16', top='#3a7ac8', saum='#2e62a8', hose='#5a5a62', saum2='#4a4a52', muetze='#e0b030', schuh='#f2f0ea', sohle='#3a7ac8', rucksack='#d05a3a', leder='#8a3a2a', metall='#c9c9c9', akzent='#e0b030'),
   kleidung=dict(top=dict(art='pulli', saum=.55, arm=.95, weit=.011), unten=dict(art='hose', bund=.555, bis=0, weit=.009), schuhe='sneaker', muetze='beanie'),
   extras=['rucksack', 'kapuze'], muster=[], groesse='teen'),
}

def assemble(spec):
    setup(spec); regions(spec); H = D.H; K = spec['kleidung']; k = H / 1.45
    body = build_body(); dress_body(body, spec); bvb = bvh_of(body, 'body')
    hp = build_head(); head = hp['head']
    extra = []; covers = []
    # --- Säume / Kragen / Bündchen ---
    top = K.get('top'); bot = K.get('unten')
    if top:
        ring_fit(bvb, 'Saum', (0, 0, top['saum'] * H + .003 * H), (0, 0, 1), .007 * k, .0028 * k, 'saum', .0025 * k, 34, out=extra)
        if top['art'] in ('tshirt', 'pulli', 'bluse'): ring_fit(bvb, 'Kragen', (0, D.NECK0.y + .002 * H, D.NECK0.z + .004 * H), (0, .25, 1), .0075 * k, .0035 * k, 'saum', .003 * k, 22, reach=.1, out=extra)
        L = D.L_UA + D.L_FA
        for s in (-1, 1):
            S = Lr(D.SH, s); A = Lr(D.ARM, s); t = top['arm'] * L - .004 * H
            if top['arm'] < .96: ring_fit(bvb, 'Aermel', S + A * t, A, .0058 * k * (1.4 if top['arm'] > .4 and top['arm'] < .7 else 1), .0034 * k, 'saum', .0016 * k, 20, out=extra)
    if bot and bot['art'] in ('cargo', 'hose'):
        ring_fit(bvb, 'Bund', (0, 0, bot['bund'] * H - .006 * H), (0, 0, 1), .009 * k, .0028 * k, 'saum2', .0012 * k, 34, out=extra)
        for s in (-1, 1):
            A_ = Lr(D.ANK, s); ring_fit(bvb, 'Hosensaum', A_ + Vector((0, 0, .038 * H)), (0, -.12, 1), .011 * k, .0035 * k, 'saum2', .002 * k, 18, out=extra)
    # --- Jacke / Kittel ---
    if K.get('jacke'):
        J = K['jacke']; jo = jacket_shell(body, spec, J, 'jacke'); extra.append(jo); covers.append(jo)
    if K.get('kittel'):
        J = K['kittel']; jo = jacket_shell(body, spec, J, 'kittel'); extra.append(jo); covers.append(jo)
        sk = skirt(spec, J['saum'] * H + .01 * H, J['bis'] * H, .045, 'kittel', front_gap=.55, n=26, rows=6, folds=5, amp=.004, name='Mantelschoss', push=.016)
        solidify(sk, .004 * k, 1); extra.append(sk)
    if K.get('rock'):
        Rk = K['rock']; sk = skirt(spec, Rk['oben'] * H, Rk['bis'] * H, Rk['weite'], 'rock', n=30, rows=7, folds=7, amp=.005, push=.009)
        solidify(sk, .004 * k, 1); extra.append(sk)
        ring_fit(bvb, 'Rockbund', (0, 0, Rk['oben'] * H - .004 * H), (0, 0, 1), .009 * k, .003 * k, 'rock', .008 * k, 34, out=extra)
    if K.get('schuerze'):
        S_ = K['schuerze']; extra += apron(spec, S_)
    # --- Schuhe ---
    shoes = []
    for s in (-1, 1): shoes += shoe(s, K.get('schuhe', 'sneaker'), 'schuh')
    # --- Haare, Bart ---
    hair = build_hair(spec['haar'])
    if spec.get('bart'): hair += build_beard(spec['bart'])
    # --- Zubehör ---
    acc = accessories(spec, bvb)
    return dict(body=body, hp=hp, extra=extra, shoes=shoes, hair=hair, acc=acc, covers=covers)

def apron(spec, S_):
    H = D.H; k = H / 1.45; out = []; rings = []
    rows = 8; n = 9
    for i in range(rows + 1):
        t = i / rows; z = lerp(S_['oben'] * H, S_['bis'] * H, t); r = []
        w, d, off = torso_prof(max(z, D.HIP.z - .02 * H))
        bib = z > D.HIP.z + (D.SH.z - D.HIP.z) * .38
        half = (w * .62 if bib else w * 1.0 + .03 * H * ss(D.HIP.z, S_['bis'] * H, z))
        for j in range(n):
            a = (j / (n - 1) - .5) * 2; x = a * half
            ww, dd, oo = torso_prof(max(z, D.HIP.z + .03 * H)); yy = -dd * math.sqrt(max(0, 1 - min(1, (x / (ww * 1.1)) ** 2))) - .011 * H + oo
            if z < D.HIP.z + .03 * H: yy = min(yy, -dd - .02 * H * ss(D.HIP.z, S_['bis'] * H, z)) - .008 * H
            yy += .003 * H * math.sin(a * 5 + 1) * ss(D.HIP.z, S_['bis'] * H, z)
            r.append(Vector((x, yy, z)))
        rings.append(r)
    o = loft_rings('Schuerze', rings, 'schuerze', closed=False); solidify(o, .0035 * k, 1); out.append(o)
    # Bänder: Nacken + Taille
    import fkit; bvb = fkit._BVB['body']
    ring_fit(bvb, 'Schuerzenband', (0, 0, lerp(D.HIP.z, D.SH.z, .38)), (0, 0, 1), .007 * k, .0025 * k, 'saum2', .009 * k, 30, out=out)
    for s in (-1, 1):
        a = Vector((s * torso_prof(S_['oben'] * H)[0] * .58, -torso_prof(S_['oben'] * H)[1] - .012 * H, S_['oben'] * H)); b = Vector((s * .03 * H, -.01 * H, D.NECK0.z + .01 * H)); c = Vector((0, .03 * H, D.NECK0.z))
        o = loft('Traeger', [a, a.lerp(b, .5) + Vector((s * .004 * H, -.006 * H, 0)), b, Vector((s * .02 * H, .02 * H, D.NECK0.z + .006 * H)), c], lambda t: .006 * k, lambda t: .0022 * k, ring=4, n=10, cap0=False)
        set_region(o, 'saum2'); out.append(o)
    return out

def accessories(spec, bvb):
    H = D.H; k = H / 1.45; ex = spec.get('extras', []); out = []; K = spec['kleidung']
    if 'schutzbrille' in ex:
        rp = []
        for j in range(29):
            ph = j / 28 * 2 * math.pi; th = .74 + .1 * ss(-.2, -1, math.cos(ph)); rp.append(head_dir_point(sdir(th, ph), .04 * k))
        o = loft('Band', rp, lambda t: .0045 * k, lambda t: .0018 * k, ring=4, n=34, flat_up=(0, 0, 1), cap0=False); set_region(o, 'leder'); out.append(o)
        for s in (-1, 1):
            d = Vector((s * .3, -math.cos(.58), math.sin(.85))).normalized(); c = head_dir_point(d, .048 * k)
            nrm = ((c - D.HC).normalized() + Vector((0, 0, .45))).normalized(); q = nrm.to_track_quat('Z', 'Y')
            bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=14, radius1=.025 * k, radius2=.022 * k, depth=.017 * k)
            o = obj_bm('Brillenrahmen', bm); M = q.to_matrix().to_4x4(); M.translation = c; o.data.transform(M); mod(o, 'BEVEL', width=.002 * k, segments=1); apply_mods(o); smooth(o); set_region(o, 'metall'); out.append(o)
            bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=6, radius=.02 * k)
            o = obj_bm('Glas', bm); o.data.transform(Matrix.Diagonal((1, 1, .38, 1))); M = q.to_matrix().to_4x4(); M.translation = c + nrm * .0085 * k; o.data.transform(M); smooth(o); set_region(o, 'glas'); out.append(o)
        pL = head_dir_point(Vector((.12, -math.cos(.58), math.sin(.85))).normalized(), .048 * k); pR = mx(pL)
        o = loft('Steg', [pR, (pR + pL) / 2 + Vector((0, -.004, .002)), pL], lambda t: .0035 * k, lambda t: .0025 * k, ring=5, n=6); set_region(o, 'metall'); out.append(o)
    if 'brille_rund' in ex:
        for s in (-1, 1):
            C, f = D.EYES[s]; c = C + f * D.RE * 1.75 + Vector((0, 0, -.004 * k)); R_ = D.RE * 1.45
            pts = [c + (Vector((math.cos(a), 0, math.sin(a))) * R_) for a in [j / 20 * 2 * math.pi for j in range(21)]]
            o = loft('Brille', pts, lambda t: .0016 * k, lambda t: .0016 * k, ring=4, n=22, cap0=False, flat_up=(0, -1, 0)); set_region(o, 'metall'); out.append(o)
            g = blob('Brillenglas', c + Vector((0, .001, 0)), (R_, .0012 * k, R_), 2); set_region(g, 'glas'); out.append(g)
            hp_ = head_dir_point(Vector((s * .98, -.05, -.05)).normalized(), .004 * k)
            o = loft('Buegel', [c + Vector((s * R_, 0, 0)), c + Vector((s * R_ * 1.25, .03 * k, .002 * k)), hp_ + Vector((0, -.02 * k, .006 * k)), hp_ + Vector((0, .02 * k, -.004 * k))], lambda t: .0014 * k, lambda t: .0014 * k, ring=4, n=8, cap0=False)
            set_region(o, 'metall'); out.append(o)
        a = D.EYES[1][0] + D.EYES[1][1] * D.RE * 1.75 + Vector((-D.RE * 1.45, 0, -.002 * k)); b = mx(a)
        o = loft('Brillensteg', [a, (a + b) / 2 + Vector((0, -.003 * k, .004 * k)), b], lambda t: .0016 * k, lambda t: .0016 * k, ring=4, n=6); set_region(o, 'metall'); out.append(o)
    if 'geraet' in ex:   # Handgelenk-Gerät links
        A = D.ARM; dv = D.SH + A * (D.L_UA + D.L_FA - .028 * H); gq = A.to_track_quat('Y', 'Z')
        hit = bvb.ray_cast(dv + Vector((0, 0, .1)), Vector((0, 0, -1)))
        for nm, sz, reg, off in (('Geraet', (.026 * k, .032 * k, .01 * k), 'dunkel', 0), ('Schirm', (.019 * k, .023 * k, .003 * k), 'schirm', .008 * k)):
            bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1); o = obj_bm(nm, bm); o.data.transform(Matrix.Diagonal((*sz, 1)))
            mod(o, 'BEVEL', width=.0025 * k if reg == 'dunkel' else .001 * k, segments=2); apply_mods(o); smooth(o)
            M = gq.to_matrix().to_4x4(); M.translation = (hit[0] if hit[0] else dv) + Vector((0, 0, .005 * k + off)); o.data.transform(M); set_region(o, reg); out.append(o)
        ring_fit(bvb, 'Armband', dv, A, .01 * k, .003 * k, 'dunkel', .0022 * k, 16, out=out)
    if 'cargotaschen' in ex:
        for s in (-1, 1):
            K_, Hp = Lr(D.KNEE, s), Lr(D.HIP, s); c = Hp.lerp(K_, .5)
            hit = bvb.ray_cast(c + Vector((s * .3, 0, 0)), Vector((-s, 0, 0))); pc = hit[0] + Vector((s * .004 * k, 0, 0))
            o = blob('Tasche', pc, (.008 * k, .037 * k, .046 * k), 3); set_region(o, 'saum2'); out.append(o)
            o = blob('Klappe', pc + Vector((s * .004 * k, 0, .037 * k)), (.006 * k, .039 * k, .012 * k), 2); set_region(o, 'saum2'); out.append(o)
    if 'kragen' in ex:   # Hemdkragen (umgelegt)
        pts = []
        for j in range(17):
            a = -math.pi / 2 + (j / 16 - .5) * 2 * 2.75; dv = Vector((math.cos(a), math.sin(a), 0))
            hit = bvb.ray_cast(Vector((0, D.NECK0.y, D.NECK0.z + .006 * H)), dv, .2); p = (hit[0] if hit[0] else Vector((0, 0, D.NECK0.z))) + dv * .004 * k
            pts.append(p)
        o = loft('Hemdkragen', pts, lambda t: .013 * k * (1 + .5 * ss(.35, 0, abs(t - .5))), lambda t: .0025 * k, ring=4, n=20, cap0=False, flat_up=(0, .3, 1)); set_region(o, 'top'); out.append(o)
    if 'aufschlag' in ex:   # hochgekrempelte Ärmel (Wulst)
        L = D.L_UA + D.L_FA
        for s in (-1, 1):
            S = Lr(D.SH, s); A = Lr(D.ARM, s); t = K['top']['arm'] * L - .012 * H
            ring_fit(bvb, 'Krempel', S + A * t, A, .016 * k, .006 * k, 'top', .004 * k, 18, out=out)
    if 'blume' in ex:
        c = head_dir_point(sdir(.85, 2.2), .02 * k)
        for i in range(5):
            a = i / 5 * 2 * math.pi; o = blob('Bluete', c + Vector((math.cos(a) * .014 * k, -.006 * k, math.sin(a) * .014 * k)), (.012 * k, .005 * k, .012 * k), 2); set_region(o, 'blume'); out.append(o)
        o = blob('Bluetenmitte', c + Vector((0, -.01 * k, 0)), (.007 * k, .006 * k, .007 * k), 2); set_region(o, 'knopf'); out.append(o)
    if 'tasche' in ex:   # Umhängetasche (rechte Hüfte), Gurt über die linke Schulter
        c = Vector((-.11 * H / 1.45 * 1.25, -.01 * H, D.HIP.z + .01 * H))
        o = blob('Tasche', c, (.026 * H, .042 * H, .036 * H), 3, lambda v, q: Vector((q.x * (1 if v.x > 0 else 1.1), q.y, q.z if v.z > -.6 else q.z * .9))); set_region(o, 'leder'); out.append(o)
        P = []
        for j in range(15):
            t = j / 14; z = lerp(c.z + .03 * H, D.SH.z + .02 * H, ss(0, 1, t) if t < .9 else 1); x = lerp(c.x, D.SH.x * .55, t)
            hit = bvb.ray_cast(Vector((0, 0, z)), Vector((x, -.08 * H, 0)).normalized(), .4); P.append((hit[0] if hit[0] else Vector((x, -.1 * H, z))) + Vector((0, -.006 * k, 0)))
        o = loft('Gurt', P, lambda t: .012 * k, lambda t: .0025 * k, ring=4, n=18, cap0=False, flat_up=(0, -1, 0)); set_region(o, 'leder'); out.append(o)
    if 'rucksack' in ex:
        w, d, off = torso_prof(lerp(D.HIP.z, D.SH.z, .65)); c = Vector((0, d + .07 * H / 1.6 * 1.6 * .5 + .03 * H, lerp(D.HIP.z, D.SH.z, .58)))
        o = blob('Rucksack', c, (.09 * H / 1.6 * 1.6 * .78, .05 * H, .11 * H), 4, lambda v, q: Vector((q.x * (1 - .1 * v.z), q.y * (1 if v.y > 0 else .55), q.z))); set_region(o, 'rucksack'); out.append(o)
        o = blob('Ruckklappe', c + Vector((0, .02 * H, .07 * H)), (.075 * H, .035 * H, .045 * H), 3, lambda v, q: Vector((q.x, q.y * (1 if v.y > 0 else .3), q.z))); set_region(o, 'leder'); out.append(o)
        for s in (-1, 1):
            P = [Vector((s * .05 * H, c.y - .03 * H, c.z + .1 * H)), Vector((s * .065 * H, .02 * H, D.SH.z + .022 * H)), Vector((s * .075 * H, -.05 * H, D.SH.z - .02 * H)), Vector((s * .085 * H, -.07 * H, lerp(D.HIP.z, D.SH.z, .55))), Vector((s * .08 * H, -.02 * H, lerp(D.HIP.z, D.SH.z, .3)))]
            Q = []
            for p in P:
                hit = bvb.ray_cast(Vector((0, 0, p.z)), Vector((p.x, p.y, 0)).normalized(), .5); Q.append((hit[0] + Vector((p.x, p.y, 0)).normalized() * .006 * k) if hit[0] and p.z < D.SH.z else p)
            o = loft('Riemen', Q, lambda t: .011 * k, lambda t: .003 * k, ring=4, n=12, cap0=False); set_region(o, 'leder'); out.append(o)
    if 'kapuze' in ex:
        pts = []
        for j in range(13):
            a = -math.pi / 2 + .6 + j / 12 * (2 * math.pi - 1.2); dv = Vector((math.cos(a), math.sin(a), 0))
            hit = bvb.ray_cast(Vector((0, D.NECK0.y, D.NECK0.z - .005 * H)), dv, .25); pts.append((hit[0] if hit[0] else Vector((0, 0, D.NECK0.z))) + dv * .012 * k + Vector((0, 0, .004 * k)))
        o = loft('Kapuze', pts, lambda t: .022 * k * (.6 + .4 * math.sin(t * math.pi)), lambda t: .012 * k * (.5 + .5 * math.sin(t * math.pi)), ring=5, n=14, cap0=True, cap1=True, flat_up=(0, .5, 1)); set_region(o, 'top'); out.append(o)
    if K.get('muetze') == 'schirm':
        hl = 1.35; U_, V_ = 6, 26; CV = []; CF = []
        for i in range(U_ + 1):
            for j in range(V_):
                ph = j / V_ * 2 * math.pi; th = hl * (i / U_) ** .85; CV.append(head_dir_point(sdir(th, ph), .02 * k + .012 * k * (1 - (i / U_) ** 2)))
        for i in range(U_):
            for j in range(V_): j1 = (j + 1) % V_; CF.append((i * V_ + j, i * V_ + j1, (i + 1) * V_ + j1, (i + 1) * V_ + j))
        o = obj_data('Muetze', CV, CF); smooth(o); set_region(o, 'muetze'); solidify(o, .004 * k, 1); out.append(o)
        rim = [head_dir_point(sdir(hl, ph), .022 * k) for ph in [(-1 + j / 10 * 2) * .95 for j in range(11)]]
        rings = [rim, [p + Vector((0, -.05 * k, -.012 * k)) * (1 - .55 * abs(j / 10 * 2 - 1) ** 2) for j, p in enumerate(rim)]]
        o = loft_rings('Schirm', rings, 'muetze', closed=False); solidify(o, .004 * k, 1); out.append(o)
    if K.get('muetze') == 'beanie':
        hl = 1.42; U_, V_ = 7, 26; CV = []; CF = []
        for i in range(U_ + 1):
            for j in range(V_):
                ph = j / V_ * 2 * math.pi; th = hl * (i / U_) ** .9; CV.append(head_dir_point(sdir(th, ph), .022 * k + .03 * k * (1 - (i / U_)) ** 1.5 + .004 * k * math.sin(ph * 14) * ss(.6, 1, i / U_)))
        for i in range(U_):
            for j in range(V_): j1 = (j + 1) % V_; CF.append((i * V_ + j, i * V_ + j1, (i + 1) * V_ + j1, (i + 1) * V_ + j))
        o = obj_data('Muetze', CV, CF); smooth(o); set_region(o, 'muetze'); out.append(o)
    return out

def join_all(parts):
    hp = parts['hp']; flat = lambda L: [x for x in L if x is not None]
    body_objs = [parts['body'], hp['head']] + hp['ears'] + parts['extra'] + parts['shoes'] + parts['hair'] + parts['acc']
    BODY = join(flat(body_objs), 'Koerper'); FACE = join(hp['lids'] + hp['brows'] + hp['mouth'], 'Gesicht'); EYE = join(hp['eyes'], 'Augen')
    for o in (BODY, FACE, EYE): smooth(o)
    return BODY, FACE, EYE

def cull_hidden(BODY, region_names, dist=.06, dirs_fn=None):
    """Flächen der Haut/des Körpers entfernen, die vollständig von Haaren/Kleidung verdeckt sind (Dreiecke sparen)"""
    bvc = BVHTree.FromObject(BODY, bpy.context.evaluated_depsgraph_get())
    bm = bmesh.new(); bm.from_mesh(BODY.data); bm.faces.ensure_lookup_table(); mats = list(BODY.data.materials)
    ids = {i for i, m in enumerate(mats) if m.name in region_names}; kill = []
    for f in bm.faces:
        if f.material_index not in ids: continue
        c0 = f.calc_center_median() - D.HC
        if c0.z < -.15 * D.hh or (c0.y < -.35 * D.hd and c0.z < .45 * D.hh): continue   # Gesicht/Schläfen nie entfernen
        n = f.normal.normalized(); ok = True
        for p in [f.calc_center_median()] + [v.co for v in f.verts]:
            hit = bvc.ray_cast(p + n * .0008, n, dist)
            if not hit[0] or hit[2] is None: ok = False; break
        if ok: kill.append(f)
    bmesh.ops.delete(bm, geom=kill, context='FACES'); bm.to_mesh(BODY.data); bm.free(); return len(kill)

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    FID = args[0]; OUT = args[1] if len(args) > 1 else '/tmp/%s.glb' % FID; ONLY_FORM = '--form' in sys.argv
    reset(); random.seed(12); SPEC = SPECS[FID]; DIR = os.path.dirname(OUT) or '.'
    parts = assemble(SPEC)
    BODY, FACE, EYE = join_all(parts)
    nk = cull_hidden(BODY, {'haut_kopf'}, .05 * D.H / 1.45)
    log('verdeckt entfernt', nk)
    tb = SPEC.get('budget', 11800)
    if tris(BODY) > tb:   # Dreiecksbudget 8–14 k je Figur: Körper sanft reduzieren (Kollaps, Formen bleiben)
        dm = BODY.modifiers.new('Dez', 'DECIMATE'); dm.ratio = tb / tris(BODY); apply_mods(BODY); smooth(BODY)
    log('Dreiecke Körper', tris(BODY), 'Gesicht', tris(FACE), 'Augen', tris(EYE), 'gesamt', tris(BODY) + tris(FACE) + tris(EYE))
    if ONLY_FORM:
        H = D.H; hz = D.HC.z
        workbench(os.path.join(DIR, FID + '_form.png'), [BODY, FACE, EYE], [((0, -4.0 * H / 1.45, .55 * H), (0, 0, .5 * H), 55), ((2.6 * H / 1.45, -3.0 * H / 1.45, .65 * H), (0, 0, .5 * H), 55),
                  ((.12, -.62 * H / 1.45, hz + .01), (0, 0, hz - .01), 70), ((-.55 * H / 1.45, -.42 * H / 1.45, hz), (0, 0, hz - .02), 70), ((4.0 * H / 1.45, 0, .55 * H), (0, 0, .5 * H), 55)], (600, 800))
        sys.exit(0)
    exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fkit2.py')).read())
