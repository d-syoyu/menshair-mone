// scripts/generate-icons.mjs
// ファビコン・アイコン生成スクリプト

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourceImage = join(__dirname, '../public/IMG_7072.jpeg');
const publicDir = join(__dirname, '../public');

async function generateIcons() {
  console.log('🎨 アイコンを生成中...\n');

  try {
    // favicon-32x32.png
    await sharp(sourceImage)
      .resize(32, 32, { fit: 'cover' })
      .png()
      .toFile(join(publicDir, 'favicon-32x32.png'));
    console.log('✅ favicon-32x32.png');

    // favicon-16x16.png
    await sharp(sourceImage)
      .resize(16, 16, { fit: 'cover' })
      .png()
      .toFile(join(publicDir, 'favicon-16x16.png'));
    console.log('✅ favicon-16x16.png');

    // apple-touch-icon.png (180x180)
    await sharp(sourceImage)
      .resize(180, 180, { fit: 'cover' })
      .png()
      .toFile(join(publicDir, 'apple-touch-icon.png'));
    console.log('✅ apple-touch-icon.png');

    // android-chrome-192x192.png
    await sharp(sourceImage)
      .resize(192, 192, { fit: 'cover' })
      .png()
      .toFile(join(publicDir, 'android-chrome-192x192.png'));
    console.log('✅ android-chrome-192x192.png');

    // android-chrome-512x512.png
    await sharp(sourceImage)
      .resize(512, 512, { fit: 'cover' })
      .png()
      .toFile(join(publicDir, 'android-chrome-512x512.png'));
    console.log('✅ android-chrome-512x512.png');

    // OGP画像 (1200x630)
    await sharp(sourceImage)
      .resize(1200, 630, { fit: 'cover' })
      .jpeg({ quality: 90 })
      .toFile(join(publicDir, 'og-image.jpg'));
    console.log('✅ og-image.jpg (OGP)');

    console.log('\n🎉 すべてのアイコンを生成しました！');
  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

generateIcons();
