import { useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { copy } from "../content/copy";
import type { Layout } from "./poses";
import { timelineAt } from "./sceneTime";
import { COLOURS } from "./storyTimeline";

/** Distance behind the jars where the word hangs (world units from the camera). */
const DISTANCE = 30;

/**
 * The giant faint "SAINTWELL" behind each scene, drawn in the scene (D-94) because the canvas is opaque now.
 * A canvas texture (Poppins 700 from the page's own font file, no network) on a plane that fills the view.
 * Olive on the light scenes, white on the dark ones; fades out for the Numbers (D-79).
 */
export function WordPlane({
	layout,
	progress,
}: {
	layout: Layout;
	progress: MotionValue<number>;
}) {
	const size = useThree((s) => s.size);
	const invalidate = useThree((s) => s.invalidate);
	const aspect = size.width / size.height;
	const mesh = useRef<THREE.Mesh>(null);
	const material = useRef<THREE.MeshBasicMaterial>(null);
	const texture = useMemo(() => {
		const c = document.createElement("canvas");
		c.width = 2048;
		c.height = Math.round(2048 / aspect);
		const t = new THREE.CanvasTexture(c);
		t.colorSpace = THREE.SRGBColorSpace;
		return t;
	}, [aspect]);
	useEffect(() => {
		let live = true;
		const draw = () => {
			const c = texture.image as HTMLCanvasElement;
			const g = c.getContext("2d");
			if (!g || !live) return;
			g.clearRect(0, 0, c.width, c.height);
			const mobile = layout === "mobile";
			g.fillStyle = "#fff";
			g.textAlign = "center";
			g.textBaseline = "middle";
			g.font = `700 ${(mobile ? 0.27 : 0.22) * c.width}px Poppins, sans-serif`;
			g.fillText(copy.brand, c.width / 2, c.height * (mobile ? 0.58 : 0.44));
			texture.needsUpdate = true;
			invalidate();
		};
		draw();
		// the Poppins file may still be loading: draw again when it is there
		document.fonts?.load("700 100px Poppins").then(draw);
		return () => {
			live = false;
			texture.dispose();
		};
	}, [texture, layout, invalidate]);

	const olive = useMemo(
		() => new THREE.Color(...COLOURS.olive.map((c) => c / 255)),
		[],
	);
	const white = useMemo(() => new THREE.Color("#ffffff"), []);

	useFrame((state) => {
		const m = mesh.current;
		const mat = material.current;
		if (!m || !mat) return;
		const cam = state.camera as THREE.PerspectiveCamera;
		const tl = timelineAt(progress.get());
		// face the camera, fill the view at DISTANCE
		const h = 2 * DISTANCE * Math.tan((cam.fov * Math.PI) / 360);
		m.quaternion.copy(cam.quaternion);
		m.position
			.set(0, 0, -DISTANCE)
			.applyQuaternion(cam.quaternion)
			.add(cam.position);
		m.scale.set(h * cam.aspect, h, 1);
		mat.color.copy(olive).lerp(white, tl.dark);
		mat.opacity = (0.07 * (1 - tl.dark) + 0.06 * tl.dark) * tl.word;
	});
	return (
		<mesh ref={mesh} renderOrder={-10}>
			<planeGeometry args={[1, 1]} />
			<meshBasicMaterial
				ref={material}
				map={texture}
				transparent
				depthWrite={false}
				toneMapped={false}
			/>
		</mesh>
	);
}
