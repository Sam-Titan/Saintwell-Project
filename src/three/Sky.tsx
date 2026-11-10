import { useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import type { MotionValue } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import type { Tier } from "../hooks/useDeviceTier";
import { rng } from "./random";
import { timeline } from "./storyTimeline";

/** Moon: the crescent + 2 stars cropped from the green label (page 2) by `just assets`, as vector shapes. */
const MOON_URL = "/images/moon.svg";
const MOON_POS: readonly [number, number, number] = [0, 1.5, -6];
const MOON_SCALE = 0.017;
/** Colour above 1 and `toneMapped = false`: only this passes the bloom threshold, the jars do not glow. */
const GLOW = 2.2;
const STAR_COUNT = 46;

function useMoonGeometry() {
	const [geo, setGeo] = useState<THREE.BufferGeometry[]>([]);
	useEffect(() => {
		let live = true;
		fetch(MOON_URL)
			.then((r) => r.text())
			.then((text) => {
				if (!live) return;
				const data = new SVGLoader().parse(text);
				const out: THREE.BufferGeometry[] = [];
				for (const path of data.paths) {
					for (const shape of SVGLoader.createShapes(path)) {
						out.push(new THREE.ShapeGeometry(shape));
					}
				}
				setGeo(out);
			});
		return () => {
			live = false;
		};
	}, []);
	return geo;
}

function Moon({
	progress,
	glow,
}: {
	progress: MotionValue<number>;
	glow: boolean;
}) {
	const geos = useMoonGeometry();
	// one shared material for the crescent and its two stars
	const mat = useMemo(() => {
		const level = glow ? GLOW : 1;
		return new THREE.MeshBasicMaterial({
			color: new THREE.Color().setRGB(level, level, level),
			toneMapped: false,
			transparent: true,
			opacity: 0,
			side: THREE.DoubleSide,
			depthWrite: false,
		});
	}, [glow]);
	const halo = useRef<THREE.SpriteMaterial>(null);
	const haloMap = useMemo(() => {
		// soft radial sprite for the low tier (no postprocessing, D-69)
		const c = document.createElement("canvas");
		c.width = c.height = 128;
		const g = c.getContext("2d");
		if (g) {
			const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
			grad.addColorStop(0, "rgba(255,255,255,0.3)");
			grad.addColorStop(1, "rgba(255,255,255,0)");
			g.fillStyle = grad;
			g.fillRect(0, 0, 128, 128);
		}
		return new THREE.CanvasTexture(c);
	}, []);
	useFrame(() => {
		const n = timeline(progress.get()).night;
		mat.opacity = n;
		if (halo.current) halo.current.opacity = n;
	});
	return (
		<group position={MOON_POS}>
			{/* SVG y points down: flip it. Moon + stars are centred on the SVG's viewBox (896,306 120x108). */}
			<group
				scale={[MOON_SCALE, -MOON_SCALE, MOON_SCALE]}
				position={[-956 * MOON_SCALE, 360 * MOON_SCALE, 0]}
			>
				{geos.map((g) => (
					<mesh key={g.uuid} geometry={g}>
						<primitive object={mat} attach="material" />
					</mesh>
				))}
			</group>
			{!glow && (
				<sprite scale={[4, 4, 1]} position={[0, 0, -0.1]}>
					<spriteMaterial
						ref={halo}
						map={haloMap}
						transparent
						opacity={0}
						depthWrite={false}
						toneMapped={false}
					/>
				</sprite>
			)}
		</group>
	);
}

/** Soft round dot, so stars are round and not square points. */
function dotTexture() {
	const c = document.createElement("canvas");
	c.width = c.height = 32;
	const g = c.getContext("2d");
	if (g) {
		const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
		grad.addColorStop(0, "rgba(255,255,255,1)");
		grad.addColorStop(0.5, "rgba(255,255,255,0.8)");
		grad.addColorStop(1, "rgba(255,255,255,0)");
		g.fillStyle = grad;
		g.fillRect(0, 0, 32, 32);
	}
	return new THREE.CanvasTexture(c);
}

function Stars({
	progress,
	glow,
}: {
	progress: MotionValue<number>;
	glow: boolean;
}) {
	const sets = useRef<(THREE.PointsMaterial | null)[]>([]);
	// two sets, twinkling out of step; spread across both halves, behind the jars
	const geos = useMemo(() => {
		const r = rng(42);
		return [0, 1].map(() => {
			const pos = new Float32Array((STAR_COUNT / 2) * 3);
			for (let i = 0; i < STAR_COUNT / 2; i++) {
				pos[i * 3] = (r() - 0.5) * 22;
				pos[i * 3 + 1] = (r() - 0.35) * 11;
				pos[i * 3 + 2] = -7 - r() * 2;
			}
			const g = new THREE.BufferGeometry();
			g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
			return g;
		});
	}, []);
	useFrame((state) => {
		const n = timeline(progress.get()).night;
		const t = state.clock.elapsedTime;
		sets.current.forEach((m, k) => {
			if (m) m.opacity = n * (0.55 + 0.45 * Math.sin(t * 0.9 + k * Math.PI));
		});
	});
	const level = glow ? GLOW : 1;
	const dot = useMemo(dotTexture, []);
	return (
		<>
			{geos.map((g, k) => (
				<points key={g.uuid} geometry={g}>
					<pointsMaterial
						ref={(m) => {
							sets.current[k] = m;
						}}
						color={new THREE.Color().setRGB(level, level, level)}
						map={dot}
						alphaTest={0.01}
						size={0.25}
						sizeAttenuation
						toneMapped={false}
						transparent
						opacity={0}
						depthWrite={false}
					/>
				</points>
			))}
		</>
	);
}

/**
 * Night sky (moon + stars) behind the jars. High tier: bloom (glow on moon and stars only).
 * Low tier: a soft sprite behind the moon, no postprocessing. Not rendered under reduced
 * motion or without WebGL (D-69).
 */
export function Sky({
	progress,
	tier,
}: {
	progress: MotionValue<number>;
	tier: Exclude<Tier, "none">;
}) {
	const glow = tier === "high";
	return (
		<>
			<Moon progress={progress} glow={glow} />
			<Stars progress={progress} glow={glow} />
			{glow && (
				<EffectComposer multisampling={0}>
					<Bloom
						mipmapBlur
						luminanceThreshold={1}
						intensity={0.9}
						radius={0.7}
					/>
				</EffectComposer>
			)}
		</>
	);
}
