const fs = require('fs');
const path = require('path');

// Create the directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public', 'img', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple 1x1 pixel PNG file for icon-192x192.png
const icon192 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), icon192);

// Create a simple 1x1 pixel PNG file for icon-512x512.png
const icon512 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), icon512);

console.log('Icon files created successfully!'); 