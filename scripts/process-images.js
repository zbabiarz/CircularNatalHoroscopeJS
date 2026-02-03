import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function processImages() {
  const cosmicPath = './cosmic-bg.jpeg';
  const discoPath = './disco-ball.png';

  const cosmicMeta = await sharp(cosmicPath).metadata();
  console.log('Cosmic BG dimensions:', cosmicMeta.width, 'x', cosmicMeta.height);

  const discoMeta = await sharp(discoPath).metadata();
  console.log('Disco Ball dimensions:', discoMeta.width, 'x', discoMeta.height);

  const cosmicBuffer = await sharp(cosmicPath)
    .resize(600, null, { withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();

  const cosmicBase64 = cosmicBuffer.toString('base64');
  console.log('Cosmic BG base64 length:', cosmicBase64.length, 'chars');

  const discoBuffer = await sharp(discoPath)
    .resize(150, null, { withoutEnlargement: true })
    .png({ compressionLevel: 9, quality: 80 })
    .toBuffer();

  const discoBase64 = discoBuffer.toString('base64');
  console.log('Disco Ball base64 length:', discoBase64.length, 'chars');

  const outputDir = './src/data';

  fs.writeFileSync(
    path.join(outputDir, 'cosmic-bg-base64.txt'),
    cosmicBase64
  );

  fs.writeFileSync(
    path.join(outputDir, 'disco-ball-base64.txt'),
    discoBase64
  );

  console.log('Base64 files saved to src/data/');
}

processImages().catch(console.error);
