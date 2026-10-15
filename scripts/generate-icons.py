#!/usr/bin/env python3
"""Generate PNG icons for Atlas Academy from the SVG source."""
import os
import json
import shutil
import cairosvg

OUT_DIR = "/home/z/my-project/src/app"
PUBLIC_DIR = "/home/z/my-project/public"
SVG_PATH = f"{PUBLIC_DIR}/atlas-icon.svg"

SIZES = [
    (16, "favicon-16x16.png"),
    (32, "favicon-32x32.png"),
    (180, "apple-icon.png"),     # Apple touch icon
    (192, "icon-192x192.png"),   # PWA
    (512, "icon-512x512.png"),   # PWA
]

print(f"Rendering PNGs from {SVG_PATH}...")
for size, filename in SIZES:
    output_path = os.path.join(OUT_DIR, filename)
    cairosvg.svg2png(
        url=SVG_PATH,
        write_to=output_path,
        output_width=size,
        output_height=size,
    )
    file_size = os.path.getsize(output_path)
    print(f"  ✓ {filename} ({size}x{size}) — {file_size} bytes")

# Move the PWA-sized icons to /public so they're served at /icon-*.png
for size in (192, 512):
    src = f"{OUT_DIR}/icon-{size}x{size}.png"
    dst = f"{PUBLIC_DIR}/icon-{size}x{size}.png"
    shutil.move(src, dst)
    print(f"  → moved {size}x{size} to /public")

# Write web manifest for PWA
manifest = {
    "name": "Atlas Academy",
    "short_name": "Atlas",
    "description": "Adaptive Forex & Binary Options Learning Platform",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#0e2a20",
    "theme_color": "#1d4d3a",
    "icons": [
        {"src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png"},
        {"src": "/icon-512x512.png", "sizes": "512x512", "type": "image/png"},
    ],
}
manifest_path = f"{PUBLIC_DIR}/manifest.json"
with open(manifest_path, "w") as f:
    json.dump(manifest, f, indent=2)
print(f"  ✓ manifest.json written")

print("\nAll icons generated successfully.")
