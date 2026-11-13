#!/usr/bin/env node
/**
 * Draw the Fullerene logo: a C60 fullerene as a flat ball-and-stick wireframe,
 * seen down one of its pentagons. All 60 atoms and 90 bonds are drawn, the nearer
 * ones heavier and darker.
 *
 * Usage (from anywhere):
 * 	node images/logo.mjs
 *
 * Writes logo.svg (the molecule), logo-wordmark.svg (with the name) and social.svg
 * (the link preview card; render it to social.png, see the README) next to this
 * script. Colours come from palette.json and follow the viewer's light or dark
 * theme.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PALETTE = JSON.parse(readFileSync(join(HERE, "palette.json"), "utf-8")).semantic;

const PHI = (1 + Math.sqrt(5)) / 2;
const SIZE = 256; // logo width and height in pixels
const TIP = 0.14; // tip towards the viewer, in radians, so the back pentagon shows
const DEPTHS = 3; // depth bands, back to front, each with its own colour

// ==== Geometry ================================================================
/** Every sign combination of a point, without duplicates for zero coordinates. */
function signs([x, y, z]) {
	const out = [];
	for (const sx of x ? [1, -1] : [1]) {
		for (const sy of y ? [1, -1] : [1]) {
			for (const sz of z ? [1, -1] : [1]) {
				out.push([sx * x, sy * y, sz * z]);
			}
		}
	}
	return out;
}

/** The point and its two cyclic shifts, with every sign combination. */
const cyclic = (p) => [p, [p[2], p[0], p[1]], [p[1], p[2], p[0]]].flatMap(signs);

// The 60 atoms: cyclic permutations of (0, ±1, ±3φ), (±1, ±(2 + φ), ±2φ) and
// (±φ, ±2, ±(2φ + 1)); bonded atoms are 2 apart
const ATOMS = [[0, 1, 3 * PHI], [1, 2 + PHI, 2 * PHI], [PHI, 2, 2 * PHI + 1]].flatMap(cyclic);
const BONDS = ATOMS.flatMap((a, i) => ATOMS.slice(i + 1)
	.filter((b) => Math.abs(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) - 2) < 1e-6)
	.map((b) => [a, b]));

/** Rotate a point about the x axis. */
const turnX = ([x, y, z], a) => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
/** Rotate a point about the z axis (the line of sight). */
const turnZ = ([x, y, z], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z];

// Look down the pentagon axis (0, 1, φ), then turn about the line of sight so a
// corner of the front pentagon points down (SVG y grows downwards)
const ALIGN = Math.atan(1 / PHI);
const front = ATOMS.map((a) => turnX(a, ALIGN)).reduce((best, p) => (p[2] > best[2] ? p : best));
const SPIN = Math.PI / 2 - Math.atan2(front[1], front[0]);

/** A point as seen in the logo: aligned, spun, then tipped towards the viewer. */
const view = (a) => turnX(turnZ(turnX(a, ALIGN), SPIN), TIP);

// ==== Drawing =================================================================
/** CSS custom properties for one theme ("light" or "dark"): ink for the name and
 * the front of the molecule, fading to the back. */
function themeVars(theme) {
	const { fg } = PALETTE[theme];
	const vars = { "d0": fg.subtle, "d1": fg.muted, "d2": fg.primary, "ink": fg.primary,
		"bg": theme === "light" ? PALETTE.light.bg.primary : PALETTE.dark.bg.muted };
	return Object.entries(vars).map(([name, value]) => `--${name}: ${value};`).join(" ");
}

const STYLE = `
	<style>
		svg { ${themeVars("light")} }
		@media (prefers-color-scheme: dark) {
			svg { ${themeVars("dark")} }
		}
		${[...Array(DEPTHS).keys()].map((d) => `.d${d} { stroke: var(--d${d}); fill: var(--d${d}); }`).join("\n\t\t")}
		line { stroke-linecap: round; }
		.name { font-family: "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
			font-size: 112px; font-weight: 700; letter-spacing: 1px; fill: var(--ink); }
		.tagline { font-family: "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
			font-size: 34px; fill: var(--d1); }
	</style>
`;

/** The molecule's bonds and atoms, back to front, centred on (cx, cy). */
function molecule(cx, cy, radius) {
	const outer = Math.hypot(...ATOMS[0]);
	const scale = radius / outer;
	// Depth from 0 (back) to 1 (front), and its band
	const depth = (z) => (z / outer + 1) / 2;
	const band = (t) => Math.min(DEPTHS - 1, Math.floor(t * DEPTHS));
	const at = ([x, y]) => [(cx + x * scale).toFixed(1), (cy + y * scale).toFixed(1)];
	const shapes = [
		...BONDS.map(([a, b]) => {
			const [p, q] = [view(a), view(b)];
			const t = depth((p[2] + q[2]) / 2);
			const [[x1, y1], [x2, y2]] = [at(p), at(q)];
			const width = (1 + 2 * t).toFixed(1);
			return [t, `<line class="d${band(t)}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${width}"/>`];
		}),
		...ATOMS.map((a) => {
			const p = view(a);
			const t = depth(p[2]);
			const [x, y] = at(p);
			// Atoms just after their bonds at the same depth, so they sit on top
			return [t + 1e-3, `<circle class="d${band(t)}" cx="${x}" cy="${y}" r="${(2 + 3 * t).toFixed(1)}"/>`];
		}),
	];
	return shapes.sort(([a], [b]) => a - b).map(([, shape]) => shape).join("\n");
}

const svg = (width, height, body, label) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" `
	+ `height="${height}" role="img" aria-label="${label}">${STYLE}\n${body}\n</svg>\n`;

function main() {
	const half = SIZE / 2;
	const images = [
		["logo.svg", svg(SIZE, SIZE, molecule(half, half, half - 10), "Fullerene logo")],
		["logo-wordmark.svg", svg(Math.round(3.15 * SIZE), SIZE,
			`${molecule(half, half, half - 10)}\n<text class="name" x="${SIZE + 24}" y="${half + 40}">Fullerene</text>`,
			"Fullerene")],
		// Link preview card (Open Graph): 1200x630, rendered to social.png
		["social.svg", svg(1200, 630,
			`<rect width="1200" height="630" fill="var(--bg)"/>\n${molecule(290, 315, 180)}\n`
			+ `<text class="name" x="520" y="320">Fullerene</text>\n`
			+ `<text class="tagline" x="524" y="385">A keyboard layout for split keyboards</text>`,
			"Fullerene: a keyboard layout for split keyboards")],
	];
	for (const [name, content] of images) {
		const path = join(HERE, name);
		writeFileSync(path, content, "utf-8");
		console.log(`logo: wrote ${path}`);
	}
}

main();
