import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publishDir = path.join(root, 'docs')

// docs/ contains only generated static output for GitHub Pages.
await rm(publishDir, { recursive: true, force: true })
await mkdir(publishDir, { recursive: true })
await cp(path.join(root, 'dist'), publishDir, { recursive: true })
await writeFile(path.join(publishDir, '.nojekyll'), '')
await writeFile(
  path.join(publishDir, '404.html'),
  `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>الصفحة غير موجودة | تفاصيل</title><meta http-equiv="refresh" content="0;url=/tafaseel-training/#/not-found"></head><body><p>هذه الصفحة غير موجودة.</p><a href="/tafaseel-training/">العودة إلى مركز تفاصيل للتدريب</a></body></html>`,
)
console.log('GitHub Pages output prepared in docs/')
