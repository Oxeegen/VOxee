# Brand assets

Vector source of truth: [`voxee-icon.svg`](./voxee-icon.svg) (brand primary `#5E4AF5`).

The following **raster** files are consumed by the app and the packaging config.
They are intentionally not committed as generated placeholders — drop the real
files here (same names) and everything picks them up automatically:

| File | Used by | Notes |
| --- | --- | --- |
| `voxee.png` | tray (Linux/Windows fallback), window icon | 256×256 (or larger square) PNG |
| `voxee.ico` | Windows tray + installer icon (`electron-builder.brand.json`) | multi-size ICO (16–256) |
| `voxeeTemplate@3x.png` | macOS tray (template image) | monochrome, transparent bg |

Until these exist, the app falls back to the upstream icons in `src/assets/`
(`icon.png`, `icon.ico`, `iconTemplate@3x.png`) — nothing breaks.

## Generating rasters from the SVG

```bash
# one-off, requires: npm i -D sharp png-to-ico
node -e "const sharp=require('sharp');(async()=>{for(const s of [16,32,48,64,128,256])await sharp('brand/assets/voxee-icon.svg').resize(s,s).png().toFile('brand/assets/voxee-'+s+'.png');await sharp('brand/assets/voxee-icon.svg').resize(256,256).png().toFile('brand/assets/voxee.png');})()"
node -e "const p=require('png-to-ico');const fs=require('fs');(async()=>{fs.writeFileSync('brand/assets/voxee.ico',await p(['16','32','48','64','128','256'].map(s=>'brand/assets/voxee-'+s+'.png')))})()"
```
