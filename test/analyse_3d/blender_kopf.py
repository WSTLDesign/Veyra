# Machbarkeitsprobe Blender (bpy als Python-Modul): stilisierter Kopf als Subdivision-Mesh
# mit Augenhöhlen, Nase, Mund-Furche, Ohren, Lidern, Haarsträhnen aus Kurven, Morph-Zielen.
# Aufruf: <venv>/bin/python test/analyse_3d/blender_kopf.py <ausgabeordner>
# Eigene Testfigur, kein Bezug zu fremden Designs.
import bpy, bmesh, math, sys, os, time, json
import numpy as np
from mathutils import Vector

OUT = sys.argv[-1] if len(sys.argv) > 1 and not sys.argv[-1].endswith('.py') else '.'
os.makedirs(OUT, exist_ok=True)
t0 = time.time()
bpy.ops.wm.read_factory_settings(use_empty=True)

def gs(a, b, x):  # smoothstep
    t = min(1, max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
def gauss(d2, s): return math.exp(-d2 / (2 * s * s))

def mat(name, col, rough=.6, tex=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough
    if tex is not None:
        n = m.node_tree.nodes.new('ShaderNodeTexImage'); n.image = tex; m.node_tree.links.new(n.outputs['Color'], b.inputs['Base Color'])
    return m
def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c)

M_SKIN = mat('Haut', srgb('#f1c9a5'), .55)
M_HAIR = mat('Haar', srgb('#5a3a24'), .4)
M_LID = mat('Lid', srgb('#2b1f22'), .5)
M_MOUTH = mat('Mund', srgb('#b45a52'), .5)
# Augentextur 256 px: UV-Kugel mit Pol nach vorn → oben im Bild = vorn (Iris/Pupille/Glanz)
S = 256; img = bpy.data.images.new('Auge', S, S, alpha=False); px = np.ones((S, S, 4), np.float32)
v = np.linspace(0, 1, S)[:, None].repeat(S, 1)
iris = np.array(srgb('#3a7ab8')); dark = np.array(srgb('#1d3a66')); white = np.array(srgb('#fbfaf6'))
col = np.where((v > .80)[..., None], iris * (1 - .45 * ((v - .80) / .2))[..., None] + dark * (.45 * ((v - .80) / .2))[..., None], white)
col = np.where((v > .80)[..., None] & (v < .815)[..., None], dark, col)  # Irisrand
col = np.where((v > .91)[..., None], np.array(srgb('#151018')), col)  # Pupille
px[..., :3] = col; img.pixels = px.ravel(); img.pack()
M_EYE = mat('Auge', (1, 1, 1), .15, img)

def new_obj(name, bm):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o); return o
def add_mod(o, kind, **kw):
    m = o.modifiers.new(kind, kind)
    for k, val in kw.items(): setattr(m, k, val)
    return m
def apply_all(o):
    bpy.context.view_layer.objects.active = o
    for m in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)
def shade_smooth(o):
    for p in o.data.polygons: p.use_smooth = True

# ---------- Kopf: Quad-Kugel (Würfel unterteilt, auf Kugel projiziert) ----------
bm = bmesh.new(); bmesh.ops.create_cube(bm, size=2)
bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=13, use_grid_fill=True)
FRONT = -1  # vorn = −Y (Blender), glTF-Export dreht nach +Z
for vt in bm.verts:
    p = vt.co.normalized(); x, y, z = p.x, p.y, p.z
    fz = -y  # >0 vorn
    # Schädelform: schmaler, Hinterkopf, Kiefer zum Kinn verjüngt
    jaw = gs(-.05, -.95, z)
    X = x * .74 * (1 - .28 * jaw); Y = y * .86; Z = z * 1.0
    if fz > 0: Y -= .06 * fz * (1 - jaw)          # Gesicht etwas flacher-breiter
    else: Y *= 1 + .12 * gs(-.2, .6, z)            # Hinterkopf
    if z < -.55: Y += .10 * gs(-.55, -1, z) * gs(.1, .9, -fz)  # Kinn nach vorn
    # Augenhöhlen
    for s in (-1, 1):
        d2 = (x - s * .36) ** 2 + ((z - .08) * 1.25) ** 2
        Y += .05 * gauss(d2, .15) * gs(.3, .8, fz)
        d2b = (x - s * .34) ** 2 + ((z - .30) * 2.2) ** 2  # Brauenwulst
        Y -= .035 * gauss(d2b, .16) * gs(.3, .8, fz)
        d2c = (x - s * .42) ** 2 + ((z + .25) * 1.2) ** 2  # Wangen
        Y -= .045 * gauss(d2c, .2) * gs(.2, .7, fz); X += s * .02 * gauss(d2c, .2)
    # Nase: Rücken + Spitze + Flügel
    dn = (x / .07) ** 2 + ((z + .02) / .24) ** 2
    Y -= .11 * math.exp(-dn) * gs(.6, .95, fz) * gs(.25, -.25, z)
    dt = (x / .09) ** 2 + ((z + .2) / .07) ** 2
    Y -= .10 * math.exp(-dt) * gs(.6, .95, fz)
    # Mund-Furche + Lippen
    dm = (x / .2) ** 2 + ((z + .36) / .022) ** 2
    Y += .03 * math.exp(-dm) * gs(.6, .95, fz)
    dl = (x / .17) ** 2 + ((z + .41) / .04) ** 2
    Y -= .02 * math.exp(-dl) * gs(.6, .95, fz)
    vt.co = Vector((X, Y, Z))
head = new_obj('Kopf', bm)
for p in head.data.polygons: p.material_index = 0
head.data.materials.append(M_SKIN)
# Gruppe für Morph-Ziel „Lächeln“ (Mundwinkel)
vg = head.vertex_groups.new(name='mund')
for vt in head.data.vertices:
    x, y, z = vt.co
    w = gs(.06, .18, abs(x)) * (1 - gs(.24, .32, abs(x))) * math.exp(-((z + .38) / .08) ** 2) * (1 if y < -.5 else 0)
    if w > .01: vg.add([vt.index], w, 'REPLACE')
add_mod(head, 'SUBSURF', levels=1, render_levels=1); apply_all(head); shade_smooth(head)

# Hals
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=.32, depth=.6, location=(0, .06, -1.05))
neck = bpy.context.active_object; neck.data.materials.append(M_SKIN); shade_smooth(neck)
add_mod(neck, 'SUBSURF', levels=1); apply_all(neck)

# ---------- Augen (Augapfel mit Textur, Glanzpunkt, Oberlid) ----------
eyes = []
for s in (-1, 1):
    ex, ez = s * .34, .07
    # Oberfläche vor der Höhle ungefähr: y ≈ −.80
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=.15, location=(ex, -.745, ez), rotation=(math.pi / 2, 0, 0))
    e = bpy.context.active_object; e.scale = (1, 1, .6); e.rotation_euler = (math.radians(-90), 0, s * math.radians(-12))
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    e.data.materials.append(M_EYE); shade_smooth(e); eyes.append(e)
    # Glanzpunkt
    bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=6, radius=.018, location=(ex - s * .035, -.835, ez + .045))
    g = bpy.context.active_object; g.data.materials.append(mat('Glanz', (1, 1, 1), .1)); eyes.append(g)
    # Oberlid: Kugelschale, untere Hälfte entfernt, verdickt
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=14, radius=.163)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.calc_center_median().z < .02 or f.calc_center_median().y > .02], context='FACES')
    lid = new_obj('Lid', bm); lid.location = (ex, -.745, ez); lid.scale = (1, .62, 1); lid.rotation_euler = (math.radians(-8), 0, s * math.radians(-12))
    lid.data.materials.append(M_LID); add_mod(lid, 'SOLIDIFY', thickness=.012); add_mod(lid, 'SUBSURF', levels=1)
    bpy.context.view_layer.objects.active = lid; bpy.ops.object.transform_apply(location=False, rotation=True, scale=True); apply_all(lid); shade_smooth(lid)
    lg = lid.vertex_groups.new(name='lid'); lg.add(list(range(len(lid.data.vertices))), 1, 'REPLACE')
    eyes.append(lid)
    # Braue
    bpy.ops.mesh.primitive_cube_add(size=1, location=(s * .33, -.80, .30))
    b = bpy.context.active_object; b.scale = (.17, .03, .025); b.rotation_euler = (0, s * math.radians(8), 0)
    add_mod(b, 'BEVEL', width=.4, segments=2); add_mod(b, 'SUBSURF', levels=1)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True); apply_all(b); shade_smooth(b); b.data.materials.append(M_HAIR); eyes.append(b)

# ---------- Ohren ----------
for s in (-1, 1):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=1)
    for vt in bm.verts:
        x, y, z = vt.co
        cup = .5 * math.exp(-((y * 1.2) ** 2 + (z * .9) ** 2) * 2) if x * s > 0 else 0  # Mulde außen
        vt.co = Vector((x * .06 * (1 - cup), y * .1, z * .2))
    ear = new_obj('Ohr', bm); ear.location = (s * .73, .05, -.02); ear.rotation_euler = (0, 0, s * math.radians(-18))
    ear.data.materials.append(M_SKIN); add_mod(ear, 'SUBSURF', levels=1)
    bpy.context.view_layer.objects.active = ear; bpy.ops.object.transform_apply(location=True, rotation=True, scale=True); apply_all(ear); shade_smooth(ear); eyes.append(ear)

# ---------- Haar: Kappe + Strähnen aus Kurven mit Verjüngung ----------
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=20, radius=1)
kill = []
for f in bm.faces:
    c = f.calc_center_median(); fz = -c.y
    lim = .30 if fz > .5 else (-.05 if abs(c.x) > .5 and fz > -.2 else -.35)
    if c.z < lim: kill.append(f)
bmesh.ops.delete(bm, geom=kill, context='FACES')
for vt in bm.verts:
    x, y, z = vt.co; jaw = 0
    vt.co = Vector((x * .79, y * .93 * (1 + .1 * gs(-.2, .6, z) if y > 0 else 1) - (.0 if y > 0 else .0), z * 1.05 + .02))
capo = new_obj('Haarkappe', bm); capo.data.materials.append(M_HAIR)
add_mod(capo, 'SOLIDIFY', thickness=.03, offset=1); apply_all(capo); shade_smooth(capo); eyes.append(capo)
strands = []
import random; random.seed(7)
def strand(p0, d, L, r0, bend):
    cu = bpy.data.curves.new('s', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = r0; cu.bevel_resolution = 1; cu.resolution_u = 5; cu.use_fill_caps = True
    sp = cu.splines.new('BEZIER'); sp.bezier_points.add(2)
    pts = [Vector(p0), Vector(p0) + Vector(d) * L * .5 + Vector(bend) * .5, Vector(p0) + Vector(d) * L + Vector(bend)]
    for i, bp in enumerate(sp.bezier_points):
        bp.co = pts[i]; bp.handle_left_type = bp.handle_right_type = 'AUTO'; bp.radius = [1, .7, .05][i]
    o = bpy.data.objects.new('Straehne', cu); bpy.context.collection.objects.link(o); return o
# Pony nach vorn/unten, seitlich, Wirbel oben
for i in range(11):
    a = (i - 5) / 5
    strands.append(strand((a * .45, -.72 + abs(a) * .12, .62 - abs(a) * .08), (a * .2, -.25, -.9), .42 - abs(a) * .1, .095, (a * .05 + random.uniform(-.03, .03), -.06, .02)))
for s in (-1, 1):
    for i in range(4):
        strands.append(strand((s * .72, -.2 + i * .2, .45 - i * .05), (s * .25, .1, -1), .45, .07, (s * .05, .05 * i, 0)))
for i in range(5):
    a = i / 5 * 2 * math.pi
    strands.append(strand((math.sin(a) * .1, .15 + math.cos(a) * .1, 1.0), (math.sin(a), math.cos(a) + .6, .6), .35, .06, (0, .08, .05)))
for o in strands:
    bpy.context.view_layer.objects.active = o; o.select_set(True)
bpy.ops.object.select_all(action='DESELECT')
for o in strands: o.select_set(True)
bpy.context.view_layer.objects.active = strands[0]; bpy.ops.object.convert(target='MESH')
for o in strands: o.data.materials.clear(); o.data.materials.append(M_HAIR); shade_smooth(o)

# ---------- Mund (Lippenspalt) ----------
bpy.ops.mesh.primitive_torus_add(major_radius=.12, minor_radius=.012, major_segments=24, minor_segments=6, location=(0, -.87, -.36), rotation=(math.pi / 2, 0, 0))
mo = bpy.context.active_object; mo.scale = (1, .25, 1)
bm = bmesh.new(); bm.from_mesh(mo.data); bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.calc_center_median().z > -.0], context='FACES'); bm.to_mesh(mo.data); bm.free()
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True); mo.data.materials.append(M_MOUTH); shade_smooth(mo)
mg = mo.vertex_groups.new(name='mund'); mg.add(list(range(len(mo.data.vertices))), 1, 'REPLACE')

# ---------- Zusammenfügen + Morph-Ziele ----------
bpy.ops.object.select_all(action='DESELECT')
allp = [head, neck, mo] + eyes + strands
for o in allp: o.select_set(True)
bpy.context.view_layer.objects.active = head; bpy.ops.object.join()
H = bpy.context.active_object; H.name = 'Testkopf'
H.shape_key_add(name='Basis')
k1 = H.shape_key_add(name='Laecheln', from_mix=False)
gi = H.vertex_groups['mund'].index
for vt in H.data.vertices:
    for g in vt.groups:
        if g.group == gi:
            co = vt.co; k1.data[vt.index].co = (co.x * (1 + .06 * g.weight), co.y, co.z + .045 * g.weight * min(1, abs(co.x) / .12))
k2 = H.shape_key_add(name='Augen_zu', from_mix=False)
li = H.vertex_groups['lid'].index
for vt in H.data.vertices:
    for g in vt.groups:
        if g.group == li:
            co = vt.co; cz = .07
            k2.data[vt.index].co = (co.x, co.y - .01, cz + (co.z - cz) * -0.9)  # Lid nach unten klappen
# Skalierung: 1 Einheit ≈ halbe Kopfhöhe → für three.js egal (Test normiert)
tris = sum(len(p.vertices) - 2 for p in H.data.polygons)
info = {'blender': bpy.app.version_string, 'verts': len(H.data.vertices), 'faces': len(H.data.polygons), 'tris': tris,
        'materials': [m.name for m in H.data.materials], 'shape_keys': [k.name for k in H.data.shape_keys.key_blocks], 'build_s': round(time.time() - t0, 2)}
for draco in (False, True):
    fn = os.path.join(OUT, 'testkopf_draco.glb' if draco else 'testkopf.glb'); t1 = time.time()
    bpy.ops.export_scene.gltf(filepath=fn, export_format='GLB', export_apply=True, export_morph=True, export_morph_normal=True,
                              export_draco_mesh_compression_enable=draco, export_try_sparse_sk=False, export_draco_mesh_compression_level=6)
    info['draco' if draco else 'plain'] = {'bytes': os.path.getsize(fn), 'export_s': round(time.time() - t1, 2)}
# Kontrollbild aus Blender (Workbench, schnell)
sc = bpy.context.scene; sc.render.engine = 'BLENDER_WORKBENCH'; sc.render.resolution_x, sc.render.resolution_y = 800, 800
sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'MATERIAL'; sc.display.shading.show_cavity = True
cam = bpy.data.objects.new('Cam', bpy.data.cameras.new('Cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (1.6, -3.4, .4); cam.rotation_euler = (math.radians(86), 0, math.radians(25)); cam.data.lens = 60
sc.render.filepath = os.path.join(OUT, 'blender_workbench.png'); t1 = time.time(); bpy.ops.render.render(write_still=True); info['render_s'] = round(time.time() - t1, 2)
print('INFO ' + json.dumps(info))
