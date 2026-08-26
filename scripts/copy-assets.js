import fs from 'fs'
import path from 'path'

const artifactDir = 'C:\\Users\\MSI\\.gemini\\antigravity\\brain\\e6a38f76-e06b-4b81-9480-1069e701bd77'
const ogImageSource = path.join(artifactDir, 'og_image_preview_1787725141117.jpg')
const appIconSource = path.join(artifactDir, 'app_icon_square_1787725378102.jpg')

const publicDir = path.resolve('public')

if (fs.existsSync(ogImageSource)) {
  fs.copyFileSync(ogImageSource, path.join(publicDir, 'og-image.jpg'))
  fs.copyFileSync(ogImageSource, path.join(publicDir, 'og-image.png'))
  console.log('Copied og-image.jpg and og-image.png to public/')
}

if (fs.existsSync(appIconSource)) {
  fs.copyFileSync(appIconSource, path.join(publicDir, 'apple-touch-icon.png'))
  fs.copyFileSync(appIconSource, path.join(publicDir, 'favicon-32x32.png'))
  fs.copyFileSync(appIconSource, path.join(publicDir, 'favicon.png'))
  console.log('Copied apple-touch-icon.png and favicons to public/')
}
