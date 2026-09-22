/**
 * Every word on the site lives in this file.
 *
 * Components read from here and hold no copy of their own, so you can rewrite
 * the site without opening a .jsx file.
 *
 * `domains` fields reference the block ids below. That is what wires the
 * floorplan to the experience and project lists — click a block, both filter.
 */

export const profile = {
  name: 'Mark Samuel',
  eyebrow: ['Electrical & Computer Engineering', 'University of Toronto', 'Class of 2T8'],
  lede:
    'Dean\'s List engineer at the University of Toronto, currently on AMD’s PCIe IPE team. Looking for hardware engineering internships — digital, embedded, analog, PCB — for Winter and Summer 2027.',
  credentials: [
    'Minors in AI/ML and Robotics/Mechatronics',
    'Certificate in Religious Studies',
  ],
  spec: [
    { label: 'Seeking', value: 'Winter & Summer 2027', highlight: true },
    { label: 'Now', value: 'AMD — PCIe IPE' },
    { label: 'Focus', value: 'Digital · Embedded · Analog' },
    { label: 'Based', value: 'Toronto, ON' },
    { label: 'Graduating', value: 'May 2028' },
  ],
  links: [
    { label: 'mark.samuel@mail.utoronto.ca', href: 'mailto:mark.samuel@mail.utoronto.ca' },
    { label: 'linkedin.com/in/ms-ee', href: 'https://linkedin.com/in/ms-ee' },
    { label: 'Résumé (PDF)', href: '/resume.pdf' },
  ],
};

/**
 * Floorplan blocks.
 *
 * x / y / w / h are SVG user units inside a 560 × 210 viewBox. Keep blocks
 * inside the core boundary (32,32 to 528,164) or they overlap the pad ring.
 */
export const blocks = [
  { id: 'signoff',  label: 'INTEGRATION & IMPLEMENTATION', x: 48,  y: 46,  w: 150, h: 102 },
  { id: 'rtl',      label: 'DIGITAL DESIGN',   x: 214, y: 46,  w: 146, h: 46  },
  { id: 'embedded', label: 'EMBEDDED SYSTEMS', x: 214, y: 102, w: 146, h: 46  },
  { id: 'pcb',      label: 'ANALOG HARDWARE',  x: 376, y: 46,  w: 136, h: 46  },
  { id: 'ml',       label: 'SOFTWARE',         x: 376, y: 102, w: 136, h: 46  },
];

/** Copper routing between blocks. Decoration — edit or delete freely. */
export const traces = [
  'M198 69 H206 V62 H214',
  'M198 125 H206 V132 H214',
  'M360 69 H368 V62 H376',
  'M360 125 H368 V132 H376',
  'M287 92 V102',
  'M444 92 V102',
];

/** Via markers sit on the trace corners. */
export const vias = [
  { x: 204, y: 60 },
  { x: 204, y: 130 },
  { x: 366, y: 60 },
  { x: 366, y: 130 },
];

/**
 * Experience. Ordered most recent first.
 *
 * A note on the AMD entry: your résumé names the process nodes and some
 * internal workflow detail. A PDF sent to one recruiter and a page Google
 * indexes are different exposure, so the version here keeps the engineering
 * and drops the specifics. Put them back if you are comfortable — they are
 * in your résumé, and you know your team's norms better than I do.
 */
export const experience = [
  {
    id: 'amd',
    logo: { src: '/logos/amd.webp', alt: 'AMD' },
    role: 'Silicon Implementation & Integration Intern',
    team: 'PCIe Subsystem',
    org: 'AMD',
    location: 'Toronto, ON',
    period: 'May 2025 — present',
    domains: ['signoff', 'rtl', 'ml'],
    bullets: [
      'Own the team’s Tcl async-FIFO extraction script, run under Synopsys Design Compiler. It reads RTL alongside build-time feature flags to classify edge cases correctly — continuous streaming phase-adjustment FIFOs among them — and produces per-tile reference lists, pinned to a changelist, that partner teams check for post-synthesis netlist equivalence and for pointer race conditions across gray-code crossings.',
      'Triage RTL lint, CDC and compile-elaborate violations at the core level across concurrent PCIe SoC programs, driving root cause with the designers and usually proposing the fix.',
      'Drove the design waiver count toward zero — when one appeared, tracked down the owner and pushed for either a fix to the underlying violation or a documented sign-off taking responsibility that it was safe to keep. Third-party IP is the real exception: a rule written for our design style doesn’t always apply to someone else’s, so some of those waivers are the correct call.',
      'Replaced a manual connectivity-extract → Excel → hand-drawn diagram workflow with an automated Verilog parser → Postgres → FastAPI → React Flow pipeline, built end to end and verified against SQL at every hop.',
    ],
    stack: ['Tcl', 'Design Compiler', 'SpyGlass', 'Questa CDC', 'VCS', 'Perforce', 'React Flow'],
  },
  {
    id: 'robotics',
    logo: { src: '/logos/utra.webp', alt: 'University of Toronto Robotics Association' },
    role: 'Team Leader — Battle Bots',
    org: 'UofT Robotics Association',
    location: 'Toronto, ON',
    period: 'Sep 2024 — Mar 2025',
    domains: ['embedded'],
    bullets: [
      'Led six people to first place against 20+ teams. Designed the chassis in AutoCAD around IR and ultrasonic sensing for opponent tracking.',
      'Moved sensor handling onto hardware interrupts in Arduino C++ for deterministic response, which took detection error from 70% down to 10%.',
      'Implemented PWM motor drivers and debugged high-speed spin stability — synchronizing actuator response with control logic across the hardware/software boundary under real-time constraints.',
    ],
    stack: ['Arduino C++', 'Interrupts', 'PWM', 'AutoCAD'],
  },
  {
    id: 'enwave',
    logo: { src: '/logos/enwave.webp', alt: 'Enwave Energy Corporation' },
    role: 'Operations Intern',
    org: 'Enwave Energy Corporation',
    location: 'Toronto, ON',
    period: 'May 2024 — Aug 2024',
    domains: ['embedded'],
    bullets: [
      'Monitored industrial chiller performance through temperature sensors and magnetic flow meters, validating system flow rates and efficiency.',
      'Built automated Excel tooling to pull and graph HVAC data out of a Proficy historian, cutting a 30-minute data load to under a minute.',
      'Supported control system validation and sensor calibration, and contributed engineering calculations to compliance documentation behind $100K+ in energy incentives.',
    ],
    stack: ['Excel automation', 'Proficy', 'Instrumentation'],
  },
];

/**
 * Projects, most recent first.
 *
 * `image` is an optional path under public/ — e.g. '/projects/pcb.jpg'. Leave
 * it null and the card renders text only, which is better than a bad photo.
 * `href` makes the title a link.
 */
export const projects = [
  {
    id: 'physics',
    tag: 'RTL / FPGA',
    date: 'Mar 2025',
    domains: ['rtl'],
    title: 'Physics Simulator on a Custom RISC-V Soft CPU',
    result: 'Playable right here — the DE1-SoC C, compiled to WebAssembly',
    body:
      'A physics simulator running on a RISC-V soft core I built on a DE1-SoC, with VGA output. Getting it real-time meant optimizing floating-point operations, memory access patterns and control flow against the FPGA’s timing and resource limits. Correctness went through ModelSim first, then on-board debugging.',
    stack: ['Verilog', 'C', 'RISC-V', 'DE1-SoC', 'ModelSim', 'VGA'],
    image: null,
    href: null,
    // Compiled to WebAssembly and playable in the page. See public/physics/.
    sim: '/physics',
  },
  {
    id: 'gesture',
    tag: 'Embedded',
    date: 'Mar 2026',
    domains: ['embedded'],
    title: 'Gesture-Based Presentation Controller',
    result: 'Third of 100+ course project groups',
    body:
      'A wireless gesture controller on an STM32F446ZE with a BNO055 IMU, talking to an ESP32 acting as a BLE HID device. IMU quaternion data maps to cursor motion and slide-change gestures over a UART link between the two MCUs. I characterized end-to-end latency, bandwidth and power across the sensing, firmware, wireless and feedback subsystems, because on a controller people hold in their hand, latency is the feature.',
    stack: ['STM32F446ZE', 'BNO055', 'ESP32', 'BLE HID', 'C', 'UART'],
    image: null,
    href: null,
    video: {
      src: '/projects/swishy/demo.mp4',
      poster: '/projects/swishy/demo-poster.jpg',
      caption:
        'The controller driving the deck that documents it — tilt to move the cursor, swipe to change slides, over BLE HID with nothing installed on the laptop.',
    },
    slides: [
      {
        src: '/projects/swishy/slide-01.webp',
        caption:
          'System block diagram — IMU over I2C into the STM32, STM32 to ESP32 over UART, ESP32 to the laptop over BLE.',
      },
      {
        src: '/projects/swishy/slide-02.webp',
        caption:
          'STM32 firmware: quaternions become dx/dy, a deadzone filters hand tremor, a threshold separates swipes from cursor motion.',
      },
      {
        src: '/projects/swishy/slide-03.webp',
        caption:
          'ESP32 dispatch: a UART packet is parsed as either a gesture — left/right arrow key — or a relative mouse move, then sent as BLE HID.',
      },
      {
        src: '/projects/swishy/slide-04.webp',
        caption:
          'A remote cannot be tethered, so battery power was a requirement rather than a convenience. A 9 V cell feeds a breadboard module supplying the 5 V and 3.3 V rails — and because the Nucleo is wired to expect USB power, that meant soldering headers into its empty E5V and ground pads and moving the jumper to accept external 5 V.',
      },
      {
        src: '/projects/swishy/slide-05.webp',
        caption:
          'The 8 Ω 2 W speaker drew more current than anything else in the system, and a 9 V cell is poor at sustained high-current loads — a drain on runtime and a reliability risk. Useful feedback, wrong trade for a portable device, so it was cut in favour of battery life and stable operation.',
      },
      {
        src: '/projects/swishy/slide-06.webp',
        caption:
          'The STM32 was a fixed requirement; the ESP32 was the engineering call. An HC-05 would only have carried bytes over UART, leaving a host-side script to translate them into input — the ESP32 instead presents as a real BLE HID mouse and keyboard, so the remote drives any laptop with nothing installed on it. It also split the bring-up cleanly: sensing on one board, HID on the other, joined over UART.',
      },
    ],
  },
  {
    id: 'crop',
    tag: 'ML',
    date: 'Aug 2025',
    domains: ['ml'],
    title: 'Crop Disease Classification',
    result: '96.44% on a corn dataset the model had never seen',
    body:
      'LargeNet — an AlexNet-derived CNN with batch normalization, dropout and adaptive pooling — pretrained on PlantDoc and PlantVillage with **every corn image held out**, then fine-tuned on the CD&S field dataset. Holding corn out of pretraining is the point: it makes the score on unseen corn a measure of transfer rather than memorization. Test accuracy landed at 94.10% against a baseline CNN’s 86.81%, and on a wholly unseen dataset the model scored higher than its own validation accuracy.',
    stack: ['Python', 'PyTorch', 'CNN', 'Transfer learning'],
    image: null,
    href: null,
    doc: {
      href: '/projects/corn/corn-disease-report.pdf',
      thumb: '/projects/corn/report-page1.jpg',
      label: 'Read the report',
      title: 'Corn Crop Disease Classification',
      meta: 'APS360 final report · 9 pages · PDF, 6.9 MB',
    },
  },
  {
    id: 'responder',
    tag: 'Full-stack',
    date: 'Mar 2025',
    domains: ['ml'],
    title: 'AI First Responder Assistant',
    result: 'Working MVP in 48 hours, recognized for real-world impact',
    body:
      'A hackathon build: React and Firebase, QR-coded patient profiles, and a Gemini-backed chatbot answering context-aware medical questions against a Firestore-held record. Shipped end to end inside the 48 hours.',
    stack: ['React', 'Firebase', 'Firestore', 'JavaScript', 'Gemini'],
    image: null,
    href: null,
  },
  {
    id: 'amplifier',
    tag: 'PCB / Analog',
    date: 'Jan 2025',
    domains: ['pcb'],
    title: 'Class D Power Amplifier & Low-Pass Filter',
    result: 'Two of three requirements met — and a root cause for the third',
    body:
      'A Class D amplifier for an RF transmit chain. I explored BJT, comparator and MOSFET topologies in LTSpice and went with parallel MOSFETs to carry the current at frequency, fabricated and hand-assembled a 2-layer board with ground planes and decoupling, and wrote Python to automate the bandwidth, cutoff and waveform measurements off the bench instruments. Amplification across 8–16 MHz passed, and harmonic distortion came in at **0.58% against a 10% limit**. Output power did not clear its 1 W floor — and the more useful half of the work was finding out exactly why: a gate driver whose 45 ns propagation delay consumed 63% of the switching cycle, and an OUT_SNK pin never wired to the MOSFET gates, so they could be driven high but never pulled low. Both are specified fixes now. The deck walks the diagnosis.',
    stack: ['LTSpice', 'Altium', 'MOSFET', '2-layer PCB', 'Python'],
    image: null,
    href: null,
    slides: [
      {
        src: '/projects/amplifier/slide-01.webp',
        caption:
          'The routed two-layer board beside the assembled article — hand-soldered, jumper wires and all.',
      },
      {
        src: '/projects/amplifier/slide-02.webp',
        caption:
          'The whole radio: a receive chain along the bottom, a transmit chain along the top. Subsystem F sits at the end of the transmit chain, amplifying the modulated signal and driving the antenna.',
      },
      {
        src: '/projects/amplifier/slide-03.webp',
        caption:
          'What comes in is a modulated, low-power RF signal. The design philosophy throughout was efficiency — cut power loss, keep switching fast — because range and clarity both follow from it.',
      },
      {
        src: '/projects/amplifier/slide-04.webp',
        caption:
          'What the subsystem has to do: take the signal from Subsystem E, enter transmit mode on an enable line, deliver 1–10 W continuous, and suppress harmonics on the way out. The antenna is modelled as a 50 Ω dummy load.',
      },
      {
        src: '/projects/amplifier/slide-05.webp',
        caption:
          'The design broken into stages. What makes it unusual is splitting amplification across three separate stages rather than doing it in one, colour-coded here against the schematic.',
      },
      {
        src: '/projects/amplifier/slide-06.webp',
        caption:
          'Stage I, the comparator. It takes the 1 Vpp input up to 4.5–5 V, squaring the signal for the switching stage that follows.',
      },
      {
        src: '/projects/amplifier/slide-07.webp',
        caption:
          'Stage II, the gate driver — it strengthens the comparator output so the transistors switch fully on and off instead of lingering between. Note the two output pins, OUT_SRC and OUT_SNK. That detail comes back.',
      },
      {
        src: '/projects/amplifier/slide-08.webp',
        caption:
          'The Class D stage. Between milestones we replaced a series BJT–MOSFET pair with a gate driver feeding parallel MOSFETs, for more current into the load. Class D was chosen for efficiency and low heat.',
      },
      {
        src: '/projects/amplifier/slide-09.webp',
        caption:
          'A Butterworth output filter, picked to avoid passband ripple and favour amplitude accuracy over phase linearity — linear phase meaning every frequency is delayed by exactly the same amount.',
      },
      {
        src: '/projects/amplifier/slide-10.webp',
        caption:
          'The four stages end to end: comparator, gate driver, Class D amplifier, output filter.',
      },
      {
        src: '/projects/amplifier/slide-11.webp',
        caption:
          'The requirements we were held to, as a table: output between 8–16 MHz, THD under 10% at 14 MHz, 1–10 W into 50 Ω, from +5 V and +12 V rails.',
      },
      {
        src: '/projects/amplifier/slide-12.webp',
        caption:
          'Requirement 1 — amplification across 8–16 MHz, targeting 14 MHz.',
      },
      {
        src: '/projects/amplifier/slide-13.webp',
        caption:
          'Component values for the inductors and capacitors were calculated to put the cutoff at 16 MHz.',
      },
      {
        src: '/projects/amplifier/slide-14.webp',
        caption:
          'Measured on the oscilloscope, driven from the test board and function generator, sampled at the 50 Ω load: 14.04 MHz in, 13.97 MHz out.',
      },
      {
        src: '/projects/amplifier/slide-15.webp',
        caption:
          'The band matters because Subsystem A, the receiver, only detects between 8 and 16 MHz — anything outside would be filtered out at the far end. It is also the amateur allocation, so transmitting outside it would interfere with other services.',
      },
      {
        src: '/projects/amplifier/slide-16.webp',
        caption:
          'Requirement 1: met.',
      },
      {
        src: '/projects/amplifier/slide-17.webp',
        caption:
          'Requirement 2 — total harmonic distortion below 10% with a 14 MHz input.',
      },
      {
        src: '/projects/amplifier/slide-18.webp',
        caption:
          'THD measures how much signal energy has shifted out of the fundamental and into higher-order harmonics. A low figure means the transmitted waveform keeps its shape; a high one means distortion and lost clarity.',
      },
      {
        src: '/projects/amplifier/slide-19.webp',
        caption:
          'How the filter does it: at high frequencies the inductors present high impedance and block, while the capacitors look like shorts to ground. Together the network passes the wanted band and attenuates the harmonics above it.',
      },
      {
        src: '/projects/amplifier/slide-20.webp',
        caption:
          'Measured two ways. An LTSpice FFT with an ideal 1 Vpp, 14 MHz input gave 2.4% THD — the fundamental passing at magnitude 1, the second and third attenuated. The assembled PCB, measured with a Python script, came in at 0.58%.',
      },
      {
        src: '/projects/amplifier/slide-21.webp',
        caption:
          'The filter removes the frequencies that were contributing harmonics, as designed.',
      },
      {
        src: '/projects/amplifier/slide-22.webp',
        caption:
          'Requirement 2: met.',
      },
      {
        src: '/projects/amplifier/slide-23.webp',
        caption:
          'Requirement 3 — 1–10 W of continuous output into a 50 Ω load. At least 1 W so the transmission carries reliably; under 10 W to keep the output in a safe range for the equipment.',
      },
      {
        src: '/projects/amplifier/slide-24.webp',
        caption:
          'Closing the switch pushes current through the inductor, storing magnetic energy; opening it releases that energy through the filter into the load, acting as a second source alongside the 12 V supply. Simulation gave 20 V peaks — about 4 W into 50 Ω.',
      },
      {
        src: '/projects/amplifier/slide-25.webp',
        caption:
          'On the physical PCB the output across the 50 Ω load was badly behaved, with occasional 102 mV peaks. Roughly 0.2 mW of inconsistent power, against a 1 W floor.',
      },
      {
        src: '/projects/amplifier/slide-26.webp',
        caption:
          'Root cause. Rise and fall times of 6.5 ns and 4.5 ns were fine for 14 MHz — the oversight was the gate driver’s 45 ns internal propagation delay, nearly 63% of the switching cycle. The MOSFETs switched late and sat between ON and OFF, collapsing the output swing and drawing so much current the supply never held 12 V; it averaged 3.9 V.',
      },
      {
        src: '/projects/amplifier/slide-27.webp',
        caption:
          'And the wiring. A generic gate driver has one output pin that pulls the gate both high and low; ours splits it into OUT_SRC and OUT_SNK. Only OUT_SRC was connected — the pin that closes the switch — so nothing could open it again.',
      },
      {
        src: '/projects/amplifier/slide-28.webp',
        caption:
          'Walking the chain stage by stage and scoping each boundary: 1 Vpp in, 4.5–5 V out of the comparator, then into the gate driver. That is what localized where the signal died.',
      },
      {
        src: '/projects/amplifier/slide-29.webp',
        caption:
          'Requirement 3: not met on this iteration of the PCB — with the cause identified rather than left open.',
      },
      {
        src: '/projects/amplifier/slide-30.webp',
        caption:
          'All three requirements side by side: frequency and distortion met, output power not.',
      },
      {
        src: '/projects/amplifier/slide-31.webp',
        caption:
          'Full radio integration was not attempted, since the power requirement was unmet. Instead the filter was tested on its own — a distorted signal in, a clean sine out — which confirmed it worked and pointed the fault at the amplifier stage.',
      },
      {
        src: '/projects/amplifier/slide-32.webp',
        caption:
          'Three faults found across days of debugging: J13/J14 oriented backwards, bridged with M–F jumpers; a TLV1831 comparator whose open-drain output could only pull low, swapped for the push-pull TLV1841; and a stray 50 Ω footprint breaking the filter-to-output connection, closed with solder.',
      },
      {
        src: '/projects/amplifier/slide-33.webp',
        caption:
          'The fix: attach OUT_SNK to the MOSFET gates so they can be pulled low, wired to the datasheet reference, with the gate resistor sized from R = V_drive · t_rise / Qg.',
      },
      {
        src: '/projects/amplifier/slide-34.webp',
        caption:
          'What we would do differently: assemble and test in stages rather than all at once, and add test points and LED indicators between stages. Either would have isolated the voltage drop in the amplifier stage far earlier.',
      },
      {
        src: '/projects/amplifier/slide-35.webp',
        caption:
          'Clean transmission quality and correct frequency operation; the gate driving stage is what needs work to reach full output power.',
      },
    ],
  },
  {
    id: 'pianotiles',
    tag: 'RTL / FPGA',
    date: 'Dec 2024',
    domains: ['rtl'],
    title: 'Piano Tiles in Verilog',
    result: 'Playable on hardware — keyboard in, VGA and audio out',
    body:
      'Piano Tiles implemented in Verilog with keyboard input, speaker output and VGA rendering, using ROM for the tile graphics and memory-mapped I/O for the peripherals. Game progression runs on an FSM. Validated in ModelSim for correctness and timing, then deployed to the FPGA.',
    stack: ['Verilog', 'Quartus Prime', 'ModelSim', 'FSM', 'VGA'],
    image: null,
    href: null,
  },
];

/**
 * Two paragraphs: the facts first, then the range.
 *
 * Positioning is GENERAL HARDWARE — digital, embedded, analog, PCB. Do not
 * narrow this to RTL/signoff just because the AMD role is signoff work; that
 * is one entry on the page, not the target.
 *
 * Deliberately does NOT repeat the masthead or restate an experience bullet.
 *
 * TODO: work authorization. Recruiters screen on it and it isn't stated
 * anywhere on the site. Add whichever is true to the end of paragraph one:
 *   'Canadian citizen.'  |  'Permanent resident.'  |
 *   'International student, eligible to work in Canada on a co-op work permit.'
 */
export const about = [
  'Electrical & Computer Engineering at the University of Toronto, with minors in AI/ML and Robotics/Mechatronics, a certificate in religious studies, and a place on the Dean\'s List. Graduating May 2028. Based in Toronto. I’m looking for hardware engineering internships for Winter and Summer 2027.',
  'Hardware across the stack: a RISC-V soft CPU running a physics simulator, Piano Tiles in Verilog on an FPGA, a gesture controller in embedded C, a Class D amplifier laid out and bench-validated, and lint, CDC and synthesis on production PCIe silicon at AMD. Digital, embedded or analog — I want to keep working across that range rather than narrow to one layer this early.',
];

/** Skills. Grouped the way an interviewer would ask about them. */
export const parameters = [
  {
    domain: 'Integration & implementation',
    tools: 'Lint (SpyGlass / Leda), CDC (Questa), compile-elaborate (VCS), synthesis (Design Compiler), PPA analysis',
    where: 'AMD — PCIe subsystem',
  },
  {
    domain: 'Digital design',
    tools: 'Verilog, FSMs, pipelines, caches, CDC synchronizers, async FIFOs, memory-mapped I/O',
    where: 'AMD; RISC-V soft CPU; Piano Tiles',
  },
  {
    domain: 'FPGA flow',
    tools: 'Quartus Prime, ModelSim, Intel DE1-SoC, on-board debug',
    where: 'Physics simulator; Piano Tiles',
  },
  {
    domain: 'Memory & IP',
    tools: 'SRAM / memory-compiler flows, ECC wrappers, genIP diffing, distributed builds (LSF)',
    where: 'AMD — PCIe subsystem',
  },
  {
    domain: 'Embedded',
    tools: 'C, C++, STM32, ESP32, Arduino, I2C, SPI, UART, PWM, interrupts, BLE HID, RTOS basics',
    where: 'Gesture controller; robotic arm; Battle Bots',
  },
  {
    domain: 'Analog & PCB',
    tools: 'LTSpice, Altium Designer, 2-layer layout, assembly and soldering, bench validation',
    where: 'Class D amplifier & LPF',
  },
  {
    domain: 'Software',
    tools: 'Python, Tcl, Bash, JavaScript, SQL, RISC-V assembly, Linux, Git, Perforce, MATLAB',
    where: 'Everywhere on this page',
  },
  {
    domain: 'ML & full-stack',
    tools: 'PyTorch, TinyML, OpenCV, React, FastAPI, Postgres, Firebase',
    where: 'AMD tooling; crop CNN; robotic arm; hackathon',
  },
  {
    domain: 'Languages',
    tools: 'English (native), Arabic (upper intermediate), French & Italian (beginner)',
    where: 'Home, school, travel',
  },
];

/**
 * About-section photography. Both crops come from photos Mark supplied; the
 * portrait is cropped out of a family photo, so keep the frame tight enough
 * that nobody else is in it if you ever re-crop.
 *
 * Each image ships at 1x and 0.5x, matching the deck-slide naming convention.
 */
export const portrait = {
  src: '/about/portrait.webp',
  small: '/about/portrait@0.5x.webp',
  width: 880,
  height: 1256,
  alt: 'Mark Samuel',
};

export const aboutPhoto = {
  src: '/about/offtheclock.webp',
  small: '/about/offtheclock@0.5x.webp',
  width: 1600,
  height: 899,
  alt: 'Mark with a bike on a waterfront path at sunset, sailboats moored behind him',
};

/**
 * Mini games. `id` must match a key in the PANELS map in Games.jsx — an id
 * with no panel renders the blurb and nothing else, silently.
 */
export const games = [
  {
    id: 'gates',
    name: 'Gate puzzle',
    blurb:
      'Drag AND, OR, XOR and NOT onto the board until your output column matches the target. Puzzles are generated, so they never run out \u2014 two inputs and one gate to start, three inputs and two gates once you get going.',
  },
  {
    id: 'bits',
    name: 'Bit drill',
    blurb: 'Binary and hex conversion against a 60-second clock. Best score is kept in your browser.',
  },
  {
    id: 'snake',
    name: 'Snake',
    blurb:
      'Snake on a 320 \u00d7 240 framebuffer scaled 2\u00d7 with nearest-neighbour — the same geometry as the DE1-SoC simulator above.',
  },
];

export const footer = {
  heading: 'Let’s talk.',
  body:
    'I’m looking for a Winter or Summer 2027 hardware engineering internship — digital design, embedded, analog or PCB. Happy to talk about anything on this page — or about what your team actually needs an intern to do.',
  colophon: 'Mark Samuel — Toronto, ON — last updated September 2026',
};
