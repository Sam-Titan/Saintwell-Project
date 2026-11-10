"""Render the hero gummy turntable sprites (D-106) with Cycles on the CPU (+ OpenImageDenoise).

Same gumdrop shape as the 3D gummy (build_gummy.shape). One PNG (RGBA, transparent) per frame and colour:
  <out>/gummy-<colour>-<NN>.png

Motion: a slow spin about the gummy's own vertical axis plus a gentle tilt rock (20 deg +- 16 deg), one full
cycle per turn, so the loop is seamless and the dome / sugar keep catching the light. Frame 0 = spin 0,
tilt 20 deg: the real-time hero gummy takes off in exactly that pose.

Run headless (see `just sprites`):
  blender -b --factory-startup --python blender/render_gummy.py -- <out dir> <frames> <size px> <samples> [frame list]
frame list: "all" (default) or e.g. "0,6" for a quick look.
"""

import math
import os
import sys
import time

import bpy
import mathutils

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_gummy as bg  # noqa: E402

# colour, jelly colour (SPEC / theme tokens: sage and pink accents), deeper tone for the thick middle
COLOURS = {
    "green": ((0x9B, 0xA5, 0x6B), (0.34, 0.42, 0.10)),
    "pink": ((0xD7, 0x9A, 0xA8), (0.62, 0.20, 0.30)),
}
TILT_BASE = math.radians(20)
TILT_ROCK = math.radians(16)
WIDTH_M = 0.38  # widest silhouette of the gumdrop (jar units)
FILL = 0.74  # the gummy spans this share of the frame width (the page sizes the sprite from it)


def srgb_to_linear(c):
    c = c / 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def jelly_material(name, rgb, deep):
    mat = bpy.data.materials.new(name)
    nt = mat.node_tree
    nt.nodes.clear()
    n = nt.nodes
    link = nt.links.new
    base = tuple(srgb_to_linear(v) for v in rgb) + (1.0,)

    out = n.new("ShaderNodeOutputMaterial")
    mix = n.new("ShaderNodeMixShader")

    # jelly: translucent, softly glossy, a little subsurface
    jelly = n.new("ShaderNodeBsdfPrincipled")
    jelly.inputs["Base Color"].default_value = base
    jelly.inputs["Roughness"].default_value = 0.32
    jelly.inputs["IOR"].default_value = 1.42
    jelly.inputs["Transmission Weight"].default_value = 0.8
    jelly.inputs["Subsurface Weight"].default_value = 0.35
    jelly.inputs["Subsurface Radius"].default_value = (0.2, 0.2, 0.2)
    jelly.inputs["Subsurface Scale"].default_value = 0.06
    jelly.inputs["Specular IOR Level"].default_value = 0.45

    # sugar crystals: sparse, white, a little glossy
    sugar = n.new("ShaderNodeBsdfPrincipled")
    sugar.inputs["Base Color"].default_value = (0.95, 0.95, 0.92, 1.0)
    sugar.inputs["Roughness"].default_value = 0.4
    sugar.inputs["Specular IOR Level"].default_value = 0.6

    coord = n.new("ShaderNodeTexCoord")
    # fine bumps all over (the sugar coat)
    vor_bump = n.new("ShaderNodeTexVoronoi")
    vor_bump.inputs["Scale"].default_value = 520.0
    vor_bump.inputs["Randomness"].default_value = 1.0
    bump_ramp = n.new("ShaderNodeMapRange")
    bump_ramp.inputs["From Min"].default_value = 0.0
    bump_ramp.inputs["From Max"].default_value = 0.6
    bump = n.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.55
    bump.inputs["Distance"].default_value = 0.004
    link(coord.outputs["Object"], vor_bump.inputs["Vector"])
    link(vor_bump.outputs["Distance"], bump_ramp.inputs["Value"])
    link(bump_ramp.outputs["Result"], bump.inputs["Height"])
    link(bump.outputs["Normal"], jelly.inputs["Normal"])
    link(bump.outputs["Normal"], sugar.inputs["Normal"])

    # which spots are sugar: a coarser Voronoi, thresholded, covers about 30 %
    vor_mask = n.new("ShaderNodeTexVoronoi")
    vor_mask.inputs["Scale"].default_value = 330.0
    vor_mask.inputs["Randomness"].default_value = 1.0
    vor_mask.inputs["Detail"].default_value = 0.0
    thr = n.new("ShaderNodeMapRange")
    thr.inputs["From Min"].default_value = 0.30
    thr.inputs["From Max"].default_value = 0.20
    thr.inputs["To Min"].default_value = 0.0
    thr.inputs["To Max"].default_value = 0.55
    thr.clamp = True
    link(coord.outputs["Object"], vor_mask.inputs["Vector"])
    link(vor_mask.outputs["Distance"], thr.inputs["Value"])
    link(thr.outputs["Result"], mix.inputs["Fac"])

    link(jelly.outputs["BSDF"], mix.inputs[1])
    link(sugar.outputs["BSDF"], mix.inputs[2])
    link(mix.outputs["Shader"], out.inputs["Surface"])

    # inside: absorbs (the thick middle gets deeper) and scatters a little (soft glow)
    absorb = n.new("ShaderNodeVolumeAbsorption")
    absorb.inputs["Color"].default_value = tuple(deep) + (1.0,)
    absorb.inputs["Density"].default_value = 9.0
    scatter = n.new("ShaderNodeVolumeScatter")
    scatter.inputs["Color"].default_value = base
    scatter.inputs["Density"].default_value = 3.0
    scatter.inputs["Anisotropy"].default_value = 0.4
    addv = n.new("ShaderNodeAddShader")
    link(absorb.outputs["Volume"], addv.inputs[0])
    link(scatter.outputs["Volume"], addv.inputs[1])
    link(addv.outputs["Shader"], out.inputs["Volume"])
    return mat


def add_area(name, loc, target, energy, size, colour=(1, 1, 1)):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.size = size
    data.color = colour
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    direction = (target[0] - loc[0], target[1] - loc[1], target[2] - loc[2])
    obj.rotation_euler = mathutils.Vector(direction).to_track_quat("-Z", "Y").to_euler()
    return obj


def main():
    args = sys.argv[sys.argv.index("--") + 1 :]
    out_dir, frames, size, samples = args[0], int(args[1]), int(args[2]), int(args[3])
    which = args[4] if len(args) > 4 else "all"
    todo = list(range(frames)) if which == "all" else [int(v) for v in which.split(",")]
    os.makedirs(out_dir, exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    cy = scene.cycles
    cy.device = "CPU"
    cy.samples = samples
    cy.use_denoising = True
    cy.denoiser = "OPENIMAGEDENOISE"
    cy.max_bounces = 12
    cy.transmission_bounces = 10
    cy.volume_bounces = 4
    scene.render.film_transparent = True
    scene.render.resolution_x = scene.render.resolution_y = size
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"

    # soft white world: the light that shines through the jelly from behind
    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    bg_node = world.node_tree.nodes["Background"]
    bg_node.inputs["Color"].default_value = (1, 1, 1, 1)
    bg_node.inputs["Strength"].default_value = 0.9
    scene.world = world

    # camera: orthographic, looks along +Y (the front of the web scene's +Z), level
    cam_data = bpy.data.cameras.new("cam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = WIDTH_M / FILL
    cam = bpy.data.objects.new("cam", cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = (0, -3, 0)
    cam.rotation_euler = (math.radians(90), 0, 0)
    scene.camera = cam

    # key from upper left front, rim from behind right, small fill
    add_area("key", (-0.9, -1.2, 1.1), (0, 0, 0), 55, 0.7, (1.0, 0.97, 0.92))
    add_area("rim", (1.0, 1.1, 0.8), (0, 0, 0), 90, 0.5)
    add_area("fill", (1.0, -1.4, 0.2), (0, 0, 0), 12, 1.0)

    log = []
    t_all = time.time()
    for colour, (rgb, deep) in COLOURS.items():
        mat = jelly_material(f"jelly_{colour}", rgb, deep)
        obj = bg.make(f"gummy_{colour}", 5, mat, uv=False)  # smooth, 20480 triangles
        obj.rotation_mode = "ZYX"  # spin about its own vertical axis first, then tilt towards the camera
        for k in todo:
            phi = 2 * math.pi * k / frames
            tilt = TILT_BASE + TILT_ROCK * math.sin(phi)
            obj.rotation_euler = (tilt, 0.0, phi)
            path = os.path.join(out_dir, f"gummy-{colour}-{k:02d}.png")
            scene.render.filepath = path
            t0 = time.time()
            bpy.ops.render.render(write_still=True)
            log.append(f"{colour} {k:02d} {time.time() - t0:.1f}s")
            print(log[-1], flush=True)
        bpy.data.objects.remove(obj)
    total = f"total {time.time() - t_all:.1f}s for {len(log)} frames"
    print(total)
    with open(os.path.join(out_dir, "render-times.txt"), "w") as f:
        f.write("\n".join(log + [total]) + "\n")


if __name__ == "__main__":
    main()
