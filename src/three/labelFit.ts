import * as THREE from "three";

/**
 * Label fit: the label band mesh has a fixed height and its UV u runs 0..1 around the jar
 * (u = 0.5 is the front centre, the seam is at the back). A label of aspect ratio `aspect`
 * (width / height) covers `coverage` of the circle. We never stretch the label: we only change
 * texture repeat/offset so the label is centred at the front, and mask out the uncovered part.
 */

/** Fraction of the circle a label covers (1 = full wrap), for a band of `height` at `radius`. */
export function labelCoverage(
	aspect: number,
	height: number,
	radius: number,
): number {
	return Math.min(1, (aspect * height) / (2 * Math.PI * radius));
}

/** Texture repeat/offset (x only) that centres a label of the given coverage at u = 0.5. */
export function labelTransform(coverage: number) {
	return { repeatX: 1 / coverage, offsetX: 0.5 - 0.5 / coverage };
}

/** Mask texture transform (3-texel mask: black, white, black) matching `labelTransform`. */
export function maskTransform(coverage: number) {
	return {
		repeatX: 1 / (3 * coverage),
		offsetX: (1.5 - 0.5 / coverage) / 3,
	};
}

/** Radius and height of the label band, read from the (quantised) mesh incl. its node scale. */
export function labelBandSize(mesh: THREE.Mesh) {
	mesh.geometry.computeBoundingBox();
	const box = mesh.geometry.boundingBox as THREE.Box3;
	return {
		radius: box.max.x * mesh.scale.x,
		height: (box.max.y - box.min.y) * mesh.scale.y,
	};
}

/** 3x1 mask: only the middle texel is opaque. Used as alphaMap (green channel). */
export function createLabelMask(): THREE.DataTexture {
	const data = new Uint8Array([0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255]);
	const mask = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
	mask.magFilter = THREE.NearestFilter;
	mask.minFilter = THREE.NearestFilter;
	mask.wrapS = mask.wrapT = THREE.ClampToEdgeWrapping;
	mask.generateMipmaps = false;
	mask.needsUpdate = true;
	return mask;
}

/** Apply the per-label texture settings to a label material. Safe to call again for another label. */
export function applyLabelFit(
	material: THREE.MeshStandardMaterial,
	map: THREE.Texture,
	mask: THREE.DataTexture,
	band: { radius: number; height: number },
) {
	const image = map.image as { width: number; height: number };
	const coverage = labelCoverage(
		image.width / image.height,
		band.height,
		band.radius,
	);
	const t = labelTransform(coverage);
	// Same orientation as glTF textures (the mesh UVs come from a glTF file)
	map.flipY = false;
	map.colorSpace = THREE.SRGBColorSpace;
	map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
	map.repeat.set(t.repeatX, 1);
	map.offset.set(t.offsetX, 0);
	map.needsUpdate = true;
	const m = maskTransform(coverage);
	mask.repeat.set(m.repeatX, 1);
	mask.offset.set(m.offsetX, 0);
	material.map = map;
	material.alphaMap = mask;
	material.alphaTest = 0.5;
	material.color.set("#ffffff");
	material.needsUpdate = true;
	return coverage;
}
