import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const outDir = new URL("./", import.meta.url);

const boltPath =
  "M213.85 125.46l-112 120a8 8 0 0 1-13.69-7l14.66-73.33-57.63-21.64a8 8 0 0 1-3-13l112-120a8 8 0 0 1 13.69 7L153.18 90.9l57.63 21.61a8 8 0 0 1 3.04 12.95Z";

function markSvg(size = 1024, padding = 96) {
  const tileSize = size - padding * 2;
  const scale = tileSize / 1024;
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="${padding}" y="${padding}" width="${tileSize}" height="${tileSize}" rx="${tileSize * 0.21875}" fill="#0A0A0A"/>
  <g transform="translate(${padding + tileSize * 0.25} ${padding + tileSize * 0.25}) scale(${2 * scale})">
    <path d="${boltPath}" fill="#FFFFFF"/>
  </g>
</svg>`;
}

function squareMarkSvg(size = 300) {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#0A0A0A"/>
  <g transform="translate(${size * 0.25} ${size * 0.25}) scale(${size / 512})">
    <path d="${boltPath}" fill="#FFFFFF"/>
  </g>
</svg>`;
}

function wordmarkSvg(width = 1800, height = 520) {
  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="44" y="44" width="432" height="432" rx="94" fill="#0A0A0A"/>
  <g transform="translate(152 152) scale(0.84375)">
    <path d="${boltPath}" fill="#FFFFFF"/>
  </g>
  <text x="560" y="321" fill="#0A0A0A" font-family="Inter, Arial, Helvetica, sans-serif" font-size="164" font-weight="750" letter-spacing="-3">Prospkt</text>
</svg>`;
}

function coverSvg() {
  return `
<svg width="1584" height="396" viewBox="0 0 1584 396" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1584" y2="396" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#F8FAFC"/>
      <stop offset="0.55" stop-color="#F4F8FC"/>
      <stop offset="1" stop-color="#EDF6FF"/>
    </linearGradient>
    <pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse">
      <path d="M56 0H0V56" stroke="#0F2742" stroke-opacity="0.045" stroke-width="1"/>
    </pattern>
    <filter id="softShadow" x="-20%" y="-30%" width="140%" height="160%" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="20" stdDeviation="22" flood-color="#0A0A0A" flood-opacity="0.10"/>
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0A0A0A" flood-opacity="0.08"/>
    </filter>
  </defs>

  <rect width="1584" height="396" fill="url(#bg)"/>
  <rect width="1584" height="396" fill="url(#grid)"/>
  <rect x="0" y="0" width="860" height="396" fill="url(#bg)" fill-opacity="0.88"/>
  <path d="M1050 202C1122 128 1243 104 1378 133" stroke="#83B5E9" stroke-opacity="0.28" stroke-width="2" stroke-linecap="round" stroke-dasharray="9 16"/>
  <path d="M1048 262C1134 216 1250 208 1382 235" stroke="#2D8C72" stroke-opacity="0.20" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 15"/>

  <g transform="translate(104 74)">
    <rect width="56" height="56" rx="14" fill="#0A0A0A"/>
    <g transform="translate(14 14) scale(0.109375)">
      <path d="${boltPath}" fill="#FFFFFF"/>
    </g>
    <text x="74" y="38" fill="#0A0A0A" font-family="Inter, Arial, Helvetica, sans-serif" font-size="28" font-weight="750" letter-spacing="-0.4">Prospkt</text>
  </g>

  <text x="104" y="176" fill="#07182B" font-family="Inter, Arial, Helvetica, sans-serif" font-size="46" font-weight="760" letter-spacing="-0.7">AI sales rep for</text>
  <text x="104" y="228" fill="#07182B" font-family="Inter, Arial, Helvetica, sans-serif" font-size="46" font-weight="760" letter-spacing="-0.7">service businesses.</text>
  <text x="104" y="272" fill="#627186" font-family="Inter, Arial, Helvetica, sans-serif" font-size="22" font-weight="450">Finds, calls, follows up, books, and logs revenue opportunities.</text>

  <g transform="translate(104 312)">
    <rect width="214" height="40" rx="20" fill="#FFFFFF" fill-opacity="0.74" stroke="#DAE3EE"/>
    <circle cx="23" cy="20" r="5.5" fill="#2D8C72"/>
    <text x="40" y="26" fill="#526173" font-family="Inter, Arial, Helvetica, sans-serif" font-size="17" font-weight="650">Built by YALID</text>
  </g>

  <g filter="url(#softShadow)" transform="translate(996 66)">
    <rect width="232" height="84" rx="18" fill="#FFFFFF" fill-opacity="0.88" stroke="#DEE7F0"/>
    <rect x="20" y="22" width="40" height="40" rx="12" fill="#FFE9E0"/>
    <path d="M45.2 47.2L53 55" stroke="#E45B4D" stroke-width="2.3" stroke-linecap="round"/>
    <circle cx="38" cy="40" r="10" stroke="#E45B4D" stroke-width="2.3"/>
    <text x="76" y="38" fill="#172033" font-family="Inter, Arial, Helvetica, sans-serif" font-size="19" font-weight="740">Discovery</text>
    <text x="76" y="61" fill="#687488" font-family="Inter, Arial, Helvetica, sans-serif" font-size="14.5" font-weight="500">Find leads</text>
  </g>

  <g filter="url(#softShadow)" transform="translate(1270 66)">
    <rect width="240" height="84" rx="18" fill="#FFFFFF" fill-opacity="0.88" stroke="#DEE7F0"/>
    <rect x="20" y="22" width="40" height="40" rx="12" fill="#ECE5FF"/>
    <path d="M29 33H51L43 42V51L37 54V42L29 33Z" stroke="#7965D9" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="76" y="38" fill="#172033" font-family="Inter, Arial, Helvetica, sans-serif" font-size="19" font-weight="740">Qualifier</text>
    <text x="76" y="61" fill="#687488" font-family="Inter, Arial, Helvetica, sans-serif" font-size="14.5" font-weight="500">Score fit</text>
  </g>

  <g filter="url(#softShadow)" transform="translate(1012 242)">
    <rect width="220" height="72" rx="18" fill="#FFFFFF" fill-opacity="0.9" stroke="#DEE7F0"/>
    <rect x="18" y="18" width="36" height="36" rx="11" fill="#E7F2DB"/>
    <path d="M33 29C34.4 34.4 37.6 37.6 43 39L46 36.7L50.5 40.3L48.9 46C38.5 46.1 26.9 34.5 27 24.1L32.7 22.5L36.3 27L33 29Z" stroke="#6A9F45" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="70" y="34" fill="#172033" font-family="Inter, Arial, Helvetica, sans-serif" font-size="18" font-weight="740">Caller</text>
    <text x="70" y="56" fill="#687488" font-family="Inter, Arial, Helvetica, sans-serif" font-size="14" font-weight="500">Human-paced</text>
  </g>

  <g filter="url(#softShadow)" transform="translate(1268 242)">
    <rect width="230" height="72" rx="18" fill="#FFFFFF" fill-opacity="0.9" stroke="#DEE7F0"/>
    <rect x="18" y="18" width="36" height="36" rx="11" fill="#FFF1CF"/>
    <path d="M29 32H45V48H29V32Z M33 28V35 M41 28V35 M29 38H45" stroke="#BC8427" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="70" y="34" fill="#172033" font-family="Inter, Arial, Helvetica, sans-serif" font-size="18" font-weight="740">Bookings</text>
    <text x="70" y="56" fill="#687488" font-family="Inter, Arial, Helvetica, sans-serif" font-size="14" font-weight="500">Calendar sync</text>
  </g>

  <g filter="url(#softShadow)" transform="translate(1188 166)">
    <rect width="68" height="68" rx="20" fill="#FFFFFF" fill-opacity="0.82" stroke="#DFE8F1"/>
    <rect x="14" y="14" width="40" height="40" rx="12" fill="#0A0A0A"/>
    <g transform="translate(24 24) scale(0.078125)">
      <path d="${boltPath}" fill="#FFFFFF"/>
    </g>
  </g>

</svg>`;
}

function companyCoverSvg() {
  return `
<svg width="1128" height="191" viewBox="0 0 1128 191" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1128" y2="191" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#F8FAFC"/>
      <stop offset="0.58" stop-color="#F5F9FD"/>
      <stop offset="1" stop-color="#EEF7FF"/>
    </linearGradient>
    <pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse">
      <path d="M42 0H0V42" stroke="#0F2742" stroke-opacity="0.045" stroke-width="1"/>
    </pattern>
    <filter id="softShadow" x="-20%" y="-35%" width="140%" height="170%" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#0A0A0A" flood-opacity="0.10"/>
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#0A0A0A" flood-opacity="0.08"/>
    </filter>
  </defs>

  <rect width="1128" height="191" fill="url(#bg)"/>
  <rect width="1128" height="191" fill="url(#grid)"/>
  <rect x="0" y="0" width="540" height="191" fill="url(#bg)" fill-opacity="0.92"/>
  <path d="M650 96C724 62 850 58 1010 83" stroke="#83B5E9" stroke-opacity="0.18" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="7 14"/>

  <g transform="translate(499 125)">
    <rect width="34" height="34" rx="9" fill="#0A0A0A"/>
    <g transform="translate(8.5 8.5) scale(0.06640625)">
      <path d="${boltPath}" fill="#FFFFFF"/>
    </g>
    <text x="48" y="24" fill="#0A0A0A" font-family="Inter, Arial, Helvetica, sans-serif" font-size="20" font-weight="760" letter-spacing="-0.2" textLength="82" lengthAdjust="spacingAndGlyphs">Prospkt</text>
  </g>

  <g filter="url(#softShadow)" transform="translate(718 43)">
    <rect width="365" height="105" rx="18" fill="#FFFFFF" fill-opacity="0.9" stroke="#DEE7F0"/>
    <rect x="20" y="21" width="34" height="34" rx="10" fill="#0A0A0A"/>
    <g transform="translate(28.5 29) scale(0.064453125)">
      <path d="${boltPath}" fill="#FFFFFF"/>
    </g>
    <text x="68" y="35" fill="#172033" font-family="Inter, Arial, Helvetica, sans-serif" font-size="16" font-weight="750">Sales flow</text>
    <text x="68" y="55" fill="#687488" font-family="Inter, Arial, Helvetica, sans-serif" font-size="11.5" font-weight="500">From lead to booked job</text>

    <g transform="translate(20 70)">
      <rect width="69" height="22" rx="11" fill="#FFE9E0"/>
      <text x="34.5" y="15" fill="#A9443B" font-family="Inter, Arial, Helvetica, sans-serif" font-size="10.5" font-weight="700" text-anchor="middle">Find</text>
    </g>
    <path d="M95 81H111" stroke="#C5D1DE" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M107 77L111 81L107 85" stroke="#C5D1DE" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <g transform="translate(119 70)">
      <rect width="69" height="22" rx="11" fill="#ECE5FF"/>
      <text x="34.5" y="15" fill="#6B56CC" font-family="Inter, Arial, Helvetica, sans-serif" font-size="10.5" font-weight="700" text-anchor="middle">Score</text>
    </g>
    <path d="M194 81H210" stroke="#C5D1DE" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M206 77L210 81L206 85" stroke="#C5D1DE" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <g transform="translate(218 70)">
      <rect width="69" height="22" rx="11" fill="#E7F2DB"/>
      <text x="34.5" y="15" fill="#507F35" font-family="Inter, Arial, Helvetica, sans-serif" font-size="10.5" font-weight="700" text-anchor="middle">Call</text>
    </g>
    <path d="M293 81H300" stroke="#C5D1DE" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M296 77L300 81L296 85" stroke="#C5D1DE" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <g transform="translate(306 70)">
      <rect width="39" height="22" rx="11" fill="#FFF1CF"/>
      <text x="19.5" y="15" fill="#A06F1E" font-family="Inter, Arial, Helvetica, sans-serif" font-size="10.5" font-weight="700" text-anchor="middle">Book</text>
    </g>
  </g>
</svg>`;
}

function launchPostSvg() {
  return `
<svg width="1200" height="1200" viewBox="0 0 1200 1200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="coolGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(802 116) rotate(118) scale(670 360)">
      <stop stop-color="#E9F8FF" stop-opacity="0.95"/>
      <stop offset="0.28" stop-color="#49B7FF" stop-opacity="0.58"/>
      <stop offset="0.64" stop-color="#0E547B" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#050607" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="warmGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(956 278) rotate(119) scale(500 300)">
      <stop stop-color="#FFF9DF" stop-opacity="1"/>
      <stop offset="0.33" stop-color="#E5BD65" stop-opacity="0.58"/>
      <stop offset="0.72" stop-color="#7B5521" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#050607" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="cornerGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(146 1008) rotate(-36) scale(460 520)">
      <stop stop-color="#FFF6D7" stop-opacity="0.88"/>
      <stop offset="0.34" stop-color="#52BFFE" stop-opacity="0.48"/>
      <stop offset="0.78" stop-color="#0F6DA1" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#050607" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="centerFade" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(600 602) scale(390)">
      <stop offset="0" stop-color="#050607" stop-opacity="0.94"/>
      <stop offset="0.56" stop-color="#050607" stop-opacity="0.86"/>
      <stop offset="1" stop-color="#050607" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="launchText" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(600 690) scale(280 80)">
      <stop stop-color="#F7F5EF"/>
      <stop offset="0.5" stop-color="#6E99C5"/>
      <stop offset="1" stop-color="#EEDCAA"/>
    </radialGradient>
    <pattern id="dots" width="11" height="11" patternUnits="userSpaceOnUse">
      <circle cx="5.5" cy="5.5" r="1.55" fill="#FFFFFF"/>
    </pattern>
    <mask id="dotMask">
      <rect width="1200" height="1200" fill="url(#dots)"/>
    </mask>
    <filter id="textGlow" x="-20%" y="-40%" width="140%" height="180%" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="0" stdDeviation="7" flood-color="#FFFFFF" flood-opacity="0.17"/>
      <feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#000000" flood-opacity="0.66"/>
    </filter>
    <filter id="softShadow" x="-35%" y="-35%" width="170%" height="170%" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="20" stdDeviation="30" flood-color="#000000" flood-opacity="0.7"/>
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#DDEEFF" flood-opacity="0.26"/>
    </filter>
    <filter id="blur">
      <feGaussianBlur stdDeviation="32"/>
    </filter>
  </defs>

  <rect width="1200" height="1200" fill="#050607"/>
  <g filter="url(#blur)">
    <rect width="1200" height="1200" fill="url(#coolGlow)"/>
    <rect width="1200" height="1200" fill="url(#warmGlow)"/>
    <rect width="1200" height="1200" fill="url(#cornerGlow)"/>
    <ellipse cx="940" cy="228" rx="280" ry="430" fill="#F8FAFF" fill-opacity="0.12" transform="rotate(-18 940 228)"/>
    <ellipse cx="184" cy="972" rx="330" ry="250" fill="#F9F6E8" fill-opacity="0.13" transform="rotate(30 184 972)"/>
  </g>
  <rect width="1200" height="1200" fill="#FFFFFF" fill-opacity="0.34" mask="url(#dotMask)"/>
  <rect width="1200" height="1200" fill="#050607" fill-opacity="0.18"/>
  <rect width="1200" height="1200" fill="url(#centerFade)"/>
  <rect width="1200" height="1200" fill="#000000" fill-opacity="0.08"/>

  <g filter="url(#softShadow)" transform="translate(510 365)">
    <rect width="180" height="180" rx="45" fill="#050607" fill-opacity="0.42" stroke="#F4F8FF" stroke-opacity="0.88" stroke-width="2"/>
    <g transform="translate(51 50) scale(0.3046875)">
      <path d="${boltPath}" fill="#FFFFFF"/>
    </g>
  </g>

  <path d="M712 347C720 370 731 381 754 389C731 397 720 408 712 431C704 408 693 397 670 389C693 381 704 370 712 347Z" fill="#FFFFFF"/>
  <path d="M908 590C916 613 927 624 950 632C927 640 916 651 908 674C900 651 889 640 866 632C889 624 900 613 908 590Z" fill="#FFFFFF" fill-opacity="0.92"/>

  <g filter="url(#textGlow)">
    <text x="600" y="700" fill="#FFFFFF" font-family="'Switzer', Arial, Helvetica, sans-serif" font-size="128" font-weight="740" letter-spacing="-3" text-anchor="middle">Prospkt.ai</text>
    <text x="600" y="786" fill="url(#launchText)" font-family="'Switzer', Arial, Helvetica, sans-serif" font-size="27" font-weight="520" letter-spacing="23" text-anchor="middle">LAUNCHING SOON</text>
  </g>
</svg>`;
}

async function renderPng(svg, filename, density = 2) {
  await sharp(Buffer.from(svg), { density: 72 * density })
    .png()
    .toFile(fileURLToPath(new URL(filename, outDir)));
}

await mkdir(outDir, { recursive: true });
await renderPng(markSvg(), "prospkt-mark-transparent.png", 1);
await sharp(Buffer.from(squareMarkSvg(300)), { density: 72 })
  .png()
  .toFile(fileURLToPath(new URL("prospkt-linkedin-logo-300.png", outDir)));
await renderPng(wordmarkSvg(), "prospkt-wordmark-transparent.png", 1);
await renderPng(coverSvg(), "prospkt-linkedin-cover.png", 1);
await renderPng(coverSvg(), "prospkt-linkedin-cover-2x.png", 2);
await renderPng(companyCoverSvg(), "prospkt-linkedin-company-cover.png", 1);
await renderPng(companyCoverSvg(), "prospkt-linkedin-company-cover-2x.png", 2);
await renderPng(launchPostSvg(), "prospkt-launching-soon-linkedin.png", 1);
