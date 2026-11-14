#!/usr/bin/env node
/**
 * Draw the Fullerene layout as SVG: on a generic split keyboard, on specific split
 * keyboards, and on an ANSI keyboard.
 *
 * Usage (from anywhere):
 *     node images/generate.mjs
 *
 * Writes fullerene.svg, fullerene-ansi.svg and keyboards/<name>.svg next to this
 * script. Keys are colored by finger, each of the eight in its own hue, with
 * neighbouring hues for the same finger on either hand; the images follow the
 * viewer's light or dark theme. Keyboard shapes are drawn from their key positions and are approximate.
 */

// ==== Imports ================================================================
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ==== Constants ==============================================================
const HERE = dirname(fileURLToPath(import.meta.url));

// Fullerene in optimizer order: top row columns 2-5 and 8-11, home and bottom rows
// columns 0-5 and 8-13 (columns 0 and 13 are the outer pinky keys)
const LAYOUT = "vdljkfouqcstnwbhaei'zygmrx.p,/-;";
const ORDER = [
	...[2, 3, 4, 5, 8, 9, 10, 11].map((c) => [1, c]),
	...[2, 3].flatMap((r) => [0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13].map((c) => [r, c])),
];
// "row,column" -> character
const LETTER = Object.fromEntries(ORDER.map(([r, c], i) => [`${r},${c}`, LAYOUT[i]]));
const NUMBER = { 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 8: "6", 9: "7", 10: "8", 11: "9", 12: "0" };
// Finger per column: 0 pinky, 1 ring, 2 middle, 3 index
const FINGER = { 0: 0, 1: 0, 2: 1, 3: 2, 4: 3, 5: 3, 8: 3, 9: 3, 10: 2, 11: 1, 12: 0, 13: 0 };
// Key color per column: the hand ("l" or "r") and the finger
const COLOR = Object.fromEntries(Object.entries(FINGER).map(([c, f]) => [c, `${+c < 7 ? "l" : "r"}${f}`]));

// ANSI rows: [x offset in keys, keys]; fingers follow standard touch typing
const ANSI = [
	[0, "1234567890[]"],
	[0.5, "qvdljkfou;z="],
	[0.75, "cstnwbhaei'"],
	[1.25, "ygmrx.p,/-"],
];
const ANSI_COLOR = ["l0", "l1", "l2", "l3", "l3", "r3", "r3", "r2", "r1", "r0", "r0", "r0"]; // by position in the row

// Shifted symbols shown in the key's corner
const SHIFTED = {
	".": ">", ",": "<", "/": "?", "-": "_", ";": ":", "'": '"', "[": "{", "]": "}",
	"=": "+", 1: "!", 2: "@", 3: "#", 4: "$", 5: "%", 6: "^", 7: "&", 8: "*", 9: "(", 0: ")",
};
const HOME = new Set("cstnwbhaei"); // home row letters, drawn bold
const RARE = new Set("qz';"); // outer pinky keys

const U = 64; // key pitch in pixels
const GAP = 6; // space between neighbouring keys
const FINGERS = ["Pinky", "Ring", "Middle", "Index"];

// Colors from a palette's semantic tokens (palette.json, light and dark), so any
// palette with the same tokens drops in: bg, fg and border for the neutrals, and
// per color family subtle (key fill), fg (key text) and focusRing (key outline)
const PALETTE = JSON.parse(readFileSync(join(HERE, "palette.json"), "utf-8")).semantic;
// Pinky, ring, middle, index per hand: each finger in its own hue, and the same
// finger on the other hand in a neighbouring one
const FINGER_HUES = {
	l: ["pink", "yellow", "green", "blue"],
	r: ["red", "orange", "teal", "purple"],
};

/** CSS custom properties for one theme ("light" or "dark"). */
// Neutral surfaces per theme, as [group, token] in the palette. Dark mode sits
// one step up from the palette's near-black primary, which is too harsh
const NEUTRALS = {
	light: { "bg": ["bg", "primary"], "case": ["bg", "muted"], "blank": ["bg", "subtle"], "blank-s": ["border", "primary"] },
	dark: { "bg": ["bg", "muted"], "case": ["bg", "emphasized"], "blank": ["bg", "muted"], "blank-s": ["border", "emphasized"] },
};

function themeVars(theme) {
	const tokens = PALETTE[theme];
	const vars = {
		"ink": tokens.fg.primary,
		"ink-2": tokens.fg.muted,
	};
	for (const [name, [group, token]] of Object.entries(NEUTRALS[theme])) {
		vars[name] = tokens[group][token];
	}
	for (const [hand, hues] of Object.entries(FINGER_HUES)) {
		hues.forEach((hue, i) => {
			const family = tokens[hue] ?? tokens[{ purple: "violet" }[hue]]; // Open Color: violet
			vars[`f${hand}${i}`] = family.subtle;
			vars[`f${hand}${i}s`] = family.focusRing;
			vars[`f${hand}${i}t`] = family.fg;
		});
	}
	return Object.entries(vars).map(([name, value]) => `--${name}: ${value};`).join(" ");
}

const STYLE = `
	<style>
		svg { ${themeVars("light")} }
		@media (prefers-color-scheme: dark) {
			svg { ${themeVars("dark")} }
		}

		text { font-family: "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif; fill: var(--ink); }
		.title { font-size: 30px; font-weight: 700; letter-spacing: .5px; }
		.sub { font-size: 14px; fill: var(--ink-2); }
		.key { font-size: 24px; text-anchor: middle; }
		.home { font-weight: 700; }
		.rare { fill: var(--ink-2); }
		.shift { font-size: 12px; fill: var(--ink-2); text-anchor: end; }
		.num { font-size: 18px; text-anchor: middle; fill: var(--ink-2); }
		.legend { font-size: 13px; fill: var(--ink-2); }
		.case { fill: var(--case); stroke: var(--case); stroke-width: 34; stroke-linejoin: round; }
		.blank { fill: var(--blank); stroke: var(--blank-s); stroke-width: 1.5; }
	</style>
`;

// ==== Keyboards ==============================================================

// Each keyboard lists its left half as keys {x, y, w, h, angle, slot} in key units,
// from the half's top left; angle turns the key about its centre. slot is
// {kind: "letter", row, col} for the Fullerene key at that optimizer position,
// {kind: "number", col} for a number row key, or null for a key without a letter.
// The right half is the mirror image.

const key = (x, y, w = 1, h = 1, angle = 0, slot = null) => ({ x, y, w, h, angle, slot });

/**
 * A column-staggered block: stagger[c] moves column c down; column 0 is the
 * outer pinky column. Row 0 is the number row, 1-3 the letter rows; other rows
 * get keys without letters.
 */
function columns(stagger, rows, widths = {}) {
	const keys = [];
	const first = Math.min(...rows);
	let x = 0;
	stagger.forEach((offset, col) => {
		const w = widths[col] ?? 1;
		for (const row of rows) {
			let slot = null;
			if (row === 0) {
				slot = { kind: "number", col };
			} else if (`${row},${col}` in LETTER) {
				slot = { kind: "letter", row, col };
			}
			keys.push(key(x, row - first + offset, w, 1, 0, slot));
		}
		x += w;
	});
	return keys;
}

/** Thumb keys [x, y, w, h] on a grid turned by angle about origin. */
function cluster([ox, oy], angle, grid) {
	const a = (angle * Math.PI) / 180;
	return grid.map(([x, y, w, h]) => {
		const cx = x + w / 2;
		const cy = y + h / 2;
		const rx = ox + cx * Math.cos(a) - cy * Math.sin(a);
		const ry = oy + cx * Math.sin(a) + cy * Math.cos(a);
		return key(rx - w / 2, ry - h / 2, w, h, angle);
	});
}

/** Thumb keys on an arc: [centre x, centre y, angle] each. */
const arc = (points) => points.map(([x, y, angle]) => key(x - 0.5, y - 0.5, 1, 1, angle));

const range = (start, end) => Array.from({ length: end - start }, (_, i) => start + i);

// Thumb cluster of the ErgoDox and the Advantage360: two keys on top, two tall keys
// and two stacked keys below
const THUMB_GRID = [[1, 0, 1, 1], [2, 0, 1, 1], [0, 1, 1, 2], [1, 1, 1, 2], [2, 1, 1, 1], [2, 2, 1, 1]];

function ergodoxEz() {
	const stagger = [0.375, 0.375, 0.125, 0, 0.125, 0.25];
	return [
		...columns(stagger, range(0, 4), { 0: 1.5 }),
		// Inner column: one key on the number row, then two 1.5u-tall keys
		key(6.5, 0.25), key(6.5, 1.25, 1, 1.5), key(6.5, 2.75, 1, 1.5),
		// Bottom row: under the outer column's inner half, then under columns 1-4
		key(0.5, 4 + stagger[0]),
		...range(1, 5).map((c) => key(0.5 + c, 4 + stagger[c])),
		...cluster([6.9, 3.4], 25, THUMB_GRID),
	];
}

function advantage360() {
	const stagger = [0.5, 0.5, 0.2, 0, 0.15, 0.3];
	return [
		...columns(stagger, range(0, 4), { 0: 1.25 }),
		...range(0, 3).map((r) => key(6.25, 0.45 + r)), // inner column
		key(0, 4 + stagger[0], 1.25), // bottom row
		...range(1, 5).map((i) => key(0.25 + i, 4 + stagger[i])),
		...cluster([6.9, 3.5], 20, THUMB_GRID),
	];
}

function go60() {
	const stagger = [0.5, 0.5, 0.2, 0, 0.15, 0.25];
	return [
		...columns(stagger, range(0, 4)),
		...[2, 3, 4].map((c) => key(c, 4 + stagger[c])), // bottom row
		...arc([[5.6, 4.85, 10], [6.65, 5.12, 20], [7.62, 5.6, 30]]),
	];
}

function imprint() {
	// Made to measure: the full 5x6 (function, number and letter rows) with Dual Arcs
	// thumbs
	const stagger = [0.6, 0.55, 0.2, 0, 0.15, 0.3];
	return [
		...columns(stagger, range(-1, 4)),
		...arc([[5.4, 5.95, 15], [6.45, 6.22, 25], [7.42, 6.72, 35]]),
		...arc([[5.05, 7.02, 15], [6.08, 7.3, 25], [7.02, 7.82, 35]]),
	];
}

/** The letter rows only, for the README: no case, no extra keys. */
const generic = () => columns([0.45, 0.45, 0.15, 0, 0.2, 0.3], range(1, 4));

const KEYBOARDS = [
	// [file name, name, subtitle, keys]
	["ergodox-ez", "ErgoDox EZ", "The outer pinky keys on the 1.5u outer column", ergodoxEz],
	["advantage360", "Kinesis Advantage360",
		"Key wells drawn flat · the outer pinky keys on the 1.25u outer column", advantage360],
	["go60", "MoErgo Go60", "60 keys: number row, three letter rows, bottom row and thumb arc", go60],
	["imprint", "Cyboard Imprint",
		"Made to measure, drawn flat · full 5x6 with Dual Arcs thumbs", imprint],
];

// ==== Drawing ================================================================
const esc = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const f1 = (v) => v.toFixed(1);

/** The corners of a key in pixels, turned about its centre. */
function corners(x, y, w, h, angle) {
	const cx = x + w / 2;
	const cy = y + h / 2;
	const a = (angle * Math.PI) / 180;
	return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([dx, dy]) => [
		cx + dx * Math.cos(a) - dy * Math.sin(a),
		cy + dx * Math.sin(a) + dy * Math.cos(a),
	]);
}

/** Convex hull of points (monotone chain), for the case outline. */
function hull(points) {
	const sorted = [...new Map(points.map((p) => [p.join(), p])).values()]
		.sort(([ax, ay], [bx, by]) => ax - bx || ay - by);
	const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
	const half = (seq) => {
		const out = [];
		for (const p of seq) {
			while (out.length >= 2 && cross(out.at(-2), out.at(-1), p) <= 0) {
				out.pop();
			}
			out.push(p);
		}
		return out;
	};
	const lower = half(sorted);
	const upper = half([...sorted].reverse());
	return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** One key in pixels: colored (a COLOR value) with its character (letters in capitals), or blank with a label. */
function keycap(x, y, w, h, { angle = 0, ch = null, color = null, label = "" } = {}) {
	const cx = x + w / 2;
	const cy = y + h / 2;
	const turn = angle ? ` transform="rotate(${f1(angle)} ${f1(cx)} ${f1(cy)})"` : "";
	const rect = `x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="9"`;
	if (ch === null) {
		const out = [`<rect class="blank" ${rect}${turn}/>`];
		if (label) {
			out.push(`<text class="num" x="${f1(cx)}" y="${f1(cy + 6)}">${esc(label)}</text>`);
		}
		return out.join("\n");
	}
	const cls = "key" + (HOME.has(ch) ? " home" : "") + (RARE.has(ch) ? " rare" : "");
	const out = [
		`<rect ${rect} fill="var(--f${color})" stroke="var(--f${color}s)" `
		+ `stroke-width="${HOME.has(ch) ? 2.5 : 1.5}"${turn}/>`,
		`<text class="${cls}" x="${f1(cx)}" y="${f1(cy + 9)}" style="fill: var(--f${color}t)">${esc(ch.toUpperCase())}</text>`,
	];
	if (ch in SHIFTED) {
		out.push(`<text class="shift" x="${f1(x + w - 7)}" y="${f1(y + 17)}" style="fill: var(--f${color}t)">${esc(SHIFTED[ch])}</text>`);
	}
	return out.join("\n");
}

/** Two swatches per finger, left and right hand. */
function legend(x, y) {
	let lx = x;
	return FINGERS.flatMap((name, i) => {
		const out = [`l${i}`, `r${i}`].map((color) => {
			const rect = `<rect x="${lx}" y="${y - 12}" width="16" height="16" rx="4" fill="var(--f${color})" `
				+ `stroke="var(--f${color}s)" stroke-width="1.5"/>`;
			lx += 20;
			return rect;
		});
		out.push(`<text class="legend" x="${lx + 2}" y="${y + 1}">${name}</text>`);
		lx += 72;
		return out;
	}).join("\n");
}

const svg = (width, height, body, label) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" `
	+ `height="${height}" role="img" aria-label="${label}">${STYLE}\n`
	+ `<rect width="${width}" height="${height}" rx="18" fill="var(--bg)"/>\n${body}\n</svg>\n`;

/** Both halves of a split keyboard: the left half's keys and their mirror image. */
function splitBoard(title, subtitle, keys, label, { kase = true } = {}) {
	const [pad, top, gap] = [52, 120, U];
	const halfWidth = Math.max(...keys.flatMap((k) => corners(k.x * U, k.y * U, k.w * U, k.h * U, k.angle).map(([px]) => px)));
	const parts = [
		`<text class="title" x="36" y="56">${esc(title)}</text>`,
		`<text class="sub" x="36" y="80">${esc(subtitle)}</text>`,
	];
	let bottom = 0;
	for (const side of ["left", "right"]) {
		const left = side === "left" ? pad : pad + halfWidth + gap;
		const drawn = [];
		const outline = [];
		for (const k of keys) {
			// Pixels, with the gap between keys taken off each side
			let [px, py, pw, ph, angle] = [k.x * U + GAP / 2, k.y * U + GAP / 2, k.w * U - GAP, k.h * U - GAP, k.angle];
			let col = k.slot?.col ?? 0;
			if (side === "right") {
				[px, angle, col] = [halfWidth - px - pw, -angle, 13 - col];
			}
			[px, py] = [left + px, top + py];
			const points = corners(px, py, pw, ph, angle);
			outline.push(...points);
			bottom = Math.max(bottom, ...points.map(([, cy]) => cy));
			if (k.slot?.kind === "letter") {
				drawn.push(keycap(px, py, pw, ph, { angle, ch: LETTER[`${k.slot.row},${col}`], color: COLOR[col] }));
			} else {
				drawn.push(keycap(px, py, pw, ph, { angle, label: k.slot ? NUMBER[col] ?? "" : "" }));
			}
		}
		if (kase) {
			const hullPoints = hull(outline).map(([x, y]) => `${f1(x)},${f1(y)}`).join(" ");
			parts.push(`<polygon class="case" points="${hullPoints}"/>`);
		}
		parts.push(...drawn);
	}
	const width = Math.round(2 * pad + 2 * halfWidth + gap);
	bottom += kase ? 24 : 0;
	parts.push(legend(36, bottom + 44));
	return svg(width, Math.round(bottom + 72), parts.join("\n"), label);
}

function ansi() {
	const [pad, top] = [36, 104];
	const parts = [
		'<text class="title" x="36" y="56">Fullerene</text>',
		'<text class="sub" x="36" y="80">ANSI · brackets on the - and = keys</text>',
	];
	ANSI.forEach(([offset, row], r) => {
		[...row].forEach((ch, i) => {
			const x = pad + (offset + i) * U + GAP / 2;
			parts.push(keycap(x, top + r * U, U - GAP, U - GAP, { ch, color: ANSI_COLOR[i] }));
		});
	});
	const width = Math.round(2 * pad + 12.5 * U);
	const bottom = top + 4 * U;
	parts.push(legend(pad, bottom + 30));
	return svg(width, Math.round(bottom + 56), parts.join("\n"), "Fullerene layout on an ANSI keyboard");
}

function main() {
	const images = [
		["fullerene.svg", splitBoard(
			"Fullerene", "Split keyboard · no letters on the pinky top keys · rare keys on the outer column",
			generic(), "Fullerene layout on a split keyboard", { kase: false })],
		["fullerene-ansi.svg", ansi()],
		...KEYBOARDS.map(([name, keyboard, subtitle, keys]) => [
			join("keyboards", `${name}.svg`),
			splitBoard(`Fullerene · ${keyboard}`, subtitle, keys(), `Fullerene layout on the ${keyboard}`),
		]),
	];
	for (const [name, content] of images) {
		const path = join(HERE, name);
		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, content, "utf-8");
		console.log(`generate: wrote ${path}`);
	}
}

main();
