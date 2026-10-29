import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const brandDir = path.join(root, 'public', 'brand');
const logoSvgPath = path.join(brandDir, 'ic-logo.svg');

const ogSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="0.2" cy="0.5" r="0.7">
      <stop offset="0%" stop-color="#1050D8" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#05070C" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#05070C"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="64" y="64" width="1072" height="502" rx="28" fill="#0B0F19" stroke="#1E293B" stroke-width="2"/>
  <g transform="translate(120, 175) scale(0.27)">
    <rect width="1024" height="1024" rx="180" fill="#000000" stroke="#1E3A8A" stroke-width="12"/>
    <rect x="275" y="362" width="58" height="300" fill="#FFFFFF"/>
    <path fill="#1050D8" d="M432 362h130l53 53v52h-58v-33l-14-14h-92l-14 14v156l14 14h92l14-14v-33h58v52l-53 53H432l-53-53V415l53-53z"/>
    <rect x="644" y="604" width="104" height="58" fill="#FFFFFF"/>
  </g>
  <text x="450" y="250" fill="#7EA6FF" font-family="Ubuntu, Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="3">IBRAHIMOS · PORTFOLIO INTERACTIF</text>
  <text x="450" y="325" fill="#FFFFFF" font-family="Ubuntu, Segoe UI, Arial, sans-serif" font-size="60" font-weight="700">Ibrahim Chehlafi</text>
  <text x="450" y="382" fill="#CBD5E1" font-family="Ubuntu, Segoe UI, Arial, sans-serif" font-size="30" font-weight="400">Développeur Full-Stack · Spring Boot · Laravel · React</text>
  <text x="450" y="445" fill="#94A3B8" font-family="Ubuntu, Segoe UI, Arial, sans-serif" font-size="22">Perpignan, France · DUT Mention Très Bien · Anglais C1</text>
</svg>
`;

async function main() {
  await fs.mkdir(brandDir, { recursive: true });
  const logoBuffer = await fs.readFile(logoSvgPath);

  await sharp(logoBuffer).resize(180, 180).png({ compressionLevel: 9 }).toFile(path.join(brandDir, 'apple-touch-icon.png'));
  await sharp(logoBuffer).resize(192, 192).png({ compressionLevel: 9 }).toFile(path.join(brandDir, 'icon-192.png'));
  await sharp(logoBuffer).resize(512, 512).png({ compressionLevel: 9 }).toFile(path.join(brandDir, 'icon-512.png'));
  await sharp(logoBuffer).resize(512, 512).png({ compressionLevel: 9 }).toFile(path.join(brandDir, 'icon-maskable-512.png'));
  await sharp(Buffer.from(ogSvg)).resize(1200, 630).png({ compressionLevel: 9 }).toFile(path.join(brandDir, 'og-image.png'));
  console.log('Brand assets generated in public/brand/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
