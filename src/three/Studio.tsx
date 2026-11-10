import { Environment, Lightformer } from "@react-three/drei";

/**
 * Soft studio light, no network: the Environment is built from Lightformer panels
 * (no HDR preset files, D-48), plus a few plain lights.
 */
export function Studio() {
	return (
		<>
			<ambientLight intensity={0.8} />
			<directionalLight position={[3, 6, 8]} intensity={2.2} />
			<directionalLight position={[-5, 2, -6]} intensity={0.6} />
			<Environment resolution={256} frames={1}>
				{/* big soft key from above and the front */}
				<Lightformer
					form="rect"
					intensity={2.2}
					color="#ffffff"
					position={[0, 6, 5]}
					rotation={[Math.PI / 2.4, 0, 0]}
					scale={[10, 6, 1]}
				/>
				{/* two tall side strips */}
				<Lightformer
					form="rect"
					intensity={1.6}
					color="#ffffff"
					position={[-6, 1.5, 2]}
					rotation={[0, Math.PI / 2.5, 0]}
					scale={[2, 8, 1]}
				/>
				<Lightformer
					form="rect"
					intensity={1.6}
					color="#ffffff"
					position={[6, 1.5, 2]}
					rotation={[0, -Math.PI / 2.5, 0]}
					scale={[2, 8, 1]}
				/>
				{/* dim warm rim from behind */}
				<Lightformer
					form="rect"
					intensity={0.8}
					color="#f8f5ec"
					position={[0, 2, -7]}
					scale={[10, 4, 1]}
				/>
				{/* low fill so the bottom is not black */}
				<Lightformer
					form="rect"
					intensity={0.5}
					color="#f8f5ec"
					position={[0, -4, 4]}
					rotation={[-Math.PI / 3, 0, 0]}
					scale={[8, 3, 1]}
				/>
			</Environment>
		</>
	);
}
