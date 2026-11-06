import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const targets = [
  { file: 'src/assets/wallpapers/background.png', maxWidth: 2400, quality: 82 },
  { file: 'src/assets/wallpapers/backgroundDark.png', maxWidth: 2400, quality: 82 },
  { file: 'src/assets/projects/parcvision/parcVision1.png', maxWidth: 1600, quality: 84 },
  { file: 'src/assets/projects/parcvision/parcVision_Dashboard.png', maxWidth: 1600, quality: 84 },
  { file: 'src/assets/projects/parcvision/parcVision_map.png', maxWidth: 1600, quality: 84 },
  { file: 'src/assets/projects/parcvision/parcVision_archivage.png', maxWidth: 1600, quality: 84 },
  { file: 'src/assets/projects/parcvision/parcVisionbarRechercheOCR.png', maxWidth: 1600, quality: 86 },
  { file: 'src/assets/projects/pfe-esto/PFE_admin.png', maxWidth: 1600, quality: 86 },
  { file: 'src/assets/projects/pfe-esto/PFE_chef.png', maxWidth: 1600, quality: 86 },
  { file: 'src/assets/projects/pfe-esto/PFE_student.png', maxWidth: 1600, quality: 86 },
  { file: 'src/assets/projects/pfe-esto/PFE_teacher.png', maxWidth: 1600, quality: 86 },
  { file: 'src/assets/projects/citadel/citadel-invitation-en-ligne.png', maxWidth: 1600, quality: 86 },
  { file: 'src/assets/projects/citadel/citadel-revanche-en-ligne.png', maxWidth: 1600, quality: 86 },
  { file: 'src/assets/projects/learnxcompile/learnxcompile-accueil.png', maxWidth: 1200, quality: 86 },
  { file: 'src/assets/projects/learnxcompile/learnxcompile-exemple-java.png', maxWidth: 1200, quality: 86 },
  { file: 'src/assets/projects/learnxcompile/learnxcompile-exercice-java.png', maxWidth: 1200, quality: 86 },
  { file: 'src/assets/projects/learnxcompile/learnxcompile-lecon-types-de-donnees.png', maxWidth: 1200, quality: 86 },
  { file: 'src/assets/projects/learnxcompile/learnxcompile-parcours-java.png', maxWidth: 1200, quality: 86 },
  { file: 'src/assets/projects/learnxcompile/learnxcompile-profil-progression.png', maxWidth: 1200, quality: 86 },
  { file: 'src/assets/projects/learnxcompile/learnxcompile-quiz-java.png', maxWidth: 1200, quality: 86 },
];

async function main() {
  let savedBytes = 0;
  for (const item of targets) {
    const srcPath = path.join(root, item.file);
    const outPath = srcPath.replace(/\.(png|jpe?g)$/i, '.webp');
    try {
      const before = (await fs.stat(srcPath)).size;
      await sharp(srcPath)
        .resize({ width: item.maxWidth, withoutEnlargement: true })
        .webp({ quality: item.quality })
        .toFile(outPath);
      const after = (await fs.stat(outPath)).size;
      await fs.unlink(srcPath);
      savedBytes += before - after;
      console.log(`${item.file} -> ${path.basename(outPath)} (${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB)`);
    } catch (err) {
      console.warn(`Skipped ${item.file}: ${err.message}`);
    }
  }
  console.log(`Total saved: ${Math.round(savedBytes / 1024)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
