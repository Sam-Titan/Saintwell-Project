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
    "green": ((0xAC, 0xC2, 0x58), (0.62, 0.80, 0.18)),
    "pink": ((0xF4, 0x8C, 0xB0), (0.92, 0.45, 0.62)),
}
# look variants: absorption density (depth of the thick centre), scatter, rim light power
VARIANTS = {
    "a": {"absorb": 20.0, "scatter": 1.5, "rim": 70, "rough": 0.12},
    "b": {"absorb": 7.0, "scatter": 10.0, "rim": 420, "rough": 0.14},
    "c": {"absorb": 8.0, "scatter": 4.0, "rim": 50, "rough": 0.08},
}
# world = scene colour, so the edges glow with it
WORLD = {"green": (0x3E, 0x4A, 0x2F), "pink": (0x6A, 0x1F, 0x2B)}
TILT_BASE = math.radians(38)  # camera elevation: the dome top shows (HERO_TILT in gummyPaths.ts)
TILT_ROCK = math.radians(10)
WIDTH_M = 0.37  # widest silhouette of the gumdrop (jar units)
FILL = 0.74  # the gummy spans this share of the frame width (the page sizes the sprite from it)


def srgb_to_linear(c):
    c = c / 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def jelly_material(name, rgb, deep, v, whiten=1.0):
    """Smooth jelly (no bump): transmission + subsurface (edges glow in the gummy's own colour), absorption inside
    (thick centre deeper), and a few sparse, tiny, sharp sugar sparkles."""
    mat = bpy.data.materials.new(name)
    nt = mat.node_tree
    nt.nodes.clear()
    n = nt.nodes
    link = nt.links.new
    lin = [srgb_to_linear(c) for c in rgb]
    base = tuple(lin) + (1.0,)

    out = n.new("ShaderNodeOutputMaterial")
    mix = n.new("ShaderNodeMixShader")

    jelly = n.new("ShaderNodeBsdfPrincipled")
    jelly.inputs["Base Color"].default_value = base
    jelly.inputs["Roughness"].default_value = v["rough"]
    jelly.inputs["IOR"].default_value = 1.45
    jelly.inputs["Transmission Weight"].default_value = 0.4
    jelly.inputs["Subsurface Weight"].default_value = 0.8 * whiten
    jelly.inputs["Subsurface Radius"].default_value = (0.5, 0.5, 0.5)
    jelly.inputs["Subsurface Scale"].default_value = 0.09
    jelly.inputs["Specular IOR Level"].default_value = 0.3

    # sugar sparkle: tiny bright points (emission), well apart
    sparkle = n.new("ShaderNodeEmission")
    sparkle.inputs["Color"].default_value = (1.0, 1.0, 0.95, 1.0)
    sparkle.inputs["Strength"].default_value = 8.0
    coord = n.new("ShaderNodeTexCoord")
    vor = n.new("ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = 170.0
    vor.inputs["Randomness"].default_value = 1.0
    thr = n.new("ShaderNodeMapRange")
    thr.inputs["From Min"].default_value = 0.16  # a small round dot at the centre of a few cells
    thr.inputs["From Max"].default_value = 0.09
    thr.inputs["To Min"].default_value = 0.0
    thr.inputs["To Max"].default_value = 1.0
    thr.clamp = True
    # keep only some cells: a second, coarser noise gates them (sparse, uneven)
    gate = n.new("ShaderNodeTexNoise")
    gate.inputs["Scale"].default_value = 45.0
    gate_r = n.new("ShaderNodeMapRange")
    gate_r.inputs["From Min"].default_value = 0.62
    gate_r.inputs["From Max"].default_value = 0.65
    gate_r.clamp = True
    mulv = n.new("ShaderNodeMath")
    mulv.operation = "MULTIPLY"
    link(coord.outputs["Object"], vor.inputs["Vector"])
    link(coord.outputs["Object"], gate.inputs["Vector"])
    link(vor.outputs["Distance"], thr.inputs["Value"])
    link(gate.outputs["Fac"], gate_r.inputs["Value"])
    link(thr.outputs["Result"], mulv.inputs[0])
    link(gate_r.outputs["Result"], mulv.inputs[1])
    link(mulv.outputs["Value"], mix.inputs["Fac"])
    # brightness varies per crystal: mostly dim, a few bright glints
    sep = n.new("ShaderNodeSeparateColor")
    cube = n.new("ShaderNodeMath")
    cube.operation = "POWER"
    cube.inputs[1].default_value = 4.0
    bright = n.new("ShaderNodeMapRange")
    bright.inputs["To Min"].default_value = 0.5
    bright.inputs["To Max"].default_value = 9.0
    link(vor.outputs["Color"], sep.inputs["Color"])
    link(sep.outputs["Red"], cube.inputs[0])
    link(cube.outputs["Value"], bright.inputs["Value"])
    link(bright.outputs["Result"], sparkle.inputs["Strength"])

    link(jelly.outputs["BSDF"], mix.inputs[1])
    link(sparkle.outputs["Emission"], mix.inputs[2])
    link(mix.outputs["Shader"], out.inputs["Surface"])

    # inside: absorbs (the thick middle gets deeper) and scatters a little (soft glow)
    absorb = n.new("ShaderNodeVolumeAbsorption")
    absorb.inputs["Color"].default_value = tuple(deep) + (1.0,)
    absorb.inputs["Density"].default_value = v["absorb"] * (0.6 if "pink" in name else 1.0)
    scatter = n.new("ShaderNodeVolumeScatter")
    scatter.inputs["Color"].default_value = base
    scatter.inputs["Density"].default_value = v["scatter"]
    scatter.inputs["Anisotropy"].default_value = 0.4
    addv = n.new("ShaderNodeAddShader")
    link(absorb.outputs["Volume"], addv.inputs[0])
    link(scatter.outputs["Volume"], addv.inputs[1])
    link(addv.outputs["Shader"], out.inputs["Volume"])
    return mat




def grey_material():
    mat = bpy.data.materials.new("grey")
    b = mat.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.5, 0.5, 0.5, 1.0)
    b.inputs["Roughness"].default_value = 1.0
    return mat


def add_area(name, loc, target, energy, size, colour=(1, 1, 1), glossy=False):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.size = size
    data.color = colour
    data.shape = "DISK"
    if name == "back":
        data.spread = math.radians(180)
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.visible_glossy = glossy  # big lights must not show up as rectangles in the jelly's reflection
    obj.location = loc
    direction = (target[0] - loc[0], target[1] - loc[1], target[2] - loc[2])
    obj.rotation_euler = mathutils.Vector(direction).to_track_quat("-Z", "Y").to_euler()
    return obj


def main():
    args = sys.argv[sys.argv.index("--") + 1 :]
    out_dir, frames, size, samples = args[0], int(args[1]), int(args[2]), int(args[3])
    which = args[4] if len(args) > 4 else "all"
    variant = args[5] if len(args) > 5 else "a"
    grey = len(args) > 6 and args[6] == "grey"  # diagnostic: plain grey diffuse, shows geometry only
    v = VARIANTS[variant]
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
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "None"

    # soft white world: the light that shines through the jelly from behind
    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    bg_node = world.node_tree.nodes["Background"]
    bg_node.inputs["Color"].default_value = (1, 1, 1, 1)
    bg_node.inputs["Strength"].default_value = 1.0
    # smooth backlight: the world is brightest behind the gummy (+Y, away from the camera) and fades out
    # towards the front, no edges anywhere (a light's rim made a hard band)
    wn = world.node_tree.nodes
    wl = world.node_tree.links
    wcoord = wn.new("ShaderNodeTexCoord")
    wsep = wn.new("ShaderNodeSeparateXYZ")
    wmap = wn.new("ShaderNodeMapRange")
    wmap.inputs["From Min"].default_value = -0.4
    wmap.inputs["From Max"].default_value = 1.0
    wmap.inputs["To Min"].default_value = 0.04
    wmap.inputs["To Max"].default_value = v["rim"] / 100.0
    wmap.interpolation_type = "SMOOTHSTEP"
    wl.new(wcoord.outputs["Generated"], wsep.inputs["Vector"])
    wl.new(wsep.outputs["Y"], wmap.inputs["Value"])
    wl.new(wmap.outputs["Result"], bg_node.inputs["Strength"])
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
    add_area("key", (-0.9, -1.2, 1.1), (0, 0, 0), 14, 2.5, (1.0, 0.97, 0.92))
    add_area("spec", (-0.45, -0.9, 1.5), (0, 0, 0), 9, 0.03, glossy=True)  # one small sharp highlight on the dome
    add_area("fill", (1.0, -1.4, 0.2), (0, 0, 0), 4, 1.0)

    log = []
    t_all = time.time()
    for colour, (rgb, deep) in COLOURS.items():
        mat = grey_material() if grey else jelly_material(f"jelly_{colour}", rgb, deep, v, 0.5 if colour == "pink" else 1.0)
        wc = tuple(srgb_to_linear(c) for c in WORLD[colour]) + (1.0,)
        glow = [srgb_to_linear(c) for c in rgb]
        bg_node.inputs["Color"].default_value = tuple((0.35 if colour == "green" else 0.0) + (0.65 if colour == "green" else 1.0) * c for c in glow) + (1.0,)
        obj = bg.make(f"gummy_{colour}", 5, mat, uv=False)  # smooth, 20480 triangles
        obj.rotation_mode = "ZYX"  # spin about its own vertical axis first, then tilt towards the camera
        for k in todo:
            phi = 2 * math.pi * k / frames
            tilt = TILT_BASE + TILT_ROCK * math.sin(phi)
            obj.rotation_euler = (tilt, 0.0, phi)
            path = os.path.join(out_dir, f"gummy-{colour}-{k:02d}{'' if which == 'all' else '-' + variant}.png")
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
