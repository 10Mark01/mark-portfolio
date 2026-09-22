# Physics simulator — DE1-SoC to WebAssembly

The C in `physics.c` is the board program, retargeted for the browser. The
simulation code is unchanged in substance; what follows is every place it
differs, and why.

Build with `./build.sh` (needs `emcc`; tested on Emscripten 3.1.6). Assets are
regenerated from the original source with `extract-assets.py`.

## Payload

| | raw | gzipped |
|---|---|---|
| `physics.wasm` | 36 KB | 14 KB |
| `physics.js` (emscripten glue) | 25 KB | 7 KB |
| `physics-runtime.js` (harness) | 7 KB | 2 KB |
| three backdrops + font | 108 KB | — (already compressed) |

Nothing loads until the visitor presses **Run it**.

## The four hardware seams

| On the board | In the browser |
|---|---|
| `pixel_buffer_start` → 0xFF203020 buffers | `Buffer1`/`Buffer2` in linear memory; the harness reads the front buffer each `requestAnimationFrame` |
| character buffer → 0x09000000 | `char_buf[60][128]`, composited as 8×8 cells |
| PS/2 data register → 0xFF200100 | `ps2_read()` over a scan-code FIFO fed by key events |
| `wait_for_vsync()` spin on the status bit | buffer swap + `emscripten_sleep(16)` |

`wait_for_vsync` is the only one that needed a compiler flag. The program is
an infinite loop with a blocking wait, which would freeze a tab, so it is
built with `-sASYNCIFY`: `emscripten_sleep` unwinds the stack, returns to the
browser, and resumes where it left off. `main`, both simulation loops and the
menu state machine keep their original structure.

The three backdrops were `static const short[]` arrays making up most of the
original file's 1.8 MB. They are now PNGs loaded at startup and copied into
the module, which keeps them out of the WASM data segment. The RGB565 → RGB888
expansion is reversible, so the values the C sees are bit-identical to the
arrays.

## Behavioural fixes

These are real bugs, not porting artifacts. They apply to the FPGA build too.

**FIX 1 — particle motion was asymmetric.** `Box.x`/`Box.y` were `int`, so
`x += base_dx * speed` truncated toward zero every frame. Truncation is not
symmetric about zero: at 25 °C (speed 1.625) a rightward particle gained 1 px
per frame while a leftward one lost 2. At 0 °C (speed 0.5) rightward particles
did not move at all. Now `float`, cast to `int` only when drawing.

**FIX 2 — the PS/2 register was read several times per iteration.** Reading
the data register pops the FIFO, so `int RVALID = *(PS2) & 0x8000;` consumed
a byte and threw the data away, and the following `*(PS2) & 0xFF` got the
*next* one. Roughly half of all input was discarded. One read per frame now,
held in a local.

**FIX 3 — post-collision clamps used the previous version's walls.** They
pinned to 45/175, from when the box was 40–180. With walls at 35/95/133/165
they could never fire, so a particle pushed out by the separation step sat
outside the tank until the next frame's wall test. Measured overshoot: 13 px
past the top wall, 7 px through the piston. They now use `LEFT_WALL`,
`RIGHT_WALL`, `TOP_WALL`, `BOTTOM_WALL`.

**FIX 4 — selector cursor.** `select_x`/`select_y` were initialised to
160/120 but overwritten with `40 + x_val * 2` on the first valid read, so the
cursor teleported to (40, 40) the moment any key was pressed. `x_val`/`y_val`
were also unbounded, so W/A/S/D walked the cursor — and any charge placed with
it — off the screen. Both are initialised consistently and clamped.

**FIX 5 — `plot_pixel` bounds check.** With the cursor able to leave the
screen, out-of-range writes were reaching memory past the framebuffer.
Harmless-ish in SDRAM, not harmless in WASM linear memory.

**FIX 6 — `clear_text` overran.** It looped to `80 * 100` = 8000 bytes over a
buffer of `60 * 128` = 7680.

**FIX 7 — `draw_metal()` was never called.** Lines 521, 550 and 607 of the
original read `void draw_metal();` — a function *declaration*, which the
compiler accepts silently and which does nothing. The charges-and-fields
simulation ran on a black screen while the finished lab-panel backdrop sat
unused in the binary. Note it starts with `clear_screen()`, so it has to be
called *before* the text and field arrows are drawn.

**FIX 8 — break codes were not filtered.** A key sends its make code on press
and `0xF0` + make code on release, so every keypress acted twice. The charge
placement worked around this with an `is_pressed` latch and the on-screen
instruction "press p twice". With the protocol decoded properly, one press
does one thing and the latch is gone.

**FIX 9 — input was consumed one code per frame.** At 60 Hz, typing faster
than 60 keys/second — or any burst — queued up faster than it drained and the
simulation lagged behind the keyboard. The FIFO is now drained fully each
frame.

## Browser-only additions

- `current_mode()` reports menu / gas / fields so the page can label its
  on-screen buttons. Touch devices have no keyboard, and the whole control
  scheme is WASD/G/E/P/N.
- `set_paused()` lets the page idle the simulation when the canvas is
  off-screen or the tab is hidden, instead of running at 60 Hz for nobody.
- Key handlers are attached to the canvas, not the document, so W/A/S/D do
  not fight page scrolling.
- The 8×8 font is an approximation of the board's character ROM, generated
  from FreeSans at 9 px with `s`, `a` and `g` hand-corrected — the rasteriser
  put a bar through the `s`, making it read as `e`.
