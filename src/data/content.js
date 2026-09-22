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
  eyebrow: ['Electrical Engineering', 'University of Toronto', 'Class of 2T8'],
  lede:
    'Electrical engineering at the University of Toronto, currently on the silicon implementation team for AMD’s PCIe subsystem. I work at the unglamorous end of chip design — lint, CDC, synthesis, memory compilers — and I like it there, because the feedback is honest.',
  spec: [
    { label: 'Seeking', value: 'Summer 2027', highlight: true },
    { label: 'Now', value: 'AMD — PCIe silicon' },
    { label: 'Focus', value: 'RTL · Signoff · DV' },
    { label: 'Based', value: 'Toronto, ON' },
    { label: 'Graduating', value: 'May 2028' },
  ],
  links: [
    { label: 'mark.samuel@mail.utoronto.ca', href: 'mailto:mark.samuel@mail.utoronto.ca' },
    { label: 'github.com/10Mark01', href: 'https://github.com/10Mark01' },
    { label: 'linkedin.com/in/ms-ee', href: 'https://linkedin.com/in/ms-ee' },
    { label: 'Résumé (PDF)', href: '/resume.pdf', todo: true },
  ],
};

/**
 * Floorplan blocks.
 *
 * x / y / w / h are SVG user units inside a 560 × 210 viewBox. Keep blocks
 * inside the core boundary (32,32 to 528,164) or they overlap the pad ring.
 */
export const blocks = [
  { id: 'signoff',  label: 'SIGNOFF',  sub: 'LINT · CDC · SYNTH',   x: 48,  y: 46,  w: 150, h: 102 },
  { id: 'rtl',      label: 'RTL',      sub: 'VERILOG · FPGA',       x: 214, y: 46,  w: 146, h: 46  },
  { id: 'embedded', label: 'EMBEDDED', sub: 'STM32 · ESP32 · C',    x: 214, y: 102, w: 146, h: 46  },
  { id: 'pcb',      label: 'PCB',      sub: 'ALTIUM · LTSPICE',     x: 376, y: 46,  w: 136, h: 46  },
  { id: 'ml',       label: 'ML / SW',  sub: 'PYTORCH · C++',        x: 376, y: 102, w: 136, h: 46  },
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
    role: 'Silicon Implementation & Integration Intern',
    team: 'PCIe Subsystem',
    org: 'AMD',
    location: 'Toronto, ON',
    period: 'May 2025 — present',
    domains: ['signoff', 'rtl', 'ml'],
    bullets: [
      'Own the team’s Tcl async-FIFO extraction script, run under Synopsys Design Compiler. It reads RTL alongside build-time feature flags to classify edge cases correctly — continuous streaming phase-adjustment FIFOs among them — and produces per-tile reference lists, pinned to a changelist, that partner teams check for post-synthesis netlist equivalence and for pointer race conditions across gray-code crossings.',
      'Triage RTL lint, CDC and compile-elaborate violations at the core level across concurrent PCIe SoC programs, driving root cause with the designers and usually proposing the fix. Maintain the waiver log that goes with it.',
      'Generate SRAM memories and diff genIP lists across releases, running multi-stage distributed builds (compile → lib2db → NDM → ECC wrapper → publish). Added log-parsing validity checks after finding the tool exits 0 even on failure.',
      'Analyzed area, timing and power drift between IP releases, reconstructing area from datasheet specs for macros the compiler reported as infinite — and characterized my own estimate’s error at ~4% plain, ~19% with ECC, because an estimate you can’t bound isn’t worth much.',
      'Replaced a manual connectivity-extract → Excel → hand-drawn diagram workflow with an automated Verilog parser → Postgres → FastAPI → React Flow pipeline, built end to end and verified against SQL at every hop.',
    ],
    stack: ['Tcl', 'Design Compiler', 'SpyGlass', 'Questa CDC', 'VCS', 'Perforce', 'React Flow'],
  },
  {
    id: 'robotics',
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
          'Requirement 3: 1–10 W of continuous output into a 50 Ω load. At least 1 W so the transmission carries reliably; under 10 W to keep the output in a safe range for the equipment.',
      },
      {
        src: '/projects/amplifier/slide-03.webp',
        caption:
          'A Class D switching network. Closing the switch pushes current through the inductor, storing magnetic energy; opening it releases that energy through the filter into the load, acting as a second source alongside the 12 V supply. Simulation gave 20 V peaks — about 4 W into 50 Ω.',
      },
      {
        src: '/projects/amplifier/slide-04.webp',
        caption:
          'On the physical PCB the output across the 50 Ω load was badly behaved, with occasional 102 mV peaks. Roughly 0.2 mW of inconsistent power, against a 1 W floor.',
      },
      {
        src: '/projects/amplifier/slide-05.webp',
        caption:
          'Root cause. Rise and fall times of 6.5 ns and 4.5 ns were fine for 14 MHz — the oversight was the gate driver’s 45 ns internal propagation delay, nearly 63% of the switching cycle. The MOSFETs switched late and sat between ON and OFF, collapsing the output swing and drawing so much current the supply never held 12 V; it averaged 3.9 V.',
      },
      {
        src: '/projects/amplifier/slide-06.webp',
        caption:
          'A generic gate driver has one output pin that pulls the gate both high and low. Ours splits it into OUT_SRC and OUT_SNK. We had wired only OUT_SRC — the pin that closes the switch — so nothing could open it again.',
      },
      {
        src: '/projects/amplifier/slide-07.webp',
        caption:
          'Walking the chain stage by stage: 1 Vpp in, boosted to 4.5–5 V by the comparator, then into the gate driver. Scoping each boundary is what localized where the signal died.',
      },
      {
        src: '/projects/amplifier/slide-08.webp',
        caption:
          'Reported as not met on this iteration of the PCB — with the cause identified rather than left open.',
      },
      {
        src: '/projects/amplifier/slide-09.webp',
        caption:
          'Three faults found across days of debugging: J13/J14 oriented backwards, bridged with M–F jumpers; a TLV1831 comparator whose open-drain output could only pull low, swapped for the push-pull TLV1841; and a stray 50 Ω footprint breaking the filter-to-output connection, closed with solder.',
      },
      {
        src: '/projects/amplifier/slide-10.webp',
        caption:
          'The fix: attach OUT_SNK to the MOSFET gates so they can be pulled low, wired to the datasheet reference, with the gate resistor sized from R = V_drive · t_rise / Qg.',
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

export const about = [
  'I was born in Egypt and moved to Canada when I was six, so Toronto is home and Cairo is where the rest of the family is. I’m an electrical engineering student at the University of Toronto, with minors in AI/ML and robotics, and I’ve spent the last stretch at AMD on the silicon implementation side of a PCIe subsystem.',
  'What I like about signoff work is that it doesn’t let you be vague. A lint violation is real or it’s a waiver you have to justify to a designer. **An area estimate is worth exactly as much as your error bar on it** — which is why, when I rebuilt macro areas from datasheet specs, the number I actually reported was the ~4% and ~19% uncertainty around them.',
  'The other half of me is a teacher. I founded a peer tutoring club in high school, TA’d a grade 11 physics class, and I’ve been tutoring math, physics and chemistry ever since. It made me careful about explanations — if I can’t say why something works, I don’t know it yet. That shows up in my waiver justifications more than anywhere else.',
];

/** Skills. Grouped the way an interviewer would ask about them. */
export const parameters = [
  {
    domain: 'RTL & signoff',
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

export const teaching = [
  {
    label: 'Founded',
    title: 'Peer tutoring club',
    body:
      'Started it at my high school and ran it through to graduation, matching students who were struggling with ones who weren’t.',
  },
  {
    label: 'Teaching assistant',
    title: 'Grade 11 physics',
    body: 'Ran problem sessions and worked through questions with students who had stalled on them.',
  },
  {
    label: 'Tutoring',
    title: 'Math, physics, chemistry',
    body:
      'And I can hold my own in biology and English. It started as a way to earn money and became the part of the week I look forward to.',
  },
  {
    label: 'Why it’s here',
    title: 'Design work gets inherited',
    body:
      'Explaining a decision to someone who wasn’t in the room is the same skill whether they’re a student or the engineer who picks up your block next quarter.',
  },
];

export const offTheClock = {
  body:
    'I cook and bake most days, keep a garden, and read a lot — history and religion academically, though I’m not religious myself. I swim, hike, play basketball and lose at board games. First aid certified. Somewhere after graduation there’s a fork between staying in semiconductors and a master’s that ends in teaching, and I haven’t picked yet.',
  chips: [
    'Cooking & baking',
    'Gardening',
    'History',
    'Swimming',
    'Hiking',
    'Basketball',
    'Board games',
    'Film',
  ],
};

export const footer = {
  heading: 'Let’s talk.',
  body:
    'I’m looking for a Summer 2027 internship in RTL design, verification or physical design. Happy to talk about anything on this page — or about what your team actually needs an intern to do.',
  colophon: 'Mark Samuel — Toronto, ON — last updated September 2026',
};
