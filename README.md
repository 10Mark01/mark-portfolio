# marksamuel.dev — personal site

React + Vite. No UI framework, no CSS library, no component kit — about 900
lines of JSX and one stylesheet, which is the point: it should be readable by
whoever clicks through from a résumé.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle into dist/
npm run preview  # serve the built bundle locally
```

Node 18 or newer.

## Where things are

```
public/
  projects/              ← drop project photos here
  resume.pdf             ← not in the repo yet; the header link expects it
src/
  data/content.js        ← every word on the site lives here
  App.jsx                ← page composition + filter state
  styles.css             ← design tokens at the top, sections below
  hooks/
    useTheme.js          ← light/dark, persisted, follows the OS until you choose
    useActiveSection.js  ← IntersectionObserver → which nav item is lit
  lib/richText.jsx       ← renders **bold** inside content strings
  components/
    Floorplan.jsx        ← the interactive die diagram
    ExperienceCard.jsx   ProjectCard.jsx   ParametersTable.jsx
    Masthead.jsx  Section.jsx  SectionNav.jsx  ThemeToggle.jsx
```

**To change content, you only open `src/data/content.js`.** The components
read from it and hold no copy of their own.

## The floorplan

The diagram at the top is the page's main control. Each block is a real
button — click one and both the experience list and the project list filter to
entries tagged with that block's `id`; click it again to clear. A section with
no matches hides itself rather than showing an empty state.

The wiring:

```js
// a block
{ id: 'rtl', label: 'RTL', sub: 'VERILOG · FPGA', x: 214, y: 46, w: 146, h: 46 }

// anything that block should surface
{ id: 'physics', domains: ['rtl'], ... }
```

`x/y/w/h` are SVG user units in a fixed 560 × 210 viewBox, scaled by CSS. Keep
blocks inside the core boundary (32,32 → 528,164) or they overlap the pad
ring. Add a block, put its id in something's `domains`, and filtering works
with no other change.

## What still needs you

### 1. Résumé PDF

Drop it at `public/resume.pdf` and the existing header link works. Until then
that link renders in placeholder styling.

### 2. Photos (optional, but they help)

Every project has an `image` field, currently `null`. Put a file in
`public/projects/` and point at it:

```js
image: '/projects/amplifier.jpg',
```

Worth having, roughly in order of payoff:

- **The Class D amplifier board** — a bare PCB photographed straight down on a
  plain surface is the single most convincing image an EE portfolio can carry.
- **The battle bot** — ideally mid-competition. First place out of 20+ teams
  deserves a picture.
- **The robotic arm**, mid-write. A short GIF would be better than a still; if
  you have video, `ffmpeg -i clip.mov -vf fps=12,scale=800:-1 arm.gif`.
- **Piano Tiles and the physics sim on the VGA output** — a photo of the actual
  monitor, DE1-SoC in frame, is more interesting than a screenshot.
- **The gesture controller** — the STM32 and the IMU, wires and all.

A card with no photo reads fine. A card with a blurry photo does not, so leave
`null` rather than forcing it.

Keep files under ~300 KB each. `sips -Z 1400 photo.jpg` on macOS, or any
image compressor.

### 3. GitHub links

Each project takes an `href`. Fill in the ones with public repos and the title
becomes a link; leave the rest `null`.

### 4. Read the AMD entry once more

Your résumé names the process nodes and some internal workflow detail. A PDF
sent to one recruiter and a page Google indexes are different exposure, so the
version here keeps the engineering and drops the node names. Put them back if
you're comfortable — you know your team's norms better than this file does.

Your phone number is also deliberately not on the site. Email and LinkedIn are
enough, and a phone number on a public page gets scraped.

## Deploying

**Vercel** — push to GitHub, import the repo, accept the defaults. It detects
Vite. Free, and gives you a `.vercel.app` URL plus a custom domain if you buy
one.

**Netlify** — same flow. Build command `npm run build`, publish directory
`dist`.

**GitHub Pages** — works, but needs `base` set in `vite.config.js` to
`'/<repo-name>/'` (there's a commented line ready) and a workflow to publish
`dist`. Only worth it if you specifically want a `github.io` URL.

The domain is worth ~$12/year. `marksamuel.dev` on a résumé reads differently
from `mark-portfolio-final-v2.vercel.app`.

## Notes on a few decisions

Things an interviewer might ask about, which is half the reason they're here:

- **Theme has no flash.** An inline script in `index.html` resolves the theme
  and stamps `data-theme` on `<html>` before React mounts, so the first painted
  frame is correct. `useTheme` reads that stamp back as its initial state
  rather than recomputing it, keeping React in agreement with what's on screen.
- **`useActiveSection` uses IntersectionObserver, not a scroll handler.** The
  browser does the geometry off the main thread and only calls back when a
  threshold is crossed, so an idle page costs nothing. The `rootMargin`
  narrows detection to a band near the top of the viewport — without it, a tall
  section and a short one intersect at once and the nav flickers.
- **One `useMemo` returns both filtered lists.** They derive from the same
  input and are consumed in the same render, so splitting them into two memos
  would mean two dependency checks for one decision.
- **No `dangerouslySetInnerHTML`.** `renderEmphasis` splits on a capturing
  regex so marked runs land on odd indices and everything else stays a plain
  string — nothing in the content file can inject markup.
- **SVG blocks are keyboard-operable.** An SVG `<g>` gets no button behaviour
  for free, so each carries `role`, `tabIndex` and `aria-pressed` and handles
  Enter and Space itself. Focus is drawn as a dashed stroke because SVG ignores
  `outline-offset`.
