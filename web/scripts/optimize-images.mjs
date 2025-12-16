import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');

// 変換対象の画像ファイル
const targetImages = [
  'image1.jpeg',
  'image2.jpeg',
  'image3.jpeg',
  'staff.png',
  'entrance.jpeg',
  'cut.jpeg',
  'cut2.jpeg',
  'design.jpeg',
  'shampoo.jpeg',
  'shampoo2.jpeg',
  'shaving.jpeg',
  'goods.jpeg',
];

async function optimizeImage(filename) {
  const inputPath = path.join(publicDir, filename);
  const baseName = path.basename(filename, path.extname(filename));

  if (!fs.existsSync(inputPath)) {
    console.log(`Skip: ${filename} not found`);
    return;
  }

  const inputStats = fs.statSync(inputPath);
  const inputSizeKB = (inputStats.size / 1024).toFixed(0);

  try {
    // 画像の情報を取得
    const metadata = await sharp(inputPath).metadata();
    const maxWidth = 2400;
    const shouldResize = metadata.width > maxWidth;

    let pipeline = sharp(inputPath);

    if (shouldResize) {
      pipeline = pipeline.resize(maxWidth, null, {
        withoutEnlargement: true,
        fit: 'inside',
      });
    }

    // WebP変換
    const webpPath = path.join(publicDir, `${baseName}.webp`);
    await pipeline.clone().webp({ quality: 85 }).toFile(webpPath);
    const webpStats = fs.statSync(webpPath);
    const webpSizeKB = (webpStats.size / 1024).toFixed(0);

    // AVIF変換
    const avifPath = path.join(publicDir, `${baseName}.avif`);
    await pipeline.clone().avif({ quality: 75 }).toFile(avifPath);
    const avifStats = fs.statSync(avifPath);
    const avifSizeKB = (avifStats.size / 1024).toFixed(0);

    const reduction = ((1 - avifStats.size / inputStats.size) * 100).toFixed(0);

    console.log(`${filename}: ${inputSizeKB}KB -> WebP: ${webpSizeKB}KB, AVIF: ${avifSizeKB}KB (${reduction}% reduction)`);
  } catch (error) {
    console.error(`Error processing ${filename}:`, error.message);
  }
}

async function main() {
  console.log('Starting image optimization...\n');

  for (const image of targetImages) {
    await optimizeImage(image);
  }

  console.log('\nDone!');
}

main();
