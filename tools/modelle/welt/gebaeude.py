# Veyra – Gebäude-Baukasten (Welt-Grafik, Runde 4): Hausschalen als GLB für Morgenau & Co.
# Aufruf: /home/claude/.venv-blender/bin/python tools/modelle/welt/gebaeude.py [haus|station|alle] [--form]
# Eigene Entwürfe. Blender: Z oben, Vorderseite (Türen) = −Y → glTF/three: +Z. Maße in Feldern (1 Feld = 1 m).
# Je Modell zwei Objekte: „Wand“ (Wände, Sockel, Balken, Giebel, Schornstein) und „Dach“ – im Spiel je eine Instanzfarbe (Wand-/Dachfarbe).
# Vertexfarbe (FLOAT_COLOR, sRGB-Werte wie die Spielfarben) = Teilfarbe; Textur (1024², gebacken) = Umgebungsverdeckung (AO) über beide Objekte.
# Nennmaß: Breite 4, Tiefe 3 (Spiel skaliert auf die Kachelfläche), Wandhöhe 1,7, Dachhöhe 1,25 (wie 09-three3d.js).
import bpy, bmesh, math, os, sys, time
from mathutils import Vector, Matrix
T0 = time.time()
def log(*a): print('[%5.1fs]' % (time.time() - T0), *a, flush=True)
OUT = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'public', 'models', 'welt')
W, D, WH, RH = 4.0, 3.0, 1.7, 1.25
def hexc(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (1.0,)
WALL, STONE, WOOD, WOOD2, BRICK, TILE, METAL = hexc('#ffffff'), hexc('#b9a68e'), hexc('#7a5236'), hexc('#8e6442'), hexc('#a8705a'), hexc('#ffffff'), hexc('#6e747c')

class Part:  # sammelt Teile mit Farbe in einem bmesh
    def __init__(s, name): s.name = name; s.bm = bmesh.new(); s.col = s.bm.loops.layers.float_color.new('Col')
    def add(s, geo_fn, color, mat=Matrix(), bevel=0.0, seg=1):
        tmp = bmesh.new(); geo_fn(tmp)
        if bevel > 0: bmesh.ops.bevel(tmp, geom=list(tmp.edges), offset=bevel, segments=seg, affect='EDGES', profile=.5)
        bmesh.ops.transform(tmp, matrix=mat, verts=tmp.verts)
        me = bpy.data.meshes.new('t'); tmp.to_mesh(me); tmp.free()
        n0 = len(s.bm.faces); s.bm.from_mesh(me); bpy.data.meshes.remove(me)
        s.bm.faces.ensure_lookup_table()
        for f in s.bm.faces[n0:]:
            for l in f.loops: l[s.col] = color
    def obj(s):
        me = bpy.data.meshes.new(s.name); bmesh.ops.recalc_face_normals(s.bm, faces=s.bm.faces); s.bm.normal_update(); s.bm.to_mesh(me); s.bm.free()
        o = bpy.data.objects.new(s.name, me); bpy.context.collection.objects.link(o); return o

def box(sx, sy, sz): return lambda b: bmesh.ops.create_cube(b, size=1.0, matrix=Matrix.Diagonal((sx, sy, sz, 1)))
def cyl(r, h, seg=10, r2=None): return lambda b: bmesh.ops.create_cone(b, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h)
def T(x, y, z, rx=0, ry=0, rz=0): return Matrix.Translation((x, y, z)) @ Matrix.Rotation(rz, 4, 'Z') @ Matrix.Rotation(ry, 4, 'Y') @ Matrix.Rotation(rx, 4, 'X')
def prism(points_yz, depth):  # Profil in der Y-Z-Ebene, entlang X extrudiert (Mitte x=0)
    def f(b):
        vs = [b.verts.new((-depth / 2, y, z)) for y, z in points_yz]; ws = [b.verts.new((depth / 2, y, z)) for y, z in points_yz]
        b.faces.new(vs[::-1]); b.faces.new(ws); n = len(vs)
        for i in range(n): b.faces.new((vs[i], vs[(i + 1) % n], ws[(i + 1) % n], ws[i]))
    return f

def walls_common(P, timber=True, plinth=STONE):
    w, d = W - .02, D - .02
    P.add(box(w, d, WH), WALL, T(0, 0, WH / 2), bevel=.035, seg=2)                       # Wandkörper, gerundete Kanten
    P.add(box(W + .12, D + .12, .3), plinth, T(0, 0, .15), bevel=.04, seg=2)            # Sockel
    P.add(box(W + .16, D + .16, .05), plinth, T(0, 0, .31), bevel=.015)                  # Sockel-Abdeckung
    if timber:
        for sx in (-1, 1):
            for sy in (-1, 1): P.add(box(.13, .13, WH - .3), WOOD, T(sx * (w / 2 - .035), sy * (d / 2 - .035), .3 + (WH - .3) / 2), bevel=.02)  # Eckpfosten
        for sy in (-1, 1): P.add(box(w + .06, .1, .11), WOOD, T(0, sy * (d / 2 + .01), WH - .07), bevel=.02)   # Rähm vorn/hinten
        for sx in (-1, 1): P.add(box(.1, d + .06, .11), WOOD, T(sx * (w / 2 + .01), 0, WH - .07), bevel=.02)  # Rähm seitlich
        for sy in (-1, 1): P.add(box(w + .04, .08, .07), WOOD2, T(0, sy * (d / 2 + .005), .5), bevel=.015)    # Brüstungsriegel unten

def gable_house():
    Pw, Pr = Part('Wand'), Part('Dach'); walls_common(Pw)
    w, d = W - .02, D - .02
    for sx in (-1, 1):   # Giebeldreiecke + Fachwerk im Giebel
        Pw.add(prism([(-d / 2, 0), (d / 2, 0), (0, RH * .96)], .14), WALL, T(sx * (w / 2 - .07), 0, WH))
        x = sx * (w / 2 + .005)
        Pw.add(box(.08, .09, RH * .9), WOOD, T(x, 0, WH + RH * .45), bevel=.015)                       # Firstständer
        for sy in (-1, 1):
            L = math.hypot(d / 2 * .9, RH * .8); a = math.atan2(RH * .8, d / 2 * .9)
            Pw.add(box(.08, L, .08), WOOD, T(x, sy * d / 4 * .9, WH + RH * .4, rx=-sy * a), bevel=.015)  # Streben
        Pw.add(box(.08, d * .62, .08), WOOD2, T(x, 0, WH + RH * .4), bevel=.015)                      # Riegel
    # Schornstein (Ziegel) mit Kragen und Kappe
    cx, cy = W * .25, D * .15
    Pw.add(box(.32, .32, 1.6), BRICK, T(cx, cy, WH + .7), bevel=.02); Pw.add(box(.42, .42, .08), STONE, T(cx, cy, WH + RH * .55 + .72), bevel=.02)
    Pw.add(box(.36, .36, .05), STONE, T(cx, cy, WH + RH * .55 + .82))
    # Dach: zwei Schrägen mit Überstand (Traufe .3, Ortgang .2), Ziegelreihen als Stufen, First, Windbretter, Dachrinne
    sa = D / 2 + .3; L = math.hypot(sa, RH) + .04; th = math.atan2(RH, sa); RW = W + .4
    for sg in (-1, 1):
        rot = T(0, 0, 0, rx=sg * th)
        def at(u, v, z=0):  # u = Abstand vom First entlang der Schräge (0..L), v = x
            p = Vector((v, sg * (u * math.cos(th)), WH + RH - u * math.sin(th) + .06 + z)); return p
        c = at(L / 2, 0); Pr.add(box(RW, L, .09), TILE, Matrix.Translation(c) @ Matrix.Rotation(-sg * th, 4, 'X'), bevel=.02)
        n = 7
        for i in range(n):   # Ziegelreihen: flache Stufen, untere Kante leicht vorstehend
            u = (i + .78) * L / n; c = at(u, 0, .055); Pr.add(box(RW - .02, L / n * .5, .045), TILE, Matrix.Translation(c) @ Matrix.Rotation(-sg * th, 4, 'X'), bevel=.015)
        for sx in (-1, 1):   # Windbretter am Ortgang
            c = at(L / 2, sx * (RW / 2 + .02), -.02); Pr.add(box(.06, L + .04, .2), WOOD, Matrix.Translation(c) @ Matrix.Rotation(-sg * th, 4, 'X'), bevel=.015)
        c = at(L + .02, 0, -.06); Pr.add(cyl(.05, RW, 8), METAL, Matrix.Translation(c) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))  # Rinne
    Pr.add(cyl(.1, RW + .06, 10), TILE, T(0, 0, WH + RH + .12, ry=math.pi / 2))     # First
    for sx in (-1, 1): Pr.add(cyl(.11, .06, 10), WOOD, T(sx * (RW / 2 + .03), 0, WH + RH + .12, ry=math.pi / 2))
    return Pw.obj(), Pr.obj()

def station():
    Pw, Pr = Part('Wand'), Part('Dach'); walls_common(Pw, timber=False, plinth=hexc('#9fd8cc'))
    w, d = W - .02, D - .02; R = d / 2 + .22
    for sy in (-1, 1): Pw.add(box(w + .06, .1, .12), hexc('#e8f4f0'), T(0, sy * (d / 2 + .01), WH - .06), bevel=.02)   # Gesims
    for sx in (-1, 1):
        for sy in (-1, 1): Pw.add(box(.16, .16, WH - .3), hexc('#e8f4f0'), T(sx * (w / 2 - .02), sy * (d / 2 - .02), .3 + (WH - .3) / 2), bevel=.03)  # Pilaster
    # Tonnendach (Halbzylinder, flach gedrückt) mit Rippen
    semi = lambda r, n=24: [(-r * math.cos(math.pi * i / n), r * math.sin(math.pi * i / n) * .78) for i in range(n + 1)]
    Pr.add(prism(semi(R), W + .3), TILE, T(0, 0, WH))
    k = 4
    for i in range(k + 1):
        x = -W / 2 - .1 + i * (W + .2) / k
        Pr.add(prism(semi(R + .05), .09), hexc('#dff4ee'), T(x, 0, WH - .01))
    for sy in (-1, 1): Pr.add(cyl(.05, W + .3, 8), METAL, T(0, sy * (R + .02), WH + .02, ry=math.pi / 2))
    return Pw.obj(), Pr.obj()

def finish(name, objs, form):
    tri = sum(len(p.vertices) - 2 for o in objs for p in o.data.polygons); log(name, 'Dreiecke', tri)
    for o in objs:
        o.data.uv_layers.new(name='UVMap')
        for p in o.data.polygons: p.use_smooth = False
    # gemeinsamer UV-Atlas
    for o in bpy.context.view_layer.objects: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=.006, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    if form: return tri
    # Boden für die Verdeckung (nicht exportiert)
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, -.001)); ground = bpy.context.active_object
    S = 1024; img = bpy.data.images.new('ao_' + name, S, S, alpha=False)
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 24; sc.render.bake.margin = 8
    mat = bpy.data.materials.new('Haus_' + name); mat.use_nodes = True; nt = mat.node_tree; bsdf = nt.nodes['Principled BSDF']
    tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = img; nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color']); nt.nodes.active = tex
    for o in objs: o.data.materials.clear(); o.data.materials.append(mat)
    for o in bpy.context.view_layer.objects: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    t = time.time(); bpy.ops.object.bake(type='AO', margin=8, use_clear=True); log('AO gebacken %.1fs' % (time.time() - t))
    # etwas aufhellen (Verdeckung weich, nie schwarz) und speichern
    import numpy as np
    a = np.array(img.pixels[:], np.float32).reshape(S, S, 4); a[..., :3] = .35 + .65 * np.clip(a[..., :3], 0, 1) ** .8; img.pixels[:] = a.ravel()
    img.filepath_raw = os.path.join(OUT, name + '_ao.png'); img.file_format = 'PNG'
    bpy.data.objects.remove(ground)
    for o in bpy.context.view_layer.objects: o.select_set(False)
    for o in objs: o.select_set(True)
    os.makedirs(OUT, exist_ok=True); path = os.path.join(OUT, name + '.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_animations=False, export_vertex_color='NAME', export_vertex_color_name='Col',
                              export_all_vertex_colors=True, export_image_format='WEBP', export_image_quality=86, export_texcoords=True, export_normals=True, export_yup=True)
    log('GLB', path, os.path.getsize(path), 'B'); return tri

def build(kind, form):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    objs = list(gable_house() if kind == 'haus' else station())
    for o in objs: o.data.color_attributes.active_color = o.data.color_attributes['Col']
    return finish(kind, objs, form)

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]; form = '--form' in sys.argv
    kinds = ['haus', 'station'] if not args or args[0] == 'alle' else [args[0]]
    for k in kinds: build(k, form)
