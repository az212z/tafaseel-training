import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
// Web encodings only: retain the supplied originals, full composition, proportions and colors.
for (const [source, destination, width, quality] of [
  ['logo.jpg', 'logo-small.webp', 192, 88],
  ['logo.jpg', 'logo.webp', 768, 90],
  ['pattern-panel.jpg', 'pattern-panel.webp', 420, 78],
  ['pattern-light.jpg', 'pattern-light.webp', 600, 78],
  ['pattern-blue.jpg', 'pattern-blue.webp', 900, 80],
]) {
  const output = await sharp(path.join(root, 'public/brand', source))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toFile(path.join(root, 'public/brand', destination))
  console.log(`${destination}: ${Math.round(output.size / 1024)} KB`)
}
