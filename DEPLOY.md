# Deploying

The site is a static Vite build. Every push to `main` rebuilds and redeploys.

## First time

```bash
./setup-repo.sh
```

Initialises git, commits, and creates + pushes the GitHub repo (via `gh` if
it's installed; otherwise it prints the two commands to finish by hand).

Then import the repo at <https://vercel.com/new>. Vercel detects Vite and
needs no configuration — build command `npm run build`, output `dist`.

## After that

```bash
git add -A
git commit -m "what changed"
git push
```

Live in about 30 seconds. Pushing a branch instead of `main` gets its own
preview URL, so you can look at a change before merging it.

## Things that will break the deploy if you change them

**Don't gitignore `public/physics/`.** Vercel runs `npm run build` and
nothing else. It has no Emscripten toolchain, so it cannot rebuild
`physics.wasm` — the compiled module has to be committed. If the simulator
404s on the live site, this is why.

**Don't use GitHub Pages without setting `base`.** Pages serves from
`https://<user>.github.io/<repo>/`, but every asset path in the simulator is
absolute (`/physics/physics.wasm`). On a subpath they all 404. Vercel and
Netlify serve from the root, which is why the paths are written this way. If
you do want Pages, uncomment `base` in `vite.config.js`, set it to
`'/<repo>/'`, and rebuild.

**`.wasm` must be served as `application/wasm`.** Vercel does this by
default. A host that serves it as `application/octet-stream` forces a slower
fallback instantiation, and some block it outright.

## Rebuilding the simulator

Only needed if you change `sim-src/physics.c`. Requires Emscripten:

```bash
cd sim-src
./build.sh          # writes ../public/physics/
```

Then commit the regenerated files in `public/physics/`. See
`sim-src/PORTING-NOTES.md` for what the port changes and why.

## Keep the project out of iCloud

If this folder lives in `~/Desktop` or `~/Documents` with iCloud Drive
syncing them, iCloud will evict files you're actively using. Symptoms: Vite
taking 10+ seconds to start, and `vite.config.js changed, restarting
server... config must export or return an object` when nothing changed. Move
it somewhere iCloud doesn't sync:

```bash
mv ~/Desktop/mark-portfolio ~/dev/
```
