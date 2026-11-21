// Generates the original flat-illustration SVG artwork used as sample imagery.
// All output is original work created for this repository (MIT licence) — no stock photos.
// Usage: node tools/generate-artwork.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projects } from '../backend/src/seed-data.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'frontend/public/images/projects');
mkdirSync(outDir, { recursive: true });

const W = 1200, H = 800;

const palettes = {
  'teak-and-linen-living-room': { wall: '#EFE6DA', floor: '#B98A5E', accent: '#8C5A3C', soft: '#E3D3BF', deep: '#4A3426' },
  'terracotta-courtyard-lounge': { wall: '#F3E3D3', floor: '#C46A45', accent: '#7C8B4F', soft: '#E8C8A8', deep: '#5B2E1E' },
  'sage-modular-kitchen': { wall: '#EEF0E8', floor: '#C9B79C', accent: '#8FA58A', soft: '#DCE3D6', deep: '#3E4A3C' },
  'charcoal-island-kitchen': { wall: '#E7E4DF', floor: '#A68462', accent: '#3A3B3E', soft: '#CFC8BE', deep: '#1F2023' },
  'indigo-master-bedroom': { wall: '#2F3F6B', floor: '#B08B68', accent: '#D9B26F', soft: '#E9E2D6', deep: '#1D2747' },
  'kids-loft-bedroom': { wall: '#F4EBDD', floor: '#D2B48C', accent: '#E58E5B', soft: '#9CC5C2', deep: '#3F5F73' },
  'monsoon-spa-bathroom': { wall: '#DDE3E1', floor: '#9AA3A0', accent: '#5E7D77', soft: '#F2F4F3', deep: '#2E3B39' },
  'quiet-corner-home-office': { wall: '#F2F0EC', floor: '#D8C3A5', accent: '#6D8B9C', soft: '#E1DDD6', deep: '#33414A' },
  'filter-coffee-cafe': { wall: '#EADBC8', floor: '#8E5A3B', accent: '#2F6B5E', soft: '#D8B98E', deep: '#3B2416' },
  'handloom-boutique': { wall: '#F5EFE6', floor: '#C8A27A', accent: '#B5473A', soft: '#E7D7BF', deep: '#4B3A2F' }
};

const kindFor = (category) => ({
  'living-rooms': 'living', kitchens: 'kitchen', bedrooms: 'bedroom',
  bathrooms: 'bath', workspaces: 'office', commercial: 'cafe'
}[category]);

const svg = (title, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t">` +
  `<title id="t">${title} (illustration)</title>${body}</svg>\n`;

function room(p) {
  // Back wall, floor with perspective, a window with daylight.
  return `
  <rect width="${W}" height="${H}" fill="${p.wall}"/>
  <rect x="0" y="0" width="${W}" height="40" fill="${p.deep}" opacity=".08"/>
  <polygon points="0,560 ${W},560 ${W},${H} 0,${H}" fill="${p.floor}"/>
  <g opacity=".18" stroke="${p.deep}" stroke-width="2">
    ${[...Array(9)].map((_, i) => `<line x1="${i * 150}" y1="560" x2="${i * 150 - 200 + i * 40}" y2="${H}"/>`).join('')}
  </g>
  <rect x="0" y="552" width="${W}" height="10" fill="${p.deep}" opacity=".25"/>
  <polygon points="772,562 1068,562 1200,${H} 700,${H}" fill="#FFF7DE" opacity=".22"/>
  <g>
    <rect x="760" y="110" width="320" height="300" rx="6" fill="#FFFFFF" opacity=".9"/>
    <rect x="772" y="122" width="296" height="276" fill="#CFE4EC"/>
    <circle cx="1000" cy="190" r="34" fill="#FFF3C9"/>
    <path d="M772 330 Q850 280 920 320 T1068 300 V398 H772Z" fill="#9DBE8E" opacity=".8"/>
    <line x1="920" y1="122" x2="920" y2="398" stroke="#FFFFFF" stroke-width="10"/>
    
  </g>`;
}

function plant(x, y, p, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 0 C-40 -60 -60 -120 -20 -170 C-10 -110 0 -60 0 0Z" fill="#5F8A55"/>
    <path d="M0 0 C40 -70 70 -110 40 -180 C20 -120 8 -70 0 0Z" fill="#729E63"/>
    <path d="M0 0 C-10 -80 10 -150 0 -210 C25 -150 15 -80 0 0Z" fill="#4E7A47"/>
    <path d="M-38 0 H38 L28 70 H-28Z" fill="${p.deep}"/>
  </g>`;
}

function lamp(x, y, p) {
  return `<g><line x1="${x}" y1="${y}" x2="${x}" y2="${y + 300}" stroke="${p.deep}" stroke-width="6"/>
    <path d="M${x - 50} ${y} L${x + 50} ${y} L${x + 30} ${y - 70} L${x - 30} ${y - 70}Z" fill="${p.soft}" stroke="${p.deep}" stroke-width="3"/>
    <ellipse cx="${x}" cy="${y + 300}" rx="40" ry="8" fill="${p.deep}"/>
    <ellipse cx="${x}" cy="${y + 40}" rx="120" ry="90" fill="#FFF1C1" opacity=".18"/></g>`;
}

function frame(x, y, w, h, p) {
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.deep}"/>
    <rect x="${x + 10}" y="${y + 10}" width="${w - 20}" height="${h - 20}" fill="${p.soft}"/>
    <circle cx="${x + w * 0.38}" cy="${y + h * 0.45}" r="${Math.min(w, h) * 0.2}" fill="${p.accent}" opacity=".85"/>
    <rect x="${x + w * 0.5}" y="${y + h * 0.3}" width="${w * 0.3}" height="${h * 0.45}" fill="${p.floor}" opacity=".8"/></g>`;
}

const scenes = {
  living: (p) => `${frame(180, 170, 260, 180, p)}
    <ellipse cx="520" cy="700" rx="420" ry="60" fill="${p.soft}"/>
    <rect x="200" y="440" width="560" height="140" rx="30" fill="${p.accent}"/>
    <rect x="230" y="380" width="500" height="110" rx="26" fill="${p.accent}" opacity=".9"/>
    <rect x="250" y="400" width="140" height="80" rx="18" fill="${p.soft}"/>
    <rect x="570" y="400" width="140" height="80" rx="18" fill="${p.soft}"/>
    <rect x="220" y="580" width="16" height="50" fill="${p.deep}"/><rect x="724" y="580" width="16" height="50" fill="${p.deep}"/>
    <rect x="380" y="620" width="260" height="22" rx="8" fill="${p.deep}"/>
    <rect x="400" y="642" width="12" height="50" fill="${p.deep}"/><rect x="608" y="642" width="12" height="50" fill="${p.deep}"/>
    <circle cx="470" cy="606" r="16" fill="#FFFFFF" opacity=".85"/>
    ${plant(100, 560, p)}${lamp(870, 300, p)}`,
  kitchen: (p) => `${[540, 640, 740].map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="470" stroke="${p.deep}" stroke-width="3"/>`).join('')}
    <rect x="80" y="150" width="600" height="150" fill="${p.accent}"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${92 + i * 148}" y="162" width="136" height="126" rx="4" fill="${p.accent}" stroke="${p.deep}" stroke-opacity=".25" stroke-width="3"/><rect x="${150 + i * 148}" y="270" width="24" height="6" rx="3" fill="#C9A45C"/>`).join('')}
    <rect x="80" y="300" width="600" height="110" fill="#FFFFFF" opacity=".55"/>
    <g stroke="${p.deep}" stroke-opacity=".12">${[...Array(10)].map((_, i) => `<line x1="${80 + i * 60}" y1="300" x2="${80 + i * 60}" y2="410"/>`).join('')}</g>
    <rect x="60" y="410" width="640" height="26" fill="${p.soft}"/>
    <rect x="80" y="436" width="600" height="124" fill="${p.accent}"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${92 + i * 148}" y="446" width="136" height="104" rx="4" fill="none" stroke="${p.deep}" stroke-opacity=".25" stroke-width="3"/>`).join('')}
    <rect x="300" y="380" width="120" height="30" rx="4" fill="${p.deep}"/>
    <path d="M520 410 v-60 h40" stroke="#B7B7B7" stroke-width="8" fill="none"/>
    <rect x="420" y="590" width="400" height="30" fill="${p.soft}"/><rect x="440" y="620" width="360" height="110" fill="${p.deep}"/>
    ${[480, 600, 720].map((x) => `<rect x="${x}" y="640" width="60" height="14" rx="7" fill="${p.accent}"/><line x1="${x + 30}" y1="654" x2="${x + 30}" y2="760" stroke="${p.deep}" stroke-width="6"/>`).join('')}
    ${[540, 640, 740].map((x) => `<line x1="${x}" y1="410" x2="${x}" y2="470" stroke="${p.deep}" stroke-width="3"/><path d="M${x - 30} 500 Q${x} 450 ${x + 30} 500Z" fill="${p.deep}"/><ellipse cx="${x}" cy="503" rx="22" ry="5" fill="#FFE7A8"/>`).join('')}
    ${plant(1120, 560, p, 0.8)}`,
  bedroom: (p) => `${frame(360, 150, 220, 150, p)}
    <rect x="240" y="330" width="460" height="200" rx="24" fill="${p.soft}"/>
    <rect x="200" y="470" width="540" height="110" rx="16" fill="#FFFFFF"/>
    <rect x="200" y="510" width="540" height="90" rx="16" fill="${p.accent}" opacity=".9"/>
    <rect x="260" y="430" width="160" height="60" rx="18" fill="#FFFFFF" stroke="${p.soft}" stroke-width="4"/>
    <rect x="520" y="430" width="160" height="60" rx="18" fill="#FFFFFF" stroke="${p.soft}" stroke-width="4"/>
    <rect x="210" y="600" width="18" height="40" fill="${p.deep}"/><rect x="712" y="600" width="18" height="40" fill="${p.deep}"/>
    <rect x="90" y="470" width="90" height="110" rx="6" fill="${p.floor}"/>
    <rect x="760" y="470" width="90" height="110" rx="6" fill="${p.floor}"/>
    <ellipse cx="135" cy="420" rx="34" ry="40" fill="${p.accent}"/><rect x="130" y="440" width="10" height="30" fill="${p.deep}"/>
    <ellipse cx="805" cy="420" rx="34" ry="40" fill="${p.accent}"/><rect x="800" y="440" width="10" height="30" fill="${p.deep}"/>
    <ellipse cx="470" cy="700" rx="360" ry="50" fill="${p.soft}" opacity=".7"/>
    ${plant(1110, 560, p, 0.8)}`,
  bath: (p) => `<g opacity=".35" stroke="#FFFFFF" stroke-width="3">${[...Array(12)].map((_, i) => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="560"/>`).join('')}${[...Array(6)].map((_, i) => `<line x1="0" y1="${i * 100}" x2="${W}" y2="${i * 100}"/>`).join('')}</g>
    <rect x="80" y="120" width="300" height="440" fill="#FFFFFF" opacity=".35" stroke="#FFFFFF" stroke-width="6"/>
    <path d="M230 140 v40 h-50" stroke="${p.deep}" stroke-width="10" fill="none"/><ellipse cx="180" cy="190" rx="40" ry="10" fill="${p.deep}"/>
    ${[...Array(8)].map((_, i) => `<line x1="${150 + i * 9}" y1="205" x2="${140 + i * 11}" y2="420" stroke="#9CC9DA" stroke-width="3" opacity=".7"/>`).join('')}
    <rect x="470" y="160" width="220" height="260" rx="110" fill="#E9F1F3" stroke="${p.deep}" stroke-width="8"/>
    <rect x="430" y="440" width="300" height="30" fill="${p.soft}"/><ellipse cx="580" cy="440" rx="80" ry="14" fill="#FFFFFF"/>
    <rect x="440" y="470" width="280" height="90" fill="${p.accent}"/>
    <rect x="560" y="400" width="10" height="40" fill="#B7B7B7"/>
    ${plant(1120, 560, p, 0.8)}`,
  office: (p) => `<g>${[0, 1, 2].map((i) => `<rect x="${120 + i * 130}" y="150" width="110" height="170" rx="10" fill="${p.accent}" opacity="${0.7 + i * 0.1}"/>`).join('')}</g>
    <rect x="120" y="360" width="160" height="14" fill="${p.deep}"/>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${130 + i * 26}" y="${310 - (i % 2) * 12}" width="20" height="${50 + (i % 2) * 12}" fill="${[p.accent, p.floor, p.deep, p.soft, p.accent][i]}"/>`).join('')}
    <rect x="300" y="440" width="460" height="24" rx="6" fill="${p.floor}"/>
    <rect x="320" y="464" width="20" height="130" fill="${p.deep}"/><rect x="720" y="464" width="20" height="130" fill="${p.deep}"/>
    <rect x="440" y="300" width="200" height="130" rx="8" fill="${p.deep}"/><rect x="452" y="312" width="176" height="104" fill="#BFD6E2"/>
    <rect x="525" y="430" width="30" height="12" fill="${p.deep}"/>
    <path d="M380 640 h120 v-160 h-20 v140 h-80Z" fill="${p.accent}"/><rect x="430" y="640" width="10" height="60" fill="${p.deep}"/>
    ${lamp(680, 340, p).replace(/y2="\d+"/, 'y2="440"')}
    ${plant(1110, 560, p, 0.85)}`,
  cafe: (p) => `<rect x="60" y="140" width="640" height="60" fill="${p.accent}"/>
    <text x="380" y="182" font-family="Georgia, serif" font-size="34" fill="#FFFFFF" text-anchor="middle" letter-spacing="6">SAMPLE STUDIO</text>
    ${[0, 1, 2].map((i) => `<rect x="${100 + i * 200}" y="230" width="160" height="110" fill="${p.soft}" stroke="${p.deep}" stroke-width="6"/><line x1="${180 + i * 200}" y1="230" x2="${180 + i * 200}" y2="340" stroke="${p.deep}" stroke-width="4"/>`).join('')}
    <rect x="60" y="400" width="640" height="24" fill="${p.deep}"/><rect x="80" y="424" width="600" height="136" fill="${p.floor}"/>
    <g opacity=".5">${[...Array(10)].map((_, i) => `<rect x="${90 + i * 60}" y="440" width="40" height="40" transform="rotate(45 ${110 + i * 60} 460)" fill="${p.accent}"/>`).join('')}</g>
    ${[[820, 640], [1010, 680]].map(([x, y]) => `<ellipse cx="${x}" cy="${y - 60}" rx="80" ry="16" fill="${p.deep}"/><rect x="${x - 6}" y="${y - 60}" width="12" height="70" fill="${p.deep}"/>
      <rect x="${x - 120}" y="${y - 40}" width="40" height="10" fill="${p.accent}"/><line x1="${x - 100}" y1="${y - 30}" x2="${x - 100}" y2="${y + 20}" stroke="${p.deep}" stroke-width="5"/>
      <rect x="${x + 80}" y="${y - 40}" width="40" height="10" fill="${p.accent}"/><line x1="${x + 100}" y1="${y - 30}" x2="${x + 100}" y2="${y + 20}" stroke="${p.deep}" stroke-width="5"/>
      <rect x="${x - 14}" y="${y - 84}" width="22" height="24" rx="4" fill="#FFFFFF"/>`).join('')}
    ${[200, 380, 560].map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="90" stroke="${p.deep}" stroke-width="3"/><circle cx="${x}" cy="104" r="16" fill="#FFE7A8"/>`).join('')}`
};

function cover(project, p) {
  return svg(project.title, room(p) + scenes[kindFor(project.category)](p) + `<rect width="${W}" height="${H}" fill="url(#v)" opacity="0"/>`);
}

// Detail 1: material board (swatches named after the project's materials)
function materialBoard(project, p) {
  const colours = [p.floor, p.accent, p.soft, p.deep, p.wall];
  const tiles = project.materials.slice(0, 4).map((m, i) => {
    const x = 120 + (i % 2) * 500, y = 110 + Math.floor(i / 2) * 320;
    return `<g><rect x="${x}" y="${y}" width="460" height="270" rx="18" fill="${colours[i]}"/>
      ${i % 2 === 0 ? `<g opacity=".18" stroke="#000">${[...Array(12)].map((_, k) => `<path d="M${x} ${y + 20 + k * 21} q115 -12 230 0 t230 0" fill="none"/>`).join('')}</g>` : `<g opacity=".15" fill="#000">${[...Array(40)].map((_, k) => `<circle cx="${x + 20 + (k * 53) % 430}" cy="${y + 20 + ((k * 37) % 230)}" r="4"/>`).join('')}</g>`}
      <rect x="${x + 20}" y="${y + 206}" width="${Math.max(140, m.length * 15 + 40)}" height="44" rx="22" fill="#FFFFFF" opacity=".92"/>
      <text x="${x + 40}" y="${y + 236}" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="#222">${m}</text></g>`;
  }).join('');
  const n = Math.min(project.materials.length, 4);
  const chips = n < 4 ? (() => {
    const x = 120 + (n % 2) * 500, y = 110 + Math.floor(n / 2) * 320;
    return `<g><rect x="${x}" y="${y}" width="460" height="270" rx="18" fill="#FFFFFF" stroke="#E4DED4" stroke-width="2"/>
      ${colours.map((c, k) => `<circle cx="${x + 70 + k * 80}" cy="${y + 115}" r="34" fill="${c}" stroke="#00000010"/>`).join('')}
      <text x="${x + 40}" y="${y + 230}" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="#222">Colour palette</text></g>`;
  })() : '';
  return svg(`${project.title} — material palette`, `<rect width="${W}" height="${H}" fill="#F7F4EF"/>${tiles}${chips}`);
}

// Detail 2: floor-plan style diagram
function plan(project, p) {
  return svg(`${project.title} — layout sketch`, `<rect width="${W}" height="${H}" fill="#FBFAF7"/>
    <g stroke="#D9D4CB" stroke-width="1">${[...Array(25)].map((_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="${H}"/>`).join('')}${[...Array(17)].map((_, i) => `<line x1="0" y1="${i * 50}" x2="${W}" y2="${i * 50}"/>`).join('')}</g>
    <rect x="200" y="150" width="800" height="500" fill="none" stroke="${p.deep}" stroke-width="14"/>
    <line x1="600" y1="150" x2="600" y2="420" stroke="${p.deep}" stroke-width="8"/>
    <rect x="240" y="190" width="300" height="120" rx="10" fill="${p.accent}" opacity=".8"/>
    <rect x="650" y="200" width="300" height="80" fill="${p.soft}" stroke="${p.deep}" stroke-width="3"/>
    <circle cx="790" cy="480" r="80" fill="${p.floor}" opacity=".7"/>
    <rect x="260" y="480" width="200" height="120" fill="${p.soft}" stroke="${p.deep}" stroke-width="3"/>
    <path d="M200 560 a90 90 0 0 1 90 90" fill="none" stroke="${p.deep}" stroke-width="3" stroke-dasharray="8 6"/>
    <rect x="420" y="140" width="140" height="20" fill="#CFE4EC" stroke="${p.deep}" stroke-width="3"/>
    <text x="600" y="720" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="${p.deep}" text-anchor="middle">Indicative layout sketch · ${project.area_sqft} sq ft · not to scale</text>`);
}

let count = 0;
for (const project of projects) {
  const p = palettes[project.slug];
  if (!p) throw new Error(`No palette for ${project.slug}`);
  writeFileSync(resolve(outDir, `${project.slug}.svg`), cover(project, p));
  writeFileSync(resolve(outDir, `${project.slug}-detail-1.svg`), materialBoard(project, p));
  writeFileSync(resolve(outDir, `${project.slug}-detail-2.svg`), plan(project, p));
  count += 3;
}

// Hero illustration for the homepage
const heroP = { wall: '#EDE5DA', floor: '#B98A5E', accent: '#6E7F5C', soft: '#E3D3BF', deep: '#3F3127' };
const heroDir = resolve(root, 'frontend/public/images');
mkdirSync(heroDir, { recursive: true });
writeFileSync(resolve(heroDir, 'hero.svg'), svg('Sample living room', room(heroP) + scenes.living(heroP)));
count += 1;

// Neutral placeholder used when a project has no cover image yet
writeFileSync(resolve(heroDir, 'placeholder.svg'), svg('No image yet', `<rect width="${W}" height="${H}" fill="#F3EEE6"/>
  <g fill="none" stroke="#C9BFB2" stroke-width="10" stroke-linejoin="round"><rect x="470" y="300" width="260" height="200" rx="16"/><path d="M490 470l70-80 60 60 40-40 50 60"/></g>
  <circle cx="660" cy="350" r="18" fill="#C9BFB2"/>
  <text x="600" y="560" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#A2968A" text-anchor="middle">No image yet</text>`));
count += 1;

mkdirSync(dirname(outDir), { recursive: true });
console.log(`Wrote ${count} SVG illustrations.`);
