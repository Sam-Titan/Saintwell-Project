// Phase 1 test page. Removed in a later phase.
import { copy } from "../content/copy";
import { useJar } from "../theme/JarContext";
import { themes } from "../theme/tokens";

const labels = ["green-a", "green-b", "pink-a", "pink-b"] as const;
const jars = ["green-a", "green-b", "pink-a", "pink-b"] as const;

const swatches = [
	["Dark olive", "#3e4a2f"],
	["Sage", "#9ba56b"],
	["Maroon", "#6a1f2b"],
	["Pink", "#d79aa8"],
	["Light pink", "#e7c4cc"],
	["Blush", "#f9eff2"],
	["Cream", "#f8f5ec"],
	["White", "#ffffff"],
] as const;

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="mb-12">
			<h2 className="mb-4 font-poppins text-xl font-bold text-olive">
				{title}
			</h2>
			{children}
		</section>
	);
}

export default function AssetTestPage() {
	const { colour, label } = useJar();
	return (
		<main className="mx-auto max-w-5xl bg-cream p-6">
			<h1 className="mb-2 font-poppins text-4xl font-bold tracking-widest text-olive">
				SAINTWELL
			</h1>
			<p className="mb-10 font-poppins text-olive">
				Phase 1 asset test page. Jar state: {colour} + label {label}. Theme
				night colour: {themes[colour].night}.
			</p>

			<Section title="Logos">
				<div className="grid gap-4 sm:grid-cols-3">
					<div className="rounded bg-cream p-4 outline outline-olive/20">
						<img
							src="/images/logo-green-wide.svg"
							alt="SaintWell logo, green, wide"
						/>
						<p className="mt-2 text-sm">Green wide</p>
					</div>
					<div className="rounded bg-cream p-4 outline outline-olive/20">
						<img
							src="/images/logo-pink-wide.svg"
							alt="SaintWell logo, pink, wide"
						/>
						<p className="mt-2 text-sm">Pink wide</p>
					</div>
					<div className="rounded bg-olive p-4">
						<img
							className="mx-auto h-40"
							src="/images/logo-stacked.svg"
							alt="SaintWell logo, stacked"
						/>
						<p className="mt-2 text-sm text-white">Stacked (on olive)</p>
					</div>
				</div>
			</Section>

			<Section title="Labels (2048 px shown; 1024 px also exported)">
				<div className="grid gap-4">
					{labels.map((name) => (
						<figure key={name}>
							<img
								className="w-full outline outline-olive/20"
								src={`/textures/labels/${name}-2048.webp`}
								alt={`Label ${name}`}
							/>
							<figcaption className="text-sm">{name}</figcaption>
						</figure>
					))}
				</div>
			</Section>

			<Section title="Fallback jars">
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
					{jars.map((name) => (
						<figure key={name}>
							<img src={`/images/jar-${name}.webp`} alt={`Jar ${name}`} />
							<figcaption className="text-sm">{name}</figcaption>
						</figure>
					))}
				</div>
			</Section>

			<Section title="Colours">
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					{swatches.map(([name, hex]) => (
						<div
							key={hex}
							className="flex h-20 items-end rounded p-2 text-sm outline outline-olive/20"
							style={{
								background: hex,
								color:
									hex === "#f8f5ec" ||
									hex === "#ffffff" ||
									hex === "#f9eff2" ||
									hex === "#e7c4cc" ||
									hex === "#9ba56b" ||
									hex === "#d79aa8"
										? "#3e4a2f"
										: "#ffffff",
							}}
						>
							{name} {hex}
						</div>
					))}
				</div>
			</Section>

			<Section title="Fonts">
				<div className="space-y-2 text-olive">
					<p className="font-poppins font-normal">
						Poppins 400 — {copy.product.description}
					</p>
					<p className="font-poppins font-medium">
						Poppins 500 — {copy.product.subtitle}
					</p>
					<p className="font-poppins font-bold">
						Poppins 700 — {copy.product.name}
					</p>
					<p className="font-lora font-bold">Lora 700 — {copy.product.name}</p>
					<p className="font-lora font-bold italic">
						Lora 700 italic — {copy.product.name}
					</p>
					<p className="font-inter font-normal">
						Inter 400 — {copy.product.description}
					</p>
					<p className="font-inter font-medium">
						Inter 500 — {copy.product.subtitle}
					</p>
					<p className="font-inter font-bold">
						Inter 700 — {copy.product.name}
					</p>
				</div>
			</Section>
		</main>
	);
}
