"""Build the gummies (Phase 4R, D-83) and bake the sugar surface textures.

Two meshes in one .glb, same gumdrop shape and size (jar units: body radius = 1.0, gummy ~0.36 wide, ~0.2 tall, flat base down):
  Gummy      low poly (320 triangles): drawn many times with instancing (the crowd)
  GummyHero  detailed (5120 triangles): the one big gummy in the close-up scenes

Also writes two small tiling textures next to the .glb (CPU bake with numpy, no GPU):
  sugar-normal.png   512 px normal map: tiny sugar crystals
  sugar-specks.png   512 px grey map: black with sparse sugar sparkles (whitens the colour, D-98)
  sugar-rough.png    512 px roughness map (G channel): matte grain, small shiny points at the sparkles
`just models` converts them to WebP in public/textures/.

Run headless:  blender -b --factory-startup --python blender/build_gummy.py -- blender/out/gummy.glb
"""

import math
import os
import sys

import bmesh
import bpy
import numpy as np

SAGE = (0x9B / 255, 0xA5 / 255, 0x6B / 255, 1.0)
RADIUS = 0.18  # half width of the gumdrop
DOME = 0.15  # height of the domed top above the widest ring
BASE = 0.05  # depth of the flat-based part below the widest ring
FLATNESS = 0.45  # < 1 pushes the underside towards a flat plate with a rounded edge


def shape(bm):
    """Gumdrop (D-107): round in plan, flat base, domed top. Fixed numbers: same shape every build.
    Centred on its bounding box so it rotates about its middle."""
    mid = (DOME - BASE) / 2
    for v in bm.verts:
        p = v.co.copy()
        ang = math.atan2(p.y, p.x)
        wob = 1.0 + 0.04 * math.sin(3 * ang + 0.7) + 0.025 * math.sin(2 * ang + 2.1)
        v.co.x = RADIUS * wob * p.x
        v.co.y = RADIUS * wob * p.y
        if p.z >= 0:
            v.co.z = DOME * p.z - mid
        else:
            v.co.z = -BASE * (-p.z) ** FLATNESS - mid


def make(name, subdivisions, material, uv):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdivisions, radius=1.0)
    shape(bm)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for poly in mesh.polygons:
        poly.use_smooth = True
    mesh.materials.append(material)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    if uv:
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.02)
        bpy.ops.object.mode_set(mode="OBJECT")
    return obj


def bake_textures(folder):
    rng = np.random.default_rng(7)  # fixed seed: same textures every build

    def bumps(n, count, radius):
        """Wrap-around field of small round crystals, so the texture tiles."""
        h = np.zeros((n, n), dtype=np.float32)
        yy, xx = np.mgrid[0:n, 0:n].astype(np.float32)
        for _ in range(count):
            cx, cy = rng.uniform(0, n, 2)
            r = radius * rng.uniform(0.6, 1.4)
            dx = np.minimum(abs(xx - cx), n - abs(xx - cx))
            dy = np.minimum(abs(yy - cy), n - abs(yy - cy))
            d2 = (dx * dx + dy * dy) / (r * r)
            h += np.where(d2 < 1.0, (1.0 - np.minimum(d2, 1.0)) ** 1.5, 0.0).astype(np.float32)
        return h

    # normal map from a height field of crystals (gradients wrap, so it tiles)
    n = 512
    h = bumps(n, 2600, 5.0)
    h = h / max(h.max(), 1e-6)
    gx = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) * 0.5
    gy = (np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0)) * 0.5
    strength = 14.0
    nx, ny, nz = -gx * strength, -gy * strength, np.ones_like(h)
    ln = np.sqrt(nx * nx + ny * ny + nz * nz)
    rgb = np.stack([nx / ln, ny / ln, nz / ln], axis=-1) * 0.5 + 0.5
    write_image("sugar-normal", os.path.join(folder, "sugar-normal.png"), rgb, n)

    # sparkles: sparse bright dots on black (the colour map whitens the gummy colour there)
    sp = np.clip(bumps(n, 140, 2.8) * 1.8, 0.0, 1.0)  # sparse (D-107)
    write_image("sugar-specks", os.path.join(folder, "sugar-specks.png"), np.stack([sp] * 3, axis=-1), n)

    # roughness (G channel): matte everywhere, a little smoother on crystal tops, glints at the sparkles
    rough = np.clip(0.94 - 0.2 * h - 0.4 * sp, 0.3, 1.0)
    rgb_r = np.stack([np.zeros_like(rough), rough, np.zeros_like(rough)], axis=-1)
    write_image("sugar-rough", os.path.join(folder, "sugar-rough.png"), rgb_r, n)


def write_image(name, path, rgb, size):
    img = bpy.data.images.new(name, size, size, alpha=False)
    img.colorspace_settings.name = "Non-Color"  # set first: changing it later clears the pixels
    flat = np.ones((size, size, 4), dtype=np.float32)
    flat[..., :3] = rgb
    img.pixels[:] = flat.ravel().tolist()
    img.filepath_raw = path
    img.file_format = "PNG"
    img.save()


def main():
    out = sys.argv[sys.argv.index("--") + 1]
    bpy.ops.wm.read_factory_settings(use_empty=True)

    mat = bpy.data.materials.new("gummy")
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = SAGE
    bsdf.inputs["Roughness"].default_value = 0.9

    # a second material keeps gltf-transform from joining the two meshes into one
    mat_crowd = mat.copy()
    mat_crowd.name = "gummy_crowd"
    make("Gummy", 3, mat_crowd, uv=True)  # 320 triangles (UVs: the crowd shares the sugar maps)
    make("GummyHero", 4, mat, uv=True)  # 5120 triangles

    bake_textures(os.path.dirname(os.path.abspath(out)))

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
    print(f"gummy exported to {out}")


if __name__ == "__main__":
    main()
