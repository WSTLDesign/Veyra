# Veyra Modell-Baukasten (Blender 5.3 als Python-Modul) – gemeinsame Bausteine für Figuren und Terras.
# Koordinaten: Blender Z oben, vorn = −Y, linke Körperseite = +X. glTF-Export dreht nach Y oben, vorn = +Z.
# Ablauf je Modell: Formen bauen (Regionen = Materialien) → UV-Atlas → Backen (Region-ID, Position, Normale, AO) →
# Textur in numpy „malen“ (3D-Funktionen je Texel) → Höhenkarte → Normal-Bake → Rig + Gewichte → Shape Keys → Clips → GLB.
import bpy, bmesh, math, os, sys, json, time, random
import numpy as np
from mathutils import Vector, Matrix, Quaternion, Euler
from mathutils.kdtree import KDTree

T0 = time.time()
def log(*a): print('[%6.1fs]' % (time.time() - T0), *a, flush=True)
def reset(fps=30):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; sc.render.fps = fps; return sc
def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c)
def hexrgb(h):  # sRGB 0..1 (zum Malen in der Textur)
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32)
def ss(a, b, x):  # smoothstep, auch für numpy
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
def gauss(d2, s): return np.exp(-d2 / (2 * s * s))
def lerp(a, b, t): return a + (b - a) * t

# ---------------- Regionen (Materialien) ----------------
# mask = (Umrissbreite 0..1, Hautstreuung, Glanz, Leuchten) → Vertexfarbe COLOR_0 für den Toon-Shader
REG = {}
def region(name, col, mask=(1, 0, 0, 0)):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; b = m.node_tree.nodes.get('Principled BSDF'); b.inputs['Base Color'].default_value = (*srgb(col), 1)
    REG[name] = {'col': col, 'mask': mask, 'mat': m, 'id': len(REG)}; return m
def set_region(o, name):
    m = REG[name]['mat']
    if m.name not in o.data.materials: o.data.materials.append(m)
    idx = list(o.data.materials).index(m)
    for p in o.data.polygons: p.material_index = idx
    return o

# ---------------- Netz-Helfer ----------------
def link(o): bpy.context.collection.objects.link(o); return o
def obj_bm(name, bm):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); return link(bpy.data.objects.new(name, me))
def obj_data(name, verts, faces, edges=()):
    me = bpy.data.meshes.new(name); me.from_pydata([tuple(v) for v in verts], list(edges), [tuple(f) for f in faces]); me.update(); return link(bpy.data.objects.new(name, me))
def activate(o):
    for x in bpy.context.view_layer.objects: x.select_set(False)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
def mod(o, kind, **kw):
    m = o.modifiers.new(kind, kind)
    for k, v in kw.items(): setattr(m, k, v)
    return m
def apply_mods(o):
    activate(o)
    for m in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)
    return o
def smooth(o, on=True):
    for p in o.data.polygons: p.use_smooth = on
    return o
def subsurf(o, lv=1): mod(o, 'SUBSURF', levels=lv, render_levels=lv); return apply_mods(o)
def deform(o, fn):  # fn(Vector)->Vector, Weltkoordinaten = Objektkoordinaten (Objekte bleiben im Ursprung)
    for v in o.data.vertices: v.co = fn(v.co.copy())
    o.data.update(); return o
def orient_out(o, center):
    """Flächen so drehen, dass die Normalen von center weg zeigen (gespiegelte Teile)"""
    c = Vector(center); n_in = sum(1 for p in o.data.polygons if p.normal.dot(p.center - c) < 0)
    if n_in > len(o.data.polygons) / 2: o.data.flip_normals()
    return o
def join(objs, name):
    activate(objs[0])
    for o in objs: o.select_set(True)
    bpy.ops.object.join(); o = bpy.context.active_object; o.name = name; o.data.name = name; return o
def tris(o): return sum(len(p.vertices) - 2 for p in o.data.polygons)
def merge_close(o, d=1e-5):
    bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=d); bm.to_mesh(o.data); bm.free(); return o
def decimate(o, ratio):
    mod(o, 'DECIMATE', ratio=ratio); return apply_mods(o)

def skin_body(name, nodes, edges, radii, root=0, sub=1, branch_smooth=0.0):
    """Grundkörper aus einem Knotengraphen (Skin-Modifier → reine Quads) + Subdivision."""
    o = obj_data(name, nodes, [], edges)
    sk = mod(o, 'SKIN'); sk.branch_smoothing = branch_smooth; sk.use_smooth_shade = True
    for i, v in enumerate(o.data.skin_vertices[0].data):
        r = radii[i]; v.radius = (r, r) if isinstance(r, (int, float)) else tuple(r)
    o.data.skin_vertices[0].data[root].use_root = True
    if sub: mod(o, 'SUBSURF', levels=sub, render_levels=sub)
    apply_mods(o); return smooth(o)

def quad_sphere(name, cuts=10):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=2)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=cuts, use_grid_fill=True)
    for v in bm.verts: v.co = v.co.normalized()
    return obj_bm(name, bm)

def frames_along(P, up=Vector((0, 0, 1))):
    """Parallel-Transport-Rahmen entlang einer Punktliste → [(T, N, B)]"""
    out = []; n = len(P)
    T = [(P[min(i + 1, n - 1)] - P[max(i - 1, 0)]).normalized() for i in range(n)]
    N = up - T[0] * up.dot(T[0]);
    if N.length < 1e-6: N = Vector((1, 0, 0)) - T[0] * T[0].x
    N.normalize()
    for i in range(n):
        if i: N = (N - T[i] * N.dot(T[i])).normalized()
        out.append((T[i], N, T[i].cross(N)))
    return out
def bezier(pts, n):
    """Catmull-Rom durch Stützpunkte → n Punkte"""
    P = [Vector(p) for p in pts]; P = [P[0] * 2 - P[1]] + P + [P[-1] * 2 - P[-2]]; out = []
    segs = len(P) - 3
    for k in range(n):
        t = k / (n - 1) * segs; i = min(int(t), segs - 1); u = t - i
        p0, p1, p2, p3 = P[i], P[i + 1], P[i + 2], P[i + 3]
        out.append(.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u ** 3))
    return out
def loft(name, pts, wfn, dfn=None, ring=8, n=12, up=(0, 0, 1), cap0=True, cap1=False, twist=0.0, flat_up=None):
    """Röhre/Strähne entlang einer Kurve; wfn(t) Breite, dfn(t) Dicke (Ellipse), Spitze bei Breite 0."""
    P = bezier(pts, n); F = frames_along(P, Vector(up) if flat_up is None else Vector(flat_up)); V = []; Fc = []
    dfn = dfn or wfn
    for i, (p, (Tt, N, B)) in enumerate(zip(P, F)):
        t = i / (n - 1); w = max(wfn(t), 1e-5); d = max(dfn(t), 1e-5); a0 = twist * t
        for j in range(ring):
            a = j / ring * 2 * math.pi + a0; V.append(p + B * math.cos(a) * w + N * math.sin(a) * d)
    for i in range(n - 1):
        for j in range(ring):
            j1 = (j + 1) % ring; Fc.append((i * ring + j, i * ring + j1, (i + 1) * ring + j1, (i + 1) * ring + j))
    # Wicklung nach außen (Normalen weg von der Mittellinie)
    k = min(1, n - 2); a_, b_, c_ = V[k * ring], V[k * ring + 1], V[(k + 1) * ring + 1]
    if ((b_ - a_).cross(c_ - a_)).dot((a_ + b_) / 2 - P[k]) < 0: Fc = [tuple(reversed(f)) for f in Fc]; flip = True
    else: flip = False
    if cap0: V.append(P[0] - F[0][0] * min(wfn(0), dfn(0)) * .4); c = len(V) - 1; Fc += [((c, j, (j + 1) % ring) if flip else (c, (j + 1) % ring, j)) for j in range(ring)]
    if cap1: V.append(P[-1]); c = len(V) - 1; b = (n - 1) * ring; Fc += [((c, b + (j + 1) % ring, b + j) if flip else (c, b + j, b + (j + 1) % ring)) for j in range(ring)]
    return smooth(obj_data(name, V, Fc))

def blob(name, center, radii, cuts=4, fn=None, rot=(0, 0, 0)):
    o = quad_sphere(name, cuts); R = Euler(rot).to_matrix()
    def f(v):
        q = Vector((v.x * radii[0], v.y * radii[1], v.z * radii[2]))
        if fn: q = fn(v, q)
        return R @ q + Vector(center)
    return smooth(deform(o, f))

# ---------------- Masken als Vertexfarbe (Ecken) ----------------
def write_masks(o):
    me = o.data
    if 'Maske' in me.color_attributes: me.color_attributes.remove(me.color_attributes['Maske'])
    ca = me.color_attributes.new('Maske', 'BYTE_COLOR', 'CORNER'); me.color_attributes.active_color = ca
    mats = list(me.materials); cols = np.zeros((len(me.loops), 4), np.float32)
    for p in me.polygons:
        r = REG.get(mats[p.material_index].name) if mats else None
        mk = r['mask'] if r else (1, 0, 0, 0)
        for li in p.loop_indices: cols[li] = mk
    ca.data.foreach_set('color', cols.ravel())

# ---------------- Gesichts-Pseudonormalen (Ellipsoid-Mischung) ----------------
def ellipsoid_normals(o, center, radii, wfn):
    """Normalen in Richtung eines Ellipsoids mischen (weiche, ruhige Gesichtsschattierung). wfn(co)->0..1"""
    me = o.data; c = Vector(center); r2 = Vector([1 / (x * x) for x in radii]); out = []
    try: base = [Vector(l.normal) for l in me.corner_normals]
    except Exception: base = [Vector(me.vertices[l.vertex_index].normal) for l in me.loops]
    for li, l in enumerate(me.loops):
        p = me.vertices[l.vertex_index].co; e = Vector(((p.x - c.x) * r2.x, (p.y - c.y) * r2.y, (p.z - c.z) * r2.z)).normalized()
        w = wfn(p); out.append(tuple((base[li] * (1 - w) + e * w).normalized()))
    me.normals_split_custom_set(out)

# ---------------- UV-Atlas ----------------
def uv_atlas(objs, island_scale=None, margin=.004, angle=58):
    """Smart-UV über mehrere Objekte in einen gemeinsamen Atlas; island_scale(obj, face_center)->Faktor (z. B. Gesicht ×2)."""
    for o in objs:
        if not o.data.uv_layers: o.data.uv_layers.new(name='UVMap')
    activate(objs[0])
    for o in objs: o.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(angle), island_margin=margin, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    if island_scale:
        for o in objs:
            me = o.data; uv = me.uv_layers.active.data
            bm = bmesh.new(); bm.from_mesh(me); bm.faces.ensure_lookup_table(); lay = bm.loops.layers.uv.active
            # Inseln finden (über UV-Verbindungen) und je Insel skalieren
            seen = set()
            for f in bm.faces:
                if f.index in seen: continue
                stack = [f]; isl = []; seen.add(f.index)
                while stack:
                    g = stack.pop(); isl.append(g)
                    for e in g.edges:
                        if e.seam: continue
                        for h in e.link_faces:
                            if h.index in seen: continue
                            # gleiche UV an beiden Enden der Kante?
                            ok = True
                            for v in e.verts:
                                a = [l[lay].uv for l in g.loops if l.vert == v][0]; b = [l[lay].uv for l in h.loops if l.vert == v][0]
                                if (a - b).length > 1e-5: ok = False
                            if ok: seen.add(h.index); stack.append(h)
                k = sum(island_scale(o, g.calc_center_median()) for g in isl) / len(isl)
                if abs(k - 1) < 1e-3: continue
                cs = [l[lay].uv.copy() for g in isl for l in g.loops]; c = sum(cs, Vector((0, 0))) / len(cs)
                for g in isl:
                    for l in g.loops: l[lay].uv = c + (l[lay].uv - c) * k
            bm.to_mesh(me); bm.free()
        activate(objs[0])
        for o in objs: o.select_set(True)
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.pack_islands(rotate=True, margin=margin)
        bpy.ops.object.mode_set(mode='OBJECT')

# ---------------- Backen (Cycles CPU) ----------------
def cycles(samples=16):
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = samples
    sc.render.bake.margin = 6; sc.render.bake.use_clear = True; return sc
def new_img(name, S, float_=False, alpha=False):
    im = bpy.data.images.get(name)
    if im: bpy.data.images.remove(im)
    return bpy.data.images.new(name, S, S, alpha=alpha, float_buffer=float_)
def _bake_target(objs, img):
    nodes = []
    for o in objs:
        for m in o.data.materials:
            nt = m.node_tree; n = nt.nodes.new('ShaderNodeTexImage'); n.image = img; nt.nodes.active = n; n.select = True; nodes.append((nt, n))
    return nodes
def _bake_clean(nodes):
    for nt, n in nodes: nt.nodes.remove(n)
def bake(objs, kind, S, samples=16, float_=True, space='TANGENT', setup=None, restore=None):
    """kind: EMIT | AO | NORMAL | DIFFUSE → numpy (S,S,4) – Zeile 0 = unten (Blender)."""
    sc = cycles(samples); img = new_img('bake_' + kind, S, float_)
    if setup: setup()
    nodes = _bake_target(objs, img)
    activate(objs[0])
    for o in objs: o.select_set(True)
    kw = {}
    if kind == 'NORMAL': kw = dict(normal_space=space)
    if kind == 'DIFFUSE': kw = dict(pass_filter={'COLOR'})
    t = time.time(); bpy.ops.object.bake(type=kind, margin=6, use_clear=True, **kw); log('Backen', kind, S, '%.1fs' % (time.time() - t))
    _bake_clean(nodes)
    if restore: restore()
    a = np.array(img.pixels[:], np.float32).reshape(S, S, 4); return a
def emit_setup(objs, kind):
    """Materialien vorübergehend auf Emission umstellen: 'id' (Regionsfarbe) oder 'pos' (Objektposition)."""
    saved = []
    for o in objs:
        for m in o.data.materials:
            nt = m.node_tree; out = nt.nodes.get('Material Output'); old = out.inputs['Surface'].links[0].from_socket if out.inputs['Surface'].links else None
            em = nt.nodes.new('ShaderNodeEmission')
            if kind == 'pos':
                g = nt.nodes.new('ShaderNodeNewGeometry'); nt.links.new(g.outputs['Position'], em.inputs['Color'])
            else:
                r = REG.get(m.name); i = r['id'] if r else 255; em.inputs['Color'].default_value = ((i + 1.5) / 256, 0, 0, 1)
            nt.links.new(em.outputs['Emission'], out.inputs['Surface']); saved.append((nt, out, old, em))
    def restore():
        for nt, out, old, em in saved:
            if old: nt.links.new(old, out.inputs['Surface'])
            nt.nodes.remove(em)
    return restore
def bake_emit(objs, kind, S):
    r = emit_setup(objs, kind)
    try: return bake(objs, 'EMIT', S, samples=1)
    finally: r()
def dilate(a, mask, it=8):
    """Farbe über die Insel-Ränder ausdehnen (gegen Nahtblitzer bei Mipmaps)."""
    a = a.copy(); m = mask.copy()
    for _ in range(it):
        acc = np.zeros_like(a); cnt = np.zeros(m.shape, np.float32)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            sh = np.roll(np.roll(a, dy, 0), dx, 1); sm = np.roll(np.roll(m, dy, 0), dx, 1)
            acc += sh * sm[..., None]; cnt += sm
        grow = (~m) & (cnt > 0); a[grow] = acc[grow] / cnt[grow][:, None]; m = m | grow
    return a
def save_png(arr, path, alpha=False):
    """arr (S,S,3|4) sRGB 0..1, Zeile 0 = unten → PNG über Blender-Bild"""
    Hh, Ww = arr.shape[:2]; im = bpy.data.images.new(os.path.basename(path), Ww, Hh, alpha=True)
    im.colorspace_settings.name = 'Non-Color'   # Werte unverändert schreiben (sRGB-Werte liegen schon vor)
    rgba = np.ones((Hh, Ww, 4), np.float32); rgba[..., :min(4, arr.shape[2])] = arr[..., :4]
    im.pixels = rgba.ravel(); im.filepath_raw = path; im.file_format = 'PNG'; im.save(); bpy.data.images.remove(im); return path
def to_image(arr, name, colorspace='sRGB'):
    """numpy (Zeile 0 = unten) → PNG-Datei → geladenes, gepacktes Blender-Bild (erzeugte Bilder verlieren sonst beim Export die Pixel)"""
    import tempfile
    im = bpy.data.images.get(name)
    if im: bpy.data.images.remove(im)
    path = os.path.join(tempfile.gettempdir(), 'veyra_' + name + '.png'); save_png(arr, path)
    im = bpy.data.images.load(path); im.name = name; im.colorspace_settings.name = colorspace; im.pack(); return im
def height_to_normal_bake(objs, height, S, strength=1.0):
    """Höhenkarte (numpy, UV-Raum) als Bump in alle Materialien → Tangenten-Normal backen (korrekt für jede UV-Lage)."""
    him = to_image(np.repeat(height[..., None], 3, 2), 'hoehe', 'Non-Color'); saved = []
    for o in objs:
        for m in o.data.materials:
            nt = m.node_tree; b = nt.nodes.get('Principled BSDF')
            if not b: continue
            t = nt.nodes.new('ShaderNodeTexImage'); t.image = him; t.interpolation = 'Cubic'
            bu = nt.nodes.new('ShaderNodeBump'); bu.inputs['Strength'].default_value = strength; bu.inputs['Distance'].default_value = .02
            nt.links.new(t.outputs['Color'], bu.inputs['Height']); nt.links.new(bu.outputs['Normal'], b.inputs['Normal']); saved.append((nt, t, bu))
    try: return bake(objs, 'NORMAL', S, samples=1)
    finally:
        for nt, t, bu in saved: nt.nodes.remove(t); nt.nodes.remove(bu)

def final_material(name, albedo_img, normal_img=None):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Roughness'].default_value = .7
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = albedo_img; nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    if normal_img:
        n = nt.nodes.new('ShaderNodeTexImage'); n.image = normal_img; nm = nt.nodes.new('ShaderNodeNormalMap')
        nt.links.new(n.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    return m
def swap_materials(o, mat, keep=()):
    """Alle Regionen außer keep → mat (Flächen-Indizes neu ordnen)."""
    me = o.data; old = list(me.materials); new = [mat] + [m for m in old if m and m.name in keep]
    idx = [0 if (m is None or m.name not in keep) else new.index(m) for m in old]
    pidx = [idx[p.material_index] for p in me.polygons]
    me.materials.clear()
    for m in new: me.materials.append(m)
    for p, i in zip(me.polygons, pidx): p.material_index = i

# ---------------- Rig ----------------
def armature(name, bones):
    """bones: [(name, head, tail, parent, roll)] → Armature-Objekt"""
    ad = bpy.data.armatures.new(name); ao = link(bpy.data.objects.new(name, ad)); activate(ao)
    bpy.ops.object.mode_set(mode='EDIT')
    for nm, h, t, par, *rest in bones:
        b = ad.edit_bones.new(nm); b.head = h; b.tail = t; b.roll = rest[0] if rest else 0
        if par: b.parent = ad.edit_bones[par]; b.use_connect = False
    bpy.ops.object.mode_set(mode='OBJECT'); return ao
def seg_dist(p, a, b):
    ab = b - a; t = max(0, min(1, (p - a).dot(ab) / max(ab.length_squared, 1e-12))); return (p - (a + ab * t)).length, t
def weights_capsule(o, ao, allowed, fall=4.0, maxn=4, fixed=None, smooth_it=2):
    """Gewichte aus Abstand zu Knochen-Segmenten. allowed(co, poly_region)->[Knochen] ; fixed(co)->{knochen:w}|None"""
    me = o.data; A = ao.data.bones; seg = {b.name: (b.head_local.copy(), b.tail_local.copy()) for b in A}
    vreg = {}
    mats = list(me.materials)
    for p in me.polygons:
        for vi in p.vertices: vreg.setdefault(vi, mats[p.material_index].name if mats else '')
    W = []
    for v in me.vertices:
        fx = fixed(v.co, vreg.get(v.index, '')) if fixed else None
        if fx: W.append(fx); continue
        cand = allowed(v.co, vreg.get(v.index, '')); ds = []
        for n in cand:
            d, t = seg_dist(v.co, *seg[n]); ds.append((d, n))
        dmin = min(d for d, n in ds); w = {n: (dmin + .004) ** fall / (d + .004) ** fall for d, n in ds}
        W.append(w)
    # glätten über Kanten (weiche Gelenke)
    nb = [[] for _ in me.vertices]
    for e in me.edges: a, b = e.vertices; nb[a].append(b); nb[b].append(a)
    for _ in range(smooth_it):
        W2 = []
        for i, w in enumerate(W):
            acc = dict((k, v * 2) for k, v in w.items()); n = 2
            for j in nb[i]:
                for k, v in W[j].items(): acc[k] = acc.get(k, 0) + v
                n += 1
            W2.append({k: v / n for k, v in acc.items()})
        W = W2
    for b in A:
        if b.name not in o.vertex_groups: o.vertex_groups.new(name=b.name)
    for i, w in enumerate(W):
        top = sorted(w.items(), key=lambda x: -x[1])[:maxn]; s = sum(x for _, x in top) or 1
        for n, x in top:
            if x / s > .01: o.vertex_groups[n].add([i], x / s, 'REPLACE')
def bind(o, ao):
    o.parent = ao; m = o.modifiers.new('Armature', 'ARMATURE'); m.object = ao; return o

# Posen: Delta-Drehungen E in Armature-Achsen (Ruhelage) → lokale Quaternion Q = A⁻¹·E·A (unabhängig vom Elternknochen)
def qdelta(ao, bone, E):
    A = ao.data.bones[bone].matrix_local.to_quaternion(); return A.inverted() @ E @ A
def rx(a): return Quaternion((1, 0, 0), a)
def ry(a): return Quaternion((0, 1, 0), a)
def rz(a): return Quaternion((0, 0, 1), a)
def qmul(*qs):
    q = Quaternion()
    for x in qs: q = q @ x
    return q
def make_action(ao, name, frames, posefn, loop=True):
    """posefn(t∈[0,1)) -> {knochen: Quaternion(Delta) | ('loc', Vector)}; Schlüssel je Bild, Schleife sauber."""
    act = bpy.data.actions.new(name); ao.animation_data_create(); ao.animation_data.action = act
    for pb in ao.pose.bones: pb.rotation_mode = 'QUATERNION'
    n = frames + (1 if loop else 0)
    for f in range(n):
        t = (f % frames) / frames if loop else f / max(1, frames - 1)
        P = posefn(t)
        for pb in ao.pose.bones:
            pb.rotation_quaternion = Quaternion(); pb.location = Vector()
        for k, v in P.items():
            if k.endswith(':loc'):
                b = k[:-4]; pb = ao.pose.bones[b]; A = ao.data.bones[b].matrix_local.to_3x3(); pb.location = A.inverted() @ Vector(v)
            else: ao.pose.bones[k].rotation_quaternion = qdelta(ao, k, v)
        for pb in ao.pose.bones:
            pb.keyframe_insert('rotation_quaternion', frame=f + 1); pb.keyframe_insert('location', frame=f + 1)
    act.use_fake_user = True
    tr = ao.animation_data.nla_tracks.new(); tr.name = name; tr.strips.new(name, 1, act)
    ao.animation_data.action = None; return act
def rest_pose(ao):
    for pb in ao.pose.bones: pb.rotation_quaternion = Quaternion(); pb.location = Vector()

# ---------------- Shape Keys ----------------
def shape_key(o, name, fn):
    """fn(index, co, region) -> neue Position | None"""
    if not o.data.shape_keys: o.shape_key_add(name='Basis')
    k = o.shape_key_add(name=name, from_mix=False); me = o.data; mats = list(me.materials); vreg = {}
    for p in me.polygons:
        for vi in p.vertices: vreg.setdefault(vi, mats[p.material_index].name if mats else '')
    for v in me.vertices:
        r = fn(v.index, v.co.copy(), vreg.get(v.index, ''))
        if r is not None: k.data[v.index].co = r
    return k

# ---------------- Export ----------------
def export_glb(path, objs, ao):
    for x in bpy.context.view_layer.objects: x.select_set(False)
    for o in objs + [ao]: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=False, export_animations=True,
                              export_animation_mode='NLA_TRACKS', export_force_sampling=True, export_frame_step=1, export_try_sparse_sk=False,
                              export_morph=True, export_morph_normal=False, export_skins=True, export_def_bones=True, export_vertex_color='ACTIVE',
                              export_all_vertex_colors=False, export_image_format='WEBP', export_image_quality=88, export_texcoords=True, export_normals=True,
                              export_tangents=False, export_yup=True, export_extras=False, export_optimize_animation_size=True)
    log('GLB', path, os.path.getsize(path), 'B')

def workbench(path, objs, cams, size=(800, 800)):
    """Schnelles Kontrollbild (Workbench, Materialfarben) – cams: [(loc, look_at, lens)] nebeneinander"""
    sc = bpy.context.scene; sc.render.engine = 'BLENDER_WORKBENCH'; sc.render.resolution_x, sc.render.resolution_y = size
    sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'MATERIAL'; sc.display.shading.show_cavity = False
    sc.display.shading.show_object_outline = True
    cam = bpy.data.objects.get('KCam') or link(bpy.data.objects.new('KCam', bpy.data.cameras.new('KCam'))); sc.camera = cam
    outs = []
    for i, (loc, at, lens) in enumerate(cams):
        cam.location = loc; d = Vector(at) - Vector(loc); cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = lens
        p = path.replace('.png', '_%d.png' % i); sc.render.filepath = p; bpy.ops.render.render(write_still=True); outs.append(p)
    return outs
