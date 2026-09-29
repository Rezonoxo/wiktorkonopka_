const fs = require('fs/promises');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const sharp = require('sharp');

const exec = promisify(execFile);
const root = path.resolve(process.argv[2] || '.');
const photosDir = path.join(root, 'photos');
const outputDir = path.join(root, 'dist', 'gallery');
const thumbsDir = path.join(outputDir, 'thumbs');
const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const widths = [480, 960, 1440];

async function gitDate(name, fallback) {
  try { const { stdout } = await exec('git', ['log', '-1', '--format=%cI', '--', `photos/${name}`], { cwd: root }); return stdout.trim() || fallback.toISOString(); }
  catch { return fallback.toISOString(); }
}
async function main() {
  await fs.mkdir(photosDir, { recursive: true });
  await fs.rm(outputDir, { recursive: true, force: true }); await fs.mkdir(thumbsDir, { recursive: true });
  const entries = await fs.readdir(photosDir, { withFileTypes: true });
  const photos = entries.filter(e => e.isFile() && allowed.has(path.extname(e.name).toLowerCase()));
  const images = new Array(photos.length);
  let nextPhoto = 0;
  async function buildPhoto(entry, index) {
    const source = path.join(photosDir, entry.name); const key = Buffer.from(entry.name).toString('base64url');
    try {
      const image = sharp(source, { animated: false }).rotate(); const metadata = await image.metadata();
      if (!metadata.width || !metadata.height) throw new Error('Brak wymiarów obrazu');
      const sources = await Promise.all(widths.map(async width => {
        const filename = `${key}-${width}.webp`;
        await image.clone().resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(thumbsDir, filename));
        return { width: Math.min(width, metadata.width), src: `dist/gallery/thumbs/${filename}` };
      }));
      const stat = await fs.stat(source);
      images[index] = { name: entry.name, original: `photos/${encodeURIComponent(entry.name)}`, width: metadata.width, height: metadata.height, modified: await gitDate(entry.name, stat.mtime), sources };
    } catch (error) { console.warn(`Pomijam ${entry.name}: ${error.message}`); }
  }
  async function worker() {
    while (nextPhoto < photos.length) {
      const index = nextPhoto++;
      await buildPhoto(photos[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, photos.length) }, worker));
  const validImages = images.filter(Boolean);
  validImages.sort((a, b) => b.modified.localeCompare(a.modified));
  await fs.writeFile(path.join(outputDir, 'gallery.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), images: validImages }, null, 2)}\n`);
  console.log(`Wygenerowano galerię: ${validImages.length} zdjęć.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
