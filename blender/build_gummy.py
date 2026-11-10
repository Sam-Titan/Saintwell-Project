"""Build one soft rounded gummy (low poly, 320 triangles). Drawn many times with instancing.

Run headless:  blender -b --factory-startup --python blender/build_gummy.py -- blender/out/gummy.glb

Units match the jar (body radius = 1.0): the gummy is ~0.36 wide and ~0.22 thick. Origin = centre.
"""

import sys

import bpy
import bmesh

SAGE = (0x9B / 255, 0xA5 / 255, 0x6B / 255, 1.0)
HALF = (0.18, 0.18, 0.11)  # half sizes x, y, z
SQUARENESS = 2.6  # 2 = ellipsoid; higher = squarer, pillow-like


def main():
    out = sys.argv[sys.argv.index("--") + 1]
    bpy.ops.wm.read_factory_settings(use_empty=True)

    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=3, radius=1.0)
    k = 2.0 / SQUARENESS
    for v in bm.verts:
        p = v.co.copy()
        v.co.x = HALF[0] * (abs(p.x) ** k) * (1 if p.x >= 0 else -1)
        v.co.y = HALF[1] * (abs(p.y) ** k) * (1 if p.y >= 0 else -1)
        v.co.z = HALF[2] * (abs(p.z) ** k) * (1 if p.z >= 0 else -1)
    mesh = bpy.data.meshes.new("Gummy")
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True
    obj = bpy.data.objects.new("Gummy", mesh)
    bpy.context.collection.objects.link(obj)

    m = bpy.data.materials.new("gummy")
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = SAGE
    bsdf.inputs["Roughness"].default_value = 0.35
    mesh.materials.append(m)

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=out,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_normals=True,
        export_materials="EXPORT",
    )
    print(f"gummy exported to {out}")


main()
