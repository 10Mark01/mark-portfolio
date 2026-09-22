/* =========================================================================
   Browser harness for the DE1-SoC physics simulator.

   Presents the WASM module's framebuffer the way the board's VGA controller
   would: the 320x240 pixel buffer scaled 2x to 640x480, with the 80x60
   character buffer composited on top at 8x8 per cell — so the text is at
   full VGA resolution, finer than the pixels, exactly as on hardware.
   ========================================================================= */

const VGA_W = 640, VGA_H = 480;
const FB_W = 320, FB_H = 240, FB_STRIDE = 512;
const CH_COLS = 80, CH_ROWS = 60, CH_STRIDE = 128;

/* PS/2 set 2 make codes — the same values the .c compares against. */
const SCANCODES = {
  g: 0x34, e: 0x24,
  w: 0x1d, a: 0x1c, s: 0x1b, d: 0x23,
  h: 0x33, c: 0x21, m: 0x3a,
  p: 0x4d, n: 0x31,
};

/* RGB565 -> packed RGBA, built once. */
function buildPalette() {
  const lut = new Uint32Array(65536);
  const little = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
  for (let v = 0; v < 65536; v++) {
    const r5 = (v >> 11) & 0x1f, g6 = (v >> 5) & 0x3f, b5 = v & 0x1f;
    const r = (r5 << 3) | (r5 >> 2);
    const g = (g6 << 2) | (g6 >> 4);
    const b = (b5 << 3) | (b5 >> 2);
    lut[v] = little
      ? (255 << 24) | (b << 16) | (g << 8) | r
      : (r << 24) | (g << 16) | (b << 8) | 255;
  }
  return lut;
}

async function fetchBytes(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

/* Decode a PNG back to the RGB565 values the C expects. The export was
   lossless and the 565->888 expansion is reversible, so this round-trips. */
async function loadImage565(url) {
  const img = new Image();
  img.src = url;
  await img.decode();

  const c = document.createElement('canvas');
  c.width = FB_W;
  c.height = FB_H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, FB_W, FB_H);

  const out = new Uint16Array(FB_W * FB_H);
  for (let i = 0, p = 0; i < out.length; i++, p += 4) {
    out[i] = ((data[p] >> 3) << 11) | ((data[p + 1] >> 2) << 5) | (data[p + 2] >> 3);
  }
  return out;
}

/**
 * Boot the simulator onto a canvas.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {string} base  directory holding physics.js, physics.wasm and assets/
 * @returns {Promise<{press:(k:string)=>void, destroy:()=>void, canvas:HTMLCanvasElement}>}
 */
export async function bootPhysics(canvas, base = '/physics') {
  if (typeof WebAssembly !== 'object') throw new Error('WebAssembly unavailable');

  const [font, menu, background, metal] = await Promise.all([
    fetchBytes(`${base}/assets/font8x8.bin`),
    loadImage565(`${base}/assets/menu.png`),
    loadImage565(`${base}/assets/background.png`),
    loadImage565(`${base}/assets/metal.png`),
  ]);

  /* The emscripten glue is a classic script exposing a global factory. */
  if (!window.createPhysicsSim) {
    await new Promise((resolve, reject) => {
      const tag = document.createElement('script');
      tag.src = `${base}/physics.js`;
      tag.onload = resolve;
      tag.onerror = () => reject(new Error('failed to load physics.js'));
      document.head.appendChild(tag);
    });
  }

  const Module = await window.createPhysicsSim({
    locateFile: (f) => `${base}/${f}`,
  });

  const heap16 = () => new Uint16Array(Module.HEAPU8.buffer);
  const heap8 = () => Module.HEAPU8;

  const imagePtr = Module.cwrap('image_ptr', 'number', ['number']);
  const frontPtr = Module.cwrap('front_buffer_ptr', 'number', []);
  const charPtr = Module.cwrap('char_buffer_ptr', 'number', []);
  const pushScan = Module.cwrap('push_scancode', null, ['number']);
  const currentMode = Module.cwrap('current_mode', 'number', []);
  const setPaused = Module.cwrap('set_paused', null, ['number']);

  /* Hand the backdrops to the C side. */
  [menu, background, metal].forEach((img, i) => {
    heap16().set(img, imagePtr(i) >> 1);
  });

  const ctx = canvas.getContext('2d', { alpha: false });
  canvas.width = VGA_W;
  canvas.height = VGA_H;
  ctx.imageSmoothingEnabled = false;

  const frame = ctx.createImageData(VGA_W, VGA_H);
  const px32 = new Uint32Array(frame.data.buffer);
  const palette = buildPalette();
  const WHITE = palette[0xffff];

  let running = true;
  let rafId = 0;

  function present() {
    if (!running) return;
    rafId = requestAnimationFrame(present);

    const fb = frontPtr() >> 1;
    if (!fb) return;
    const mem16 = heap16();
    const mem8 = heap8();

    /* pixel buffer: each source row painted into two output rows */
    for (let y = 0; y < FB_H; y++) {
      let src = fb + y * FB_STRIDE;
      let a = y * 2 * VGA_W;
      let b = a + VGA_W;
      for (let x = 0; x < FB_W; x++) {
        const rgba = palette[mem16[src + x]];
        px32[a++] = rgba;
        px32[a++] = rgba;
        px32[b++] = rgba;
        px32[b++] = rgba;
      }
    }

    /* character buffer: 8x8 cells at full 640x480 resolution */
    const cb = charPtr();
    for (let row = 0; row < CH_ROWS; row++) {
      const rowBase = cb + row * CH_STRIDE;
      for (let col = 0; col < CH_COLS; col++) {
        const ch = mem8[rowBase + col];
        if (ch <= 32 || ch > 126) continue;
        const glyph = (ch - 32) * 8;
        for (let gy = 0; gy < 8; gy++) {
          const bits = font[glyph + gy];
          if (!bits) continue;
          let out = (row * 8 + gy) * VGA_W + col * 8;
          for (let gx = 0; gx < 8; gx++) {
            if (bits & (0x80 >> gx)) px32[out + gx] = WHITE;
          }
        }
      }
    }

    ctx.putImageData(frame, 0, 0);
  }

  /* Push a make code, then the break pair, the way a real keyboard would. */
  function press(key) {
    const code = SCANCODES[key];
    if (code === undefined) return;
    pushScan(code);
    pushScan(0xf0);
    pushScan(code);
  }

  const onKeyDown = (event) => {
    const key = event.key.toLowerCase();
    if (!(key in SCANCODES)) return;
    event.preventDefault();          // keeps w/a/s/d off the page scroll
    pushScan(SCANCODES[key]);
  };

  const onKeyUp = (event) => {
    const key = event.key.toLowerCase();
    if (!(key in SCANCODES)) return;
    event.preventDefault();
    pushScan(0xf0);
    pushScan(SCANCODES[key]);
  };

  /* Scoped to the canvas, so the page keeps its own keyboard behaviour. */
  canvas.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('keyup', onKeyUp);

  present();
  Module.ccall('run_program', null, [], [], { async: true });

  return {
    canvas,
    press,
    /** 0 = menu, 1 = gas particles, 2 = charges and fields */
    mode: () => currentMode(),
    setPaused: (p) => setPaused(p ? 1 : 0),
    destroy() {
      running = false;
      setPaused(1);
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('keyup', onKeyUp);
    },
  };
}
