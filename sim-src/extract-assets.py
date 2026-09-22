#!/usr/bin/env python3
"""Pull the three embedded backdrops out of the original DE1-SoC source.

The arrays (menu[], background[], metal[]) are 320x240 RGB565 and account for
almost all of that file's 1.8 MB. Exported as lossless PNGs; the RGB565 ->
RGB888 expansion is reversible, so the harness reconstructs the exact values.

    python3 extract-assets.py path/to/original.c ../public/physics/assets
"""
import re, sys, os
import numpy as np
from PIL import Image

src_path, out_dir = sys.argv[1], sys.argv[2]
src = open(src_path).read()
os.makedirs(out_dir, exist_ok=True)

for name in ("menu", "background", "metal"):
    m = re.search(rf"short\s+{name}\s*\[\s*\]\s*=\s*\{{(.*?)\}}\s*;", src, re.S)
    if not m:
        sys.exit(f"array {name}[] not found")
    vals = [int(v, 16) for v in re.findall(r"0x([0-9a-fA-F]+)", m.group(1))]
    if len(vals) != 320 * 240:
        sys.exit(f"{name}[]: expected 76800 values, got {len(vals)}")

    a = np.array(vals, dtype=np.uint16).reshape(240, 320)
    r = ((a >> 11) & 0x1F).astype(np.uint16)
    g = ((a >> 5) & 0x3F).astype(np.uint16)
    b = (a & 0x1F).astype(np.uint16)
    rgb = np.dstack([(r << 3) | (r >> 2), (g << 2) | (g >> 4), (b << 3) | (b >> 2)]).astype(np.uint8)

    back = ((rgb[:, :, 0].astype(np.uint16) >> 3) << 11) \
         | ((rgb[:, :, 1].astype(np.uint16) >> 2) << 5) \
         | (rgb[:, :, 2].astype(np.uint16) >> 3)
    assert (back == a).all(), f"{name}: round trip is lossy"

    Image.fromarray(rgb).save(os.path.join(out_dir, f"{name}.png"), optimize=True)
    print(f"{name}.png written")
