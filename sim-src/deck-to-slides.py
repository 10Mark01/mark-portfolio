#!/usr/bin/env python3
"""
Turn a slide deck PDF into web-ready images for a project card.

Emits, per slide, a full-width WebP and a half-width one for narrow screens,
named so the Slideshow component can find them:

    slide-01.webp      (1400 px wide by default)
    slide-01@0.5x.webp (700 px)

Usage
-----
    python3 deck-to-slides.py deck.pdf ../public/projects/<name>/
    python3 deck-to-slides.py deck.pdf out/ --pages 29,30,32,34-36,40,42
    python3 deck-to-slides.py deck.pdf out/ --width 1600 --quality 85

`--pages` takes 1-based numbers and ranges in the order you list them, so you
can curate and reorder in one go. Output is always renumbered from 01.

Requires: pip3 install pypdfium2 pillow
(Neither needs a compiler or Homebrew — both ship as wheels.)
"""

import argparse
import sys
from pathlib import Path

try:
    import pypdfium2 as pdfium
    from PIL import Image
except ImportError:
    sys.exit("missing dependencies — run: pip3 install pypdfium2 pillow")


def parse_pages(spec, total):
    """'2,5-7,1' -> [2, 5, 6, 7, 1]; preserves the order given."""
    if not spec:
        return list(range(1, total + 1))

    out = []
    for chunk in spec.split(","):
        chunk = chunk.strip()
        if not chunk:
            continue
        if "-" in chunk:
            lo, hi = (int(x) for x in chunk.split("-", 1))
            step = 1 if hi >= lo else -1
            out.extend(range(lo, hi + step, step))
        else:
            out.append(int(chunk))

    bad = [p for p in out if not 1 <= p <= total]
    if bad:
        sys.exit(f"page(s) out of range 1-{total}: {bad}")
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pdf", type=Path)
    ap.add_argument("outdir", type=Path)
    ap.add_argument("--pages", help="e.g. 1,4,9-12 (1-based, order preserved)")
    ap.add_argument("--width", type=int, default=1400, help="full-size width in px (default 1400)")
    ap.add_argument("--quality", type=int, default=82, help="WebP quality 1-100 (default 82)")
    ap.add_argument("--prefix", default="slide", help="filename prefix (default 'slide')")
    args = ap.parse_args()

    if not args.pdf.is_file():
        sys.exit(f"no such file: {args.pdf}")
    args.outdir.mkdir(parents=True, exist_ok=True)

    doc = pdfium.PdfDocument(str(args.pdf))
    pages = parse_pages(args.pages, len(doc))

    print(f"{args.pdf.name}: {len(doc)} pages, exporting {len(pages)} -> {args.outdir}")

    total = 0
    for n, page_no in enumerate(pages, start=1):
        page = doc[page_no - 1]
        pw, _ = page.get_size()

        # Render once at the size we need, rather than rendering big and
        # downsampling — pdfium rasterises text at the target size, which is
        # sharper than any resample of a larger bitmap.
        image = page.render(scale=args.width / pw).to_pil().convert("RGB")

        for width, suffix in ((args.width, ""), (args.width // 2, "@0.5x")):
            if width == image.width:
                variant = image
            else:
                h = round(image.height * width / image.width)
                variant = image.resize((width, h), Image.LANCZOS)

            path = args.outdir / f"{args.prefix}-{n:02d}{suffix}.webp"
            variant.save(path, "WEBP", quality=args.quality, method=6)
            total += path.stat().st_size

        print(f"  p{page_no:<3} -> {args.prefix}-{n:02d}.webp  {image.width}x{image.height}")

    print(f"\n{len(pages)} slides, {total / 1024:.0f} KB total")
    print("Now add a `slides` array to the project in src/data/content.js:")
    print(f"""
    slides: [
      {{ src: '/projects/<name>/{args.prefix}-01.webp', caption: '…' }},
      …
    ],""")


if __name__ == "__main__":
    main()
