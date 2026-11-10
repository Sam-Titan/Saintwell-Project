import { copy } from "../content/copy";

/** About and Contact: stubs for the nav links until Phase 5 fills them (real h2 + placeholder line). */
export default function Stubs() {
	return (
		<>
			<section
				id="about"
				aria-labelledby="about-h"
				className="bg-cream px-6 py-24 text-center text-olive md:px-16"
			>
				<h2 id="about-h" className="font-bold font-poppins text-3xl">
					{copy.about.heading}
				</h2>
				<p className="mt-4 font-poppins">{copy.about.text}</p>
			</section>
			<section
				id="contact"
				aria-labelledby="contact-h"
				className="bg-cream px-6 pt-8 pb-24 text-center text-olive md:px-16"
			>
				<h2 id="contact-h" className="font-bold font-poppins text-3xl">
					{copy.contact.heading}
				</h2>
				<p className="mt-4 font-poppins">{copy.contact.text}</p>
			</section>
		</>
	);
}
