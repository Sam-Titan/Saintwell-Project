// Phase 2 temporary viewer: all 4 looks, front (top row) and back (bottom row). Removed in Phase 3.
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { Gummies } from "../three/Gummies";
import { LabeledJar } from "../three/LabeledJar";
import { looks } from "../three/looks";

const COL = 2.5;
const ROW = 3.3;

function gummyTransforms(): THREE.Matrix4[] {
	const out: THREE.Matrix4[] = [];
	for (let i = 0; i < 12; i++) {
		const e = new THREE.Euler(i * 0.7, i * 1.3, i * 0.4);
		const q = new THREE.Quaternion().setFromEuler(e);
		out.push(
			new THREE.Matrix4().compose(
				new THREE.Vector3((i - 5.5) * 0.4, 0, 0),
				q,
				new THREE.Vector3(1, 1, 1),
			),
		);
	}
	return out;
}

export default function JarLookViewer() {
	const transforms = useMemo(gummyTransforms, []);
	return (
		<div className="aspect-[16/11] w-full rounded bg-cream outline outline-olive/20">
			<Canvas
				camera={{ position: [0, 0, 16], fov: 30 }}
				aria-label="3D jars: green A, green B, pink A, pink B, front view (top row) and back view (bottom row)"
				role="img"
			>
				<ambientLight intensity={1.1} />
				<directionalLight position={[4, 6, 8]} intensity={2.2} />
				<directionalLight position={[-4, 3, -8]} intensity={1.4} />
				<Suspense fallback={null}>
					<group position={[0, 0.5, 0]}>
						{[0, 1].map((row) =>
							looks.map((look, i) => (
								<LabeledJar
									key={`${row}-${look.colour}-${look.label}`}
									colour={look.colour}
									label={look.label}
									position={[(i - 1.5) * COL, ROW / 2 - row * ROW - 1.2, 0]}
									rotation={[0, row === 0 ? 0 : Math.PI, 0]}
								/>
							)),
						)}
						<group position={[-2.5, -4.4, 0]}>
							<Gummies colour="green" transforms={transforms} />
						</group>
						<group position={[2.5, -4.4, 0]}>
							<Gummies colour="pink" transforms={transforms} />
						</group>
					</group>
				</Suspense>
			</Canvas>
		</div>
	);
}
