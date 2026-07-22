/**
 * SVG template for a 1080×1080 branded post image.
 * Matches the aesthetic of the reference designs in public/brand-assets:
 *  - Dark navy background with subtle dot pattern
 *  - Mint-green + white accent palette
 *  - Arabic bold headline at top
 *  - English subtitle in a rounded pill below
 *  - "Islam AbouGhazala" logo pill in bottom-right
 *
 * XML-escape user-supplied strings before embedding — the fields we accept
 * (headline, subtitle) come from an LLM extraction step so we treat them
 * as untrusted.
 */

const SIZE = 1080;
const NAVY_DEEP = "#050C24";
const NAVY = "#0B1B3A";
const NAVY_LIGHT = "#132449";
const MINT = "#6EE7B7";
const WHITE = "#FFFFFF";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface TemplateInput {
  headline: string; // Arabic, ideally 4-8 words
  subtitle: string; // English, 2-4 words
  displayName: string; // e.g. "Islam AbouGhazala"
}

export function renderBrandSvg({
  headline,
  subtitle,
  displayName,
}: TemplateInput): string {
  const h = esc(headline);
  const s = esc(subtitle);
  const name = esc(displayName);

  // Wrap the headline into up to 2 lines by inserting a line break near
  // the middle word — simple heuristic that reads well for 4-10 word titles.
  const words = h.split(/\s+/);
  let line1 = h;
  let line2 = "";
  if (words.length >= 5) {
    const mid = Math.ceil(words.length / 2);
    line1 = words.slice(0, mid).join(" ");
    line2 = words.slice(mid).join(" ");
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="35%" r="75%">
      <stop offset="0%" stop-color="${NAVY_LIGHT}"/>
      <stop offset="70%" stop-color="${NAVY}"/>
      <stop offset="100%" stop-color="${NAVY_DEEP}"/>
    </radialGradient>
    <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r="1.2" fill="${MINT}" fill-opacity="0.18"/>
    </pattern>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${MINT}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${MINT}" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="${MINT}" stop-opacity="0"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="18" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#dots)"/>

  <!-- Ambient mint glow behind the illustration area -->
  <circle cx="${SIZE / 2}" cy="620" r="180" fill="${MINT}" fill-opacity="0.10" filter="url(#glow)"/>

  <!-- Central abstract illustration: concentric rings + node -->
  <g transform="translate(${SIZE / 2}, 620)" opacity="0.85">
    <circle r="170" fill="none" stroke="${MINT}" stroke-opacity="0.25" stroke-width="1.5"/>
    <circle r="120" fill="none" stroke="${MINT}" stroke-opacity="0.4" stroke-width="1.5"/>
    <circle r="70" fill="none" stroke="${MINT}" stroke-opacity="0.6" stroke-width="2"/>
    <circle r="24" fill="${MINT}"/>
    <circle r="12" fill="${WHITE}"/>
    <circle cx="170" cy="0" r="6" fill="${MINT}"/>
    <circle cx="-120" cy="0" r="5" fill="${MINT}" fill-opacity="0.7"/>
    <circle cx="0" cy="-170" r="5" fill="${WHITE}" fill-opacity="0.8"/>
    <circle cx="0" cy="120" r="4" fill="${WHITE}" fill-opacity="0.6"/>
  </g>

  <!-- Top accent line -->
  <rect x="140" y="130" width="800" height="2" fill="url(#accent)"/>

  <!-- Arabic headline (RTL) -->
  <g font-family="'Noto Sans Arabic','Noto Kufi Arabic','Noto Naskh Arabic',sans-serif" font-weight="800" fill="${WHITE}" text-anchor="middle">
    <text x="${SIZE / 2}" y="235" font-size="72" direction="rtl">${line1}</text>
    ${line2 ? `<text x="${SIZE / 2}" y="325" font-size="72" direction="rtl">${line2}</text>` : ""}
  </g>

  <!-- English subtitle pill -->
  ${
    s
      ? `<g transform="translate(${SIZE / 2}, ${line2 ? 400 : 340})">
    <rect x="-260" y="0" width="520" height="80" rx="12" ry="12" fill="${MINT}"/>
    <text x="0" y="55" font-family="'Noto Sans','DejaVu Sans','Inter',sans-serif" font-weight="800" font-size="40" fill="${NAVY_DEEP}" text-anchor="middle" letter-spacing="0.5">${s}</text>
  </g>`
      : ""
  }

  <!-- Author pill (bottom-right) -->
  <g transform="translate(820, 950)">
    <rect x="0" y="0" width="230" height="90" rx="14" ry="14" fill="${WHITE}"/>
    <!-- Portrait placeholder -->
    <circle cx="45" cy="45" r="30" fill="${NAVY_LIGHT}"/>
    <circle cx="45" cy="38" r="10" fill="${WHITE}" fill-opacity="0.9"/>
    <path d="M 25 60 Q 45 45 65 60 L 65 72 L 25 72 Z" fill="${WHITE}" fill-opacity="0.9"/>
    <!-- Name -->
    <text x="90" y="42" font-family="'Noto Sans','DejaVu Sans','Inter',sans-serif" font-weight="700" font-size="22" fill="${NAVY_DEEP}">Islam</text>
    <text x="90" y="70" font-family="'Noto Sans','DejaVu Sans','Inter',sans-serif" font-weight="700" font-size="22" fill="${NAVY_DEEP}">${name.replace(/^Islam\s*/i, "") || "AbouGhazala"}</text>
  </g>
</svg>`;
}
