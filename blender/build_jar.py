"""Build the SAINTWELL jar: Body, Cap (separate, white, ridged) and Label (separate band).

Run headless:  blender -b --factory-startup --python blender/build_jar.py -- blender/out/jar.glb

Units: body radius = 1.0. Z is up in Blender; the glTF export turns it into Y up.
The jar front faces Blender -Y (= +Z in three.js). The label seam is at the back.
Label UV: u runs 0..1 around the band; u = 0.5 is the front centre, u = 0 / 1 is the back seam.
The band is a fixed height, so the web app only has to change texture repeat/offset per label.
"""

import math
import sys

import bpy
import bmesh

# ---- dimensions (body radius = 1.0) ----
R = 1.0
LABEL_Z0 = 0.25  # label band bottom
LABEL_H = 1.8  # label band height (fixed). Widest label 3.34:1 -> covers ~94 % of the circle
LABEL_R = R + 0.008  # sits just above the body wall
SEGMENTS_BODY = 96
SEGMENTS_LABEL = 96
SEGMENTS_CAP = 192
CAP_RIDGES = 48
CAP_BASE_Z = 2.28  # cap object origin (its bottom ring)
OLIVE = (0x3E / 255, 0x4A / 255, 0x2F / 255, 1.0)


def arc(cx, cz, rx, rz, a0, a1, steps):
    """Points on an elliptical arc (angles in degrees), excluding nothing."""
    pts = []
    for i in range(steps + 1):
        a = math.radians(a0 + (a1 - a0) * i / steps)
        pts.append((cx + rx * math.cos(a), cz + rz * math.sin(a)))
    return pts


def lathe(name, profile, segments, ridge=None):
    """Revolve a closed (r, z) profile around Z. Points with r ~ 0 become single poles.

    ridge = (count, amplitude, weights) adds vertical ridges; weights[i] scales them per profile point.
    """
    bm = bmesh.new()
    rings = []
    for pi, (r, z) in enumerate(profile):
        if r < 1e-6:
            rings.append([bm.verts.new((0.0, 0.0, z))])
            continue
        ring = []
        for s in range(segments):
            th = 2 * math.pi * s / segments
            rr = r
            if ridge:
                count, amp, weights = ridge
                rr = r * (1 + amp * weights[pi] * math.cos(count * th))
            ring.append(bm.verts.new((rr * math.cos(th), rr * math.sin(th), z)))
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for s in range(segments):
            s2 = (s + 1) % segments
            va = [a[0]] if len(a) == 1 else [a[s], a[s2]]
            vb = [b[0]] if len(b) == 1 else [b[s], b[s2]]
            if len(va) == 1:
                bm.faces.new((va[0], vb[1], vb[0]))
            elif len(vb) == 1:
                bm.faces.new((va[0], va[1], vb[0]))
            else:
                bm.faces.new((va[0], va[1], vb[1], vb[0]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def material(name, colour, roughness):
    m = bpy.data.materials.new(name)
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = colour
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = 0.0
    return m


def label_material():
    """White label material with a 1x1 white placeholder texture.

    Without a texture node the glTF exporter drops the UVs. The web app replaces the texture at runtime.
    """
    m = material("label", (1, 1, 1, 1), 0.5)
    img = bpy.data.images.new("label_placeholder", 1, 1)
    img.pixels = (1.0, 1.0, 1.0, 1.0)
    img.pack()
    tex = m.node_tree.nodes.new("ShaderNodeTexImage")
    tex.image = img
    bsdf = m.node_tree.nodes["Principled BSDF"]
    m.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    return m


def body_profile():
    p = [(0.0, 0.0)]
    p += arc(0.78, 0.22, 0.22, 0.22, -90, 0, 8)  # rounded bottom edge
    p += arc(0.88, 2.07, 0.12, 0.20, 0, 90, 8)[0:1]  # wall -> start of shoulder (r = 1.0)
    p += arc(0.88, 2.07, 0.12, 0.20, 0, 90, 8)[1:]  # rounded shoulder into the neck
    p += [(0.88, 2.34), (0.88, 2.40)]  # neck
    p += arc(0.85, 2.40, 0.03, 0.03, 0, 180, 6)[1:]  # rounded rim top
    p += [(0.82, 2.36)]  # inside of neck
    p += arc(0.82, 2.05, 0.12, 0.17, 90, 0, 8)[1:]  # inner shoulder
    p += arc(0.76, 0.24, 0.18, 0.18, 0, -90, 8)  # inner floor edge
    p += [(0.0, 0.06)]
    return p


def cap_profile():
    ro, ri, h = 0.93, 0.895, 0.55
    p = [(0.0, h)]
    p += arc(ro - 0.08, h - 0.08, 0.08, 0.08, 90, 0, 6)  # rounded top edge
    p += [(ro, 0.04)]
    p += [(ro - 0.015, 0.0), (ri, 0.0)]  # bottom lip
    p += [(ri, h - 0.06), (0.0, h - 0.06)]  # underside of the cap
    return p


def ridge_weights(profile):
    # ridges only on the straight side wall, fading out on the top fillet and bottom lip
    out = []
    for r, z in profile:
        out.append(1.0 if r > 0.92 and 0.05 < z < 0.45 else 0.0)
    return out


def build_label():
    bm = bmesh.new()
    cols = SEGMENTS_LABEL + 1  # +1: duplicated seam column so u can run 0..1
    top, bottom = [], []
    for i in range(cols):
        u = i / SEGMENTS_LABEL
        phi = (u - 0.5) * 2 * math.pi
        x, y = LABEL_R * math.sin(phi), -LABEL_R * math.cos(phi)
        bottom.append(bm.verts.new((x, y, LABEL_Z0)))
        top.append(bm.verts.new((x, y, LABEL_Z0 + LABEL_H)))
    for i in range(cols - 1):
        bm.faces.new((bottom[i], bottom[i + 1], top[i + 1], top[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    uv = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        for loop in f.loops:
            v = loop.vert
            i = (bottom.index(v) if v in bottom else top.index(v))
            loop[uv].uv = (i / SEGMENTS_LABEL, 0.0 if v in bottom else 1.0)
    mesh = bpy.data.meshes.new("Label")
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True
    obj = bpy.data.objects.new("Label", mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def main():
    out = sys.argv[sys.argv.index("--") + 1]
    bpy.ops.wm.read_factory_settings(use_empty=True)

    body = lathe("Body", body_profile(), SEGMENTS_BODY)
    body.data.materials.append(material("jar_body", OLIVE, 0.55))

    cp = cap_profile()
    cap = lathe("Cap", cp, SEGMENTS_CAP, ridge=(CAP_RIDGES, 0.012, ridge_weights(cp)))
    cap.location = (0, 0, CAP_BASE_Z)
    cap.data.materials.append(material("cap", (1, 1, 1, 1), 0.4))

    label = build_label()
    label.data.materials.append(label_material())

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=out,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_normals=True,
        export_texcoords=True,
        export_materials="EXPORT",
    )
    print(f"jar exported to {out}")


main()
