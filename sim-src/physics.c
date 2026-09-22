/* =========================================================================
   Physics Simulator — DE1-SoC program, retargeted for the browser.

   The simulation code below is the original, unchanged in substance. What
   changed is the four places it touched hardware:

     pixel buffer      -> Buffer1/Buffer2 in WASM linear memory, presented
                          to a <canvas> by the JS harness
     character buffer  -> char_buf[60][128], overlaid by the harness
     PS/2 data reg     -> ps2_read(), fed a scan-code FIFO from key events
     wait_for_vsync    -> buffer swap + emscripten_sleep(), which yields to
                          the browser instead of spinning on the status bit

   The three background images were `static const short[]` arrays in the
   original (~460 KB of source). They are now filled at load time from PNGs
   so they do not sit in the WASM data segment.

   Behavioural fixes are tagged FIX n in comments and listed in
   PORTING-NOTES.md alongside the line they change.
   ========================================================================= */

#include <emscripten.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <math.h>
#include <string.h>

#define BOX_SIZE 6
#define MAX_BOXES 50
#define LEFT_WALL 35
#define RIGHT_WALL (pistonX - BOX_SIZE - 1)
#define TOP_WALL 95
#define BOTTOM_WALL 165
#define MAX_CHARGES 10
#define GRID_SIZE 16
#define ARROW_SIZE 12
#define FIELD_SCALING 5000.0

#define IMG_PIXELS (320 * 240)

/* ------------------------------------------------------------ devices -- */

short int Buffer1[240][512];
short int Buffer2[240][512];
static char char_buf[60][128];

static unsigned short img_menu[IMG_PIXELS];
static unsigned short img_background[IMG_PIXELS];
static unsigned short img_metal[IMG_PIXELS];

/* Stand-in for the pixel-buffer controller at 0xFF203020.
   [0] = front buffer address, [1] = back buffer address. */
static int vga_regs[4];

volatile short int *pixel_buffer_start;
volatile char *character_buffer = (char *)char_buf;

/* PS/2 data register: reading pops one byte, exactly like the hardware. */
#define PS2_FIFO_SIZE 256
static unsigned char ps2_fifo[PS2_FIFO_SIZE];
static int ps2_head = 0, ps2_tail = 0;

static int ps2_read(void) {
    if (ps2_head == ps2_tail) return 0;           /* RVALID low */
    int b = ps2_fifo[ps2_tail];
    ps2_tail = (ps2_tail + 1) % PS2_FIFO_SIZE;
    return 0x8000 | b;                            /* RVALID | data */
}

/* FIX 8: decode the make/break protocol. The original never filtered the
   0xF0 break prefix, so every key acted twice — once on press, once on
   release — and placing a charge was written as "press p twice" to work
   around it. Returns a make code, or -1 when there is nothing to act on. */
static bool break_pending = false;

static int ps2_next_make(void) {
    for (;;) {
        int ps2 = ps2_read();
        if (!(ps2 & 0x8000)) return -1;                 /* FIFO empty */
        int b = ps2 & 0xFF;
        if (b == 0xF0) { break_pending = true; continue; }
        if (break_pending) { break_pending = false; continue; }  /* key release */
        return b;
    }
}

EMSCRIPTEN_KEEPALIVE void push_scancode(int code) {
    int next = (ps2_head + 1) % PS2_FIFO_SIZE;
    if (next != ps2_tail) {
        ps2_fifo[ps2_head] = (unsigned char)code;
        ps2_head = next;
    }
}

/* ------------------------------------------------------------ helpers -- */

float mySqrt(float number) {
    if (number == 0.0f) return 0.0f;
    float guess = number;
    for (int i = 0; i < 10; i++) guess = 0.5f * (guess + number / guess);
    return guess;
}

void plot_pixel(int x, int y, short int color) {
    /* FIX 5: bounds check. On the board an out-of-range write lands
       somewhere in SDRAM; here it would corrupt linear memory. The cursor
       in the fields simulation can be walked off-screen, so this matters. */
    if (x < 0 || x >= 320 || y < 0 || y >= 240) return;
    pixel_buffer_start[(y << 9) + x] = color;
}

void draw_box(int x, int y, short int color) {
    for (int dx = 0; dx < BOX_SIZE; dx++)
        for (int dy = 0; dy < BOX_SIZE; dy++)
            plot_pixel(x + dx, y + dy, color);
}

void clear_screen(void) {
    for (int x = 0; x < 320; x++)
        for (int y = 0; y < 240; y++)
            plot_pixel(x, y, 0);
}

void clear_text(void) {
    /* FIX 6: the original ran to 80*100, past the end of the buffer. */
    memset(char_buf, ' ', sizeof char_buf);
}

void draw_text(int x, int y, char *text) {
    int length = 0;
    char *temp = text;
    while (*temp) { length++; temp++; }

    int offset = (y << 7) + (x - length / 2);
    while (*text) {
        if (offset >= 0 && offset < 60 * 128)
            *(character_buffer + offset) = *text;
        ++text;
        ++offset;
    }
}

/* 0 = menu, 1 = gas particles, 2 = charges and fields. Read by the UI so
   it can show the keys that apply to the current screen. */
static int g_mode = 0;
static volatile int g_paused = 0;

EMSCRIPTEN_KEEPALIVE int current_mode(void) { return g_mode; }
EMSCRIPTEN_KEEPALIVE void set_paused(int p) { g_paused = p ? 1 : 0; }

void wait_for_vsync(void) {
    int t = vga_regs[0];
    vga_regs[0] = vga_regs[1];
    vga_regs[1] = t;
    /* Idle cheaply when the canvas is off-screen or the tab is hidden,
       instead of running the simulation at 60 Hz for nobody. */
    while (g_paused) emscripten_sleep(120);
    emscripten_sleep(16);          /* yields; the harness blits the front buffer */
}

void draw_line(int x0, int y0, int x1, int y1, short int line_color) {
    int steep = abs(y1 - y0) > abs(x1 - x0);
    if (steep) { int t = x0; x0 = y0; y0 = t; t = x1; x1 = y1; y1 = t; }
    if (x0 > x1) { int t = x0; x0 = x1; x1 = t; t = y0; y0 = y1; y1 = t; }

    int dx = abs(x1 - x0), dy = abs(y1 - y0);
    int error = -(dx / 2), y = y0, y_step = (y0 < y1) ? 1 : -1;

    for (int x = x0; x <= x1; x++) {
        if (steep) plot_pixel(y, x, line_color); else plot_pixel(x, y, line_color);
        error += dy;
        if (error > 0) { y += y_step; error -= dx; }
    }
}

static void blit(const unsigned short *img) {
    for (int x = 0; x < 320; x++)
        for (int y = 0; y < 240; y++)
            plot_pixel(x, y, img[x + 320 * y]);
}

void draw_background(void) { blit(img_background); }

void draw_metal(void) {
    clear_screen();
    clear_text();
    blit(img_metal);
}

void draw_menu(void) {
    clear_screen();
    clear_text();
    blit(img_menu);
}

void draw_piston(int x) {
    draw_line(x, TOP_WALL - 3, x, BOTTOM_WALL + 5, 0x0);
    draw_line(x + 1, TOP_WALL - 3, x + 1, BOTTOM_WALL + 5, 0x0);
    draw_line(x + 2, TOP_WALL - 3, x + 2, BOTTOM_WALL + 5, 0x0);
}

/* --------------------------------------------------------------- state -- */

typedef struct {
    /* FIX 1: x/y were int, so `x += dx * speed` truncated toward zero every
       frame — asymmetric about 0. Leftward particles moved ~2x as fast as
       rightward ones, and at 0 C (speed 0.5) rightward ones did not move at
       all. Floats make the motion symmetric. */
    float x, y;
    int base_dx, base_dy;
    short int color;
} Box;

typedef struct { int x, y; int charge; short int color; } Charge;

Box boxes[MAX_BOXES];
int NUM_BOXES = 30;
float temperature = 25.0;
float max_temp = 100.0;
float min_temp = 0.0;

Charge charges[MAX_CHARGES];
int num_charges = 0;

void create_new_box(void) {
    if (NUM_BOXES < MAX_BOXES) {
        boxes[NUM_BOXES].x = rand() % (110) + 55;
        boxes[NUM_BOXES].y = rand() % (110) + 55;
        boxes[NUM_BOXES].base_dx = ((rand() % 2) ? 1 : -1);
        boxes[NUM_BOXES].base_dy = ((rand() % 2) ? 1 : -1);
        short int r = rand() % 10, g = rand() % 20 + 10, b = rand() % 10 + 20;
        boxes[NUM_BOXES].color = (short int)((r << 11) | (g << 5) | b);
        NUM_BOXES++;
    }
}

float get_speed_from_temperature(float temp) { return 0.5 + (temp / 100.0) * 4.5; }

void remove_box(void) { if (NUM_BOXES > 1) NUM_BOXES--; }

/* ----------------------------------------------------------------- gas -- */

void run_gas_particle_simulation(void) {
    g_mode = 1;
    srand(42);
    for (int i = 0; i < NUM_BOXES; i++) {
        boxes[i].x = rand() % (110) + 55;
        boxes[i].y = rand() % (110) + 55;
        boxes[i].base_dx = ((rand() % 2) ? 1 : -1);
        boxes[i].base_dy = ((rand() % 2) ? 1 : -1);
        short int r = rand() % 10, g = rand() % 20 + 10, b = rand() % 10 + 20;
        boxes[i].color = (short int)((r << 11) | (g << 5) | b);
    }

    vga_regs[1] = (int)(intptr_t)&Buffer1;
    wait_for_vsync();
    pixel_buffer_start = (volatile short int *)(intptr_t)vga_regs[0];
    clear_screen();

    vga_regs[1] = (int)(intptr_t)&Buffer2;
    pixel_buffer_start = (volatile short int *)(intptr_t)vga_regs[1];
    clear_screen();

    int pistonX = 140;
    bool exit_simulation = false;

    while (!exit_simulation) {
        /* FIX 2: the original read the PS/2 data register several times per
           iteration. Each read pops the FIFO, so the RVALID probe threw away
           the byte the next read was looking for. One read per frame. */
        /* FIX 9: drain the whole FIFO each frame. Taking one byte per frame
           meant fast input queued up faster than it was consumed and the
           simulation lagged seconds behind the keyboard. */
        int byte1;
        while ((byte1 = ps2_next_make()) >= 0) {
            if (byte1 == 0x33) { temperature += 1; if (temperature > max_temp) temperature = max_temp; }
            if (byte1 == 0x21) { temperature -= 1; if (temperature < min_temp) temperature = min_temp; }
            if (byte1 == 0x1D) create_new_box();
            if (byte1 == 0x1B) remove_box();
            if (byte1 == 0x23) { if (pistonX < 140) pistonX += 5; }
            if (byte1 == 0x1C) { if (pistonX > 80)  pistonX -= 5; }
            if (byte1 == 0x3A) { exit_simulation = true; break; }
        }
        if (exit_simulation) continue;

        float speed = get_speed_from_temperature(temperature);

        draw_background();
        clear_text();
        draw_piston(pistonX);

        char temp_text[40], particle_text[40], speed_text[40];
        sprintf(temp_text, "Temperature: %.1f C", temperature);
        sprintf(particle_text, "Particles: %d", NUM_BOXES);
        sprintf(speed_text, "Speed: %.1f", speed);

        draw_text(60, 5, "Gas Particle Simulation");
        draw_text(60, 7, temp_text);
        draw_text(60, 8, particle_text);
        draw_text(60, 9, speed_text);
        draw_text(60, 11, "w: Add particle");
        draw_text(60, 12, "s: Remove particle");
        draw_text(60, 13, "a/d: Change box volume");
        draw_text(60, 15, "h: Heat");
        draw_text(60, 16, "c: Cool");
        draw_text(60, 18, "m: Menu");

        for (int i = 0; i < NUM_BOXES; i++) {
            boxes[i].x += boxes[i].base_dx * speed;
            boxes[i].y += boxes[i].base_dy * speed;

            if (boxes[i].x <= LEFT_WALL || boxes[i].x >= RIGHT_WALL) {
                boxes[i].base_dx = -boxes[i].base_dx;
                boxes[i].x = (boxes[i].x <= LEFT_WALL) ? (LEFT_WALL + 1) : (RIGHT_WALL - 1);
            }
            if (boxes[i].y <= TOP_WALL || boxes[i].y >= BOTTOM_WALL) {
                boxes[i].base_dy = -boxes[i].base_dy;
                boxes[i].y = (boxes[i].y <= TOP_WALL) ? (TOP_WALL + 1) : (BOTTOM_WALL - 1);
            }

            for (int j = i + 1; j < NUM_BOXES; j++) {
                if (boxes[i].x < boxes[j].x + BOX_SIZE &&
                    boxes[i].x + BOX_SIZE > boxes[j].x &&
                    boxes[i].y < boxes[j].y + BOX_SIZE &&
                    boxes[i].y + BOX_SIZE > boxes[j].y) {

                    float dx = boxes[i].x - boxes[j].x;
                    float dy = boxes[i].y - boxes[j].y;

                    if (fabsf(dx) > fabsf(dy)) {
                        boxes[i].base_dx = -boxes[i].base_dx;
                        boxes[j].base_dx = -boxes[j].base_dx;
                        float separation = BOX_SIZE + (speed > 1 ? speed : 1);
                        boxes[i].x = (dx > 0) ? boxes[j].x + separation : boxes[j].x - separation;
                    } else {
                        boxes[i].base_dy = -boxes[i].base_dy;
                        boxes[j].base_dy = -boxes[j].base_dy;
                        float separation = BOX_SIZE + (speed > 1 ? speed : 1);
                        boxes[i].y = (dy > 0) ? boxes[j].y + separation : boxes[j].y - separation;
                    }

                    /* FIX 3: these clamps still carried the first version's
                       box (45/175). With walls at 35/95/133/165 they could
                       never fire, so a separated particle sat outside the
                       tank — measured overshoot was 13 px past the top wall
                       and 7 px through the piston — until the next frame's
                       wall test pulled it back. Now they use the walls. */
                    if (boxes[i].x <= LEFT_WALL)   boxes[i].x = LEFT_WALL + 1;
                    if (boxes[i].x >= RIGHT_WALL)  boxes[i].x = RIGHT_WALL - 1;
                    if (boxes[i].y <= TOP_WALL)    boxes[i].y = TOP_WALL + 1;
                    if (boxes[i].y >= BOTTOM_WALL) boxes[i].y = BOTTOM_WALL - 1;

                    if (boxes[j].x <= LEFT_WALL)   boxes[j].x = LEFT_WALL + 1;
                    if (boxes[j].x >= RIGHT_WALL)  boxes[j].x = RIGHT_WALL - 1;
                    if (boxes[j].y <= TOP_WALL)    boxes[j].y = TOP_WALL + 1;
                    if (boxes[j].y >= BOTTOM_WALL) boxes[j].y = BOTTOM_WALL - 1;
                }
            }
        }

        for (int i = 0; i < NUM_BOXES; i++)
            draw_box((int)boxes[i].x, (int)boxes[i].y, boxes[i].color);

        wait_for_vsync();
        pixel_buffer_start = (volatile short int *)(intptr_t)vga_regs[1];
    }
}

/* ------------------------------------------------------------- charges -- */

void run_charges_and_fields_simulation(void) {
    g_mode = 2;
    num_charges = 0;

    vga_regs[1] = (int)(intptr_t)&Buffer1;
    wait_for_vsync();
    pixel_buffer_start = (volatile short int *)(intptr_t)vga_regs[0];
    clear_screen();

    vga_regs[1] = (int)(intptr_t)&Buffer2;
    pixel_buffer_start = (volatile short int *)(intptr_t)vga_regs[1];
    clear_screen();

    int select_x = 160, select_y = 120;
    int x_val = (select_x - 40) / 2, y_val = (select_y - 40) / 2;  /* FIX 4a */
    bool exit_simulation = false;
    bool show_field = true;

    short int red    = (short int)((31 << 11) | (0 << 5) | 0);
    short int blue   = (short int)((0 << 11) | (10 << 5) | 31);
    short int yellow = (short int)((31 << 11) | (31 << 5) | 0);

    while (!exit_simulation) {
        int byte1;                                  /* FIX 2, 8 and 9 */
        while ((byte1 = ps2_next_make()) >= 0) {
            if (byte1 == 0x1B) y_val++;
            if (byte1 == 0x1D) y_val--;
            if (byte1 == 0x1C) x_val--;
            if (byte1 == 0x23) x_val++;

            /* FIX 4b: x_val/y_val were unbounded, so W/A/S/D walked the
               cursor — and any charge placed with it — off the screen. */
            if (x_val < 0) x_val = 0;
            if (x_val > 139) x_val = 139;           /* select_x <= 318 */
            if (y_val < 0) y_val = 0;
            if (y_val > 99) y_val = 99;             /* select_y <= 238 */

            select_x = 40 + (x_val * 2);
            select_y = 40 + (y_val * 2);

            if (byte1 == 0x4D) {
                if (num_charges < MAX_CHARGES) {
                    charges[num_charges].x = select_x;
                    charges[num_charges].y = select_y;
                    charges[num_charges].charge = 1;
                    charges[num_charges].color = red;
                    num_charges++;
                }
            }

            if (byte1 == 0x31) {
                if (num_charges < MAX_CHARGES) {
                    charges[num_charges].x = select_x;
                    charges[num_charges].y = select_y;
                    charges[num_charges].charge = -1;
                    charges[num_charges].color = blue;
                    num_charges++;
                }
            }

            if (byte1 == 0x21) { if (num_charges > 0) num_charges = 0; }
            if (byte1 == 0x3A) { exit_simulation = true; break; }
        }
        if (exit_simulation) continue;

        clear_screen();
        clear_text();
        /* FIX 7: the original wrote `void draw_metal();` here — a function
           declaration, not a call — so the backdrop never rendered and the
           simulation ran on black. */
        draw_metal();

        draw_text(10, 1, "Move with W|A|S|D");
        char x_coord[20], y_coord[20], charge_count[20];
        sprintf(x_coord, "X: %d", select_x); draw_text(5, 3, x_coord);
        sprintf(y_coord, "Y: %d", select_y); draw_text(5, 5, y_coord);
        draw_text(40, 3, "p: place + charge");
        draw_text(40, 4, "n: place - charge");
        draw_text(25, 57, "c: Clear all charges");
        draw_text(48, 57, "m: Return to menu");
        sprintf(charge_count, "Charges: %d/%d", num_charges, MAX_CHARGES);
        draw_text(70, 2, charge_count);

        if (num_charges > 0 && show_field) {
            for (int grid_y = 0; grid_y < GRID_SIZE; grid_y++) {
                for (int grid_x = 0; grid_x < GRID_SIZE; grid_x++) {
                    int x = 40 + (grid_x * 240 / (GRID_SIZE - 1));
                    int y = 40 + (grid_y * 160 / (GRID_SIZE - 1));

                    float Ex = 0, Ey = 0;
                    for (int i = 0; i < num_charges; i++) {
                        float dx = x - charges[i].x;
                        float dy = y - charges[i].y;
                        float dist_squared = dx * dx + dy * dy;
                        if (dist_squared < 25) continue;
                        float strength = charges[i].charge / (dist_squared * mySqrt(dist_squared));
                        strength *= FIELD_SCALING;
                        Ex += dx * strength;
                        Ey += dy * strength;
                    }

                    float magnitude = mySqrt(Ex * Ex + Ey * Ey);
                    if (magnitude > 0.01) {
                        float nx = Ex / magnitude, ny = Ey / magnitude;
                        float arrow_length = (magnitude < ARROW_SIZE) ? magnitude : ARROW_SIZE;
                        float ax = nx * arrow_length, ay = ny * arrow_length;
                        short int arrow_color = 0xFFFF;

                        draw_line(x, y, x + ax, y + ay, arrow_color);
                        float hx1 = x + ax - (nx + ny * 0.3f) * (arrow_length * 0.3f);
                        float hy1 = y + ay - (ny - nx * 0.3f) * (arrow_length * 0.3f);
                        float hx2 = x + ax - (nx - ny * 0.3f) * (arrow_length * 0.3f);
                        float hy2 = y + ay - (ny + nx * 0.3f) * (arrow_length * 0.3f);
                        draw_line(x + ax, y + ay, hx1, hy1, arrow_color);
                        draw_line(x + ax, y + ay, hx2, hy2, arrow_color);
                    }
                }
            }
        }

        draw_box(select_x - 3, select_y - 3, yellow);

        for (int i = 0; i < num_charges; i++) {
            draw_box(charges[i].x - 3, charges[i].y - 3, charges[i].color);
            if (charges[i].charge > 0) {
                draw_line(charges[i].x - 5, charges[i].y, charges[i].x + 5, charges[i].y, 0xFFFF);
                draw_line(charges[i].x, charges[i].y - 5, charges[i].x, charges[i].y + 5, 0xFFFF);
            } else {
                draw_line(charges[i].x - 5, charges[i].y, charges[i].x + 5, charges[i].y, 0xFFFF);
            }
        }

        wait_for_vsync();
        pixel_buffer_start = (volatile short int *)(intptr_t)vga_regs[1];
    }
}

/* --------------------------------------------------- harness interface -- */

EMSCRIPTEN_KEEPALIVE unsigned short *image_ptr(int which) {
    if (which == 0) return img_menu;
    if (which == 1) return img_background;
    return img_metal;
}
EMSCRIPTEN_KEEPALIVE int front_buffer_ptr(void) { return vga_regs[0]; }
EMSCRIPTEN_KEEPALIVE char *char_buffer_ptr(void) { return (char *)char_buf; }

EMSCRIPTEN_KEEPALIVE void run_program(void) {
    vga_regs[1] = (int)(intptr_t)&Buffer1;
    wait_for_vsync();
    pixel_buffer_start = (volatile short int *)(intptr_t)vga_regs[0];
    clear_screen();

    vga_regs[1] = (int)(intptr_t)&Buffer2;
    pixel_buffer_start = (volatile short int *)(intptr_t)vga_regs[1];
    clear_screen();

    while (1) {
        g_mode = 0;
        bool selection_made = false;
        while (!selection_made) {
            /* Redrawn every frame so both buffers hold the menu and the
               swap in wait_for_vsync cannot flicker. */
            draw_menu();
            wait_for_vsync();
            pixel_buffer_start = (volatile short int *)(intptr_t)vga_regs[1];

            int byte1 = ps2_next_make();
            if (byte1 == 0x34) { run_gas_particle_simulation(); selection_made = true; }
            if (byte1 == 0x24) { run_charges_and_fields_simulation(); selection_made = true; }
        }
    }
}
