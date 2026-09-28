import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* ==========================================================================
   Logic
   ========================================================================== */

const OPS = {
  AND: (a, b) => a & b,
  OR: (a, b) => a | b,
  XOR: (a, b) => a ^ b,
  NAND: (a, b) => (a & b) ^ 1,
  NOR: (a, b) => (a | b) ^ 1,
};
const BASIC = ['AND', 'OR', 'XOR'];
const ALL = ['AND', 'OR', 'XOR', 'NAND', 'NOR'];
const INVERTING = ['NAND', 'NOR'];
const LETTERS = ['A', 'B', 'C'];

/**
 * Board layouts, in SVG user units. Gate bodies are 60 x 44 with input pins
 * at +12 and +32 and the output at +22. Every gate input is a "leg": leg
 * 2k and 2k+1 feed gate k. A leg runs from its source to x = gate.x - 32,
 * then through a 24-unit inverter slot, then into the gate body.
 *
 * `src` is 'i<n>' for an input or 'g<n>' for an earlier gate's output.
 * `bend` is the x of the vertical jog when source and pin are at different y.
 */
const IN_X = 34;
const TOPO = {
  one: {
    n: 2,
    width: 290,
    height: 96,
    inputs: [39, 59],
    gates: [{ x: 130, y: 27 }],
    legs: [
      { src: 'i0', name: 'A into gate 1' },
      { src: 'i1', name: 'B into gate 1' },
    ],
    dots: [],
  },
  chain: {
    n: 3,
    width: 400,
    height: 90,
    inputs: [26, 46, 66],
    gates: [
      { x: 130, y: 14 },
      { x: 270, y: 34 },
    ],
    legs: [
      { src: 'i0', name: 'A into gate 1' },
      { src: 'i1', name: 'B into gate 1' },
      { src: 'g0', bend: 215, name: 'X into gate 2' },
      { src: 'i2', name: 'C into gate 2' },
    ],
    dots: [],
  },
  tree: {
    n: 3,
    width: 420,
    height: 130,
    inputs: [20, 65, 110],
    gates: [
      { x: 140, y: 8 },
      { x: 140, y: 78 },
      { x: 290, y: 43 },
    ],
    legs: [
      { src: 'i0', name: 'A into gate 1' },
      { src: 'i1', bend: 80, name: 'B into gate 1' },
      { src: 'i1', bend: 80, name: 'B into gate 2' },
      { src: 'i2', name: 'C into gate 2' },
      { src: 'g0', bend: 232, name: 'X into gate 3' },
      { src: 'g1', bend: 232, name: 'Y into gate 3' },
    ],
    dots: [{ x: 80, y: 65, src: 'i1' }],
  },
};
const WIRE_NAMES = ['X', 'Y'];

/**
 * Difficulty ladder. Endless: past the last rung the shape holds and only the
 * generated puzzle changes. `prefer` biases generation toward targets that
 * need the rung's new part, so a new part is not optional on its first outing.
 */
function shapeFor(level) {
  const mk = (topo, inv, palette, note, prefer = null) => ({
    topo,
    inv,
    palette,
    note,
    prefer,
    id: `${topo}${inv ? '+inv' : ''}:${palette.join(',')}`,
  });
  if (level < 2) return mk('one', false, BASIC, 'One gate, two inputs.');
  if (level < 4)
    return mk('one', false, ALL, 'New: NAND and NOR, which are AND and OR with the output inverted.', 'fresh');
  if (level < 6) return mk('one', true, ALL, 'New: inverters. Put NOT on any input wire.', 'inv');
  if (level < 9) return mk('chain', false, ALL, 'Two gates, three inputs. Gate 1 feeds gate 2.');
  if (level < 12) return mk('chain', true, ALL, 'Two gates with inverters.', 'inv');
  if (level % 4 === 3)
    return mk('tree', false, INVERTING, 'NAND and NOR only. Either one alone can build any logic function.');
  if (level < 16) return mk('tree', false, ALL, 'Three gates. B feeds both first-stage gates.');
  return mk('tree', true, ALL, 'Three gates with inverters.', 'inv');
}

/** Simulate one input row. Nulls propagate from empty gate slots. */
function run(topo, gates, invs, row) {
  const bit = (i) => (row >> (topo.n - 1 - i)) & 1;
  const legIn = [];
  const legOut = [];
  const gOut = [];
  topo.gates.forEach((_, k) => {
    const v = [0, 1].map((j) => {
      const l = 2 * k + j;
      const src = topo.legs[l].src;
      const value = src[0] === 'i' ? bit(Number(src[1])) : gOut[Number(src[1])];
      legIn[l] = value;
      legOut[l] = value == null ? null : value ^ (invs[l] ? 1 : 0);
      return legOut[l];
    });
    gOut[k] = !gates[k] || v[0] == null || v[1] == null ? null : OPS[gates[k]](v[0], v[1]);
  });
  return { legIn, legOut, gOut, out: gOut[topo.gates.length - 1] };
}

const tableOf = (topo, gates, invs) =>
  Array.from({ length: 1 << topo.n }, (_, row) => run(topo, gates, invs, row).out);

const EMPTY_GATES = [null, null, null];
const EMPTY_INVS = [0, 0, 0, 0, 0, 0];
const padGates = (g) => [0, 1, 2].map((i) => g[i] ?? null);
const withAt = (arr, i, v) => {
  const next = [...arr];
  next[i] = v;
  return next;
};
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const popcount = (m) => {
  let c = 0;
  for (let x = m; x; x >>= 1) c += x & 1;
  return c;
};

/** A constant column, or one where an input never matters, is not a puzzle. */
function isInteresting(key, n) {
  const t = key.split('').map(Number);
  if (t.every((v) => v === t[0])) return false;
  for (let i = 0; i < n; i += 1) {
    const flip = 1 << (n - 1 - i);
    if (!t.some((v, row) => (row & flip) === 0 && v !== t[row | flip])) return false;
  }
  return true;
}

/**
 * Every circuit this shape can build, grouped by the truth table it makes.
 * The largest board is 5^3 gate choices x 2^6 inverter patterns = 8000
 * circuits, small enough to enumerate outright. That buys three things:
 * targets are always buildable, "fewest parts" is exact, and hints can check
 * the player's partial board against every real solution.
 */
const circuitCache = new Map();
function circuitsFor(shape) {
  if (circuitCache.has(shape.id)) return circuitCache.get(shape.id);
  const topo = TOPO[shape.topo];
  const g = topo.gates.length;
  const legs = 2 * g;
  const kinds = shape.palette;
  const masks = shape.inv ? 1 << legs : 1;
  const byKey = new Map();
  for (let c = 0; c < kinds.length ** g; c += 1) {
    const gates = [];
    for (let k = 0, r = c; k < g; k += 1, r = Math.floor(r / kinds.length)) gates.push(kinds[r % kinds.length]);
    for (let m = 0; m < masks; m += 1) {
      const invs = EMPTY_INVS.map((_, i) => (i < legs ? (m >> i) & 1 : 0));
      const padded = padGates(gates);
      const key = tableOf(topo, padded, invs).join('');
      const entry = { gates: padded, invs, cost: popcount(m) };
      const list = byKey.get(key);
      if (list) list.push(entry);
      else byKey.set(key, [entry]);
    }
  }
  circuitCache.set(shape.id, byKey);
  return byKey;
}

const wants = {
  inv: (sols) => Math.min(...sols.map((s) => s.cost)) >= 1,
  fresh: (sols) => sols.every((s) => s.gates.some((k) => k === 'NAND' || k === 'NOR')),
};

function generate(shape, avoidKey) {
  const topo = TOPO[shape.topo];
  const byKey = circuitsFor(shape);
  let pool = [...byKey.keys()].filter((k) => k !== avoidKey && isInteresting(k, topo.n));
  if (shape.prefer && Math.random() < 0.75) {
    const strict = pool.filter((k) => wants[shape.prefer](byKey.get(k)));
    if (strict.length) pool = strict;
  }
  if (!pool.length) pool = [...byKey.keys()].filter((k) => isInteresting(k, topo.n));
  const key = pick(pool);
  const solutions = byKey.get(key);
  const minCost = Math.min(...solutions.map((s) => s.cost));
  return {
    key,
    table: key.split('').map(Number),
    solutions,
    minCost,
    solution: pick(solutions.filter((s) => s.cost === minCost)),
  };
}

/**
 * Next step toward a solution that agrees with what is already placed.
 * If nothing agrees, name the gate that is ruling every solution out.
 */
function hintFor(solutions, gates, invs, g, legs) {
  const agrees = (s, skip) => s.gates.every((k, i) => i >= g || i === skip || !gates[i] || gates[i] === k);
  const fits = solutions.filter((s) => agrees(s, -1));
  if (!fits.length) {
    let index = -1;
    for (let i = 0; i < g && index < 0; i += 1) {
      if (gates[i] && solutions.some((s) => agrees(s, i))) index = i;
    }
    if (index < 0) index = gates.findIndex((k, i) => i < g && k);
    return { type: 'wrong', index };
  }
  const diff = (s) => s.invs.reduce((d, v, i) => d + (i < legs && v !== invs[i] ? 1 : 0), 0);
  const best = fits.reduce((a, b) =>
    diff(b) < diff(a) || (diff(b) === diff(a) && b.cost < a.cost) ? b : a
  );
  const gi = best.gates.findIndex((k, i) => i < g && !gates[i]);
  if (gi >= 0) return { type: 'gate', index: gi, kind: best.gates[gi] };
  const li = best.invs.findIndex((v, i) => i < legs && v !== invs[i]);
  if (li >= 0) return { type: 'inv', index: li, value: best.invs[li] };
  return null;
}

/** Boolean expression for the board, e.g. (A NAND B) XOR ¬C. */
function exprOf(topo, gates, invs) {
  const sub = [];
  topo.gates.forEach((_, k) => {
    const side = (j) => {
      const l = 2 * k + j;
      const src = topo.legs[l].src;
      const s = src[0] === 'i' ? LETTERS[Number(src[1])] : sub[Number(src[1])];
      return invs[l] ? `¬${s}` : s;
    };
    sub[k] = `(${side(0)} ${gates[k] ?? '?'} ${side(1)})`;
  });
  return sub[sub.length - 1].slice(1, -1);
}

/* Truth tables worth naming. Row order is A as the MSB. */
const NAMES = {
  '0001': 'AND',
  '0111': 'OR',
  '0110': 'XOR, the sum bit of a half adder',
  '1110': 'NAND',
  '1000': 'NOR',
  '1001': 'XNOR, a 1-bit equality check',
  '0010': 'A AND NOT B',
  '0100': 'B AND NOT A',
  '1011': 'B implies A',
  '1101': 'A implies B',
  '00010111': 'majority, the carry out of a full adder',
  '01101001': 'three-input XOR, the sum bit of a full adder',
  '10010110': 'three-input XNOR, even parity',
  '00000001': 'three-input AND',
  '01111111': 'three-input OR',
  '11111110': 'three-input NAND',
  '10000000': 'three-input NOR',
  '00110101': 'a 2:1 mux: A=0 passes B, A=1 passes C',
  '01010011': 'a 2:1 mux: A=0 passes C, A=1 passes B',
  '00011101': 'a 2:1 mux: B=0 passes A, B=1 passes C',
  '01000111': 'a 2:1 mux: B=0 passes C, B=1 passes A',
};

/* Progress survives switching tabs and reloading. */
const SAVE_KEY = 'mark-portfolio:gates-progress';
const readSaved = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SAVE_KEY) || '{}');
    const int = (v) => Math.max(0, Math.floor(Number(v)) || 0);
    return { level: int(saved.level), solved: int(saved.solved), clean: int(saved.clean) };
  } catch {
    return { level: 0, solved: 0, clean: 0 };
  }
};
const writeSaved = (state) => {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    /* private mode or blocked storage: progress just doesn't persist */
  }
};

/* ==========================================================================
   Drawing
   ========================================================================== */

const BODY = {
  AND: 'M0 0H38A22 22 0 0 1 38 44H0Z',
  OR: 'M0 0Q14 22 0 44Q36 44 60 22Q36 0 0 0Z',
  XOR: 'M7 0Q21 22 7 44Q40 44 60 22Q40 0 7 0Z',
};
const KIND_X = { AND: 28, OR: 28, XOR: 32 };

/** ANSI distinctive-shape symbol in a 60 x 44 box; NAND/NOR add a bubble. */
function GateSymbol({ kind }) {
  const base = kind.replace(/^N(AND|OR)$/, '$1');
  return (
    <g className="sch-body">
      <path d={BODY[base]} />
      {base === 'XOR' && <path className="sch-back" d="M0 0Q14 22 0 44" />}
      {base !== kind && <circle cx="64.5" cy="22" r="4.5" />}
    </g>
  );
}

function PartIcon({ kind }) {
  return (
    <svg className="chip-icon" viewBox="-3 -3 76 50" width="27" height="18" aria-hidden="true">
      {kind === 'NOT' ? (
        <g className="sch-body">
          <path d="M4 4V40L50 22Z" />
          <circle cx="57" cy="22" r="5" />
        </g>
      ) : (
        <GateSymbol kind={kind} />
      )}
    </svg>
  );
}

const valClass = (v) => (v == null ? 'is-x' : v ? 'is-1' : 'is-0');

function Schematic({ topo, shape, gates, invs, sim, probe, target, complete, armed, locked, flash, onSlot, onToggle }) {
  const srcPoint = (src) => {
    const i = Number(src[1]);
    if (src[0] === 'i') return [IN_X, topo.inputs[i]];
    const g = topo.gates[i];
    return [g.x + 60, g.y + 22];
  };
  const last = topo.gates[topo.gates.length - 1];
  const outY = last.y + 22;
  const bad = complete && sim.out !== target;

  const slotKeys = (type, index) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSlot(type, index);
    }
  };

  return (
    <svg
      className="sch"
      viewBox={`0 0 ${topo.width} ${topo.height}`}
      style={{ maxWidth: topo.width * 1.45 }}
      role="group"
      aria-label="Circuit board"
    >
      {/* wires first, so gate bodies sit on top of their leads */}
      {topo.legs.map((leg, l) => {
        const g = topo.gates[l >> 1];
        const py = g.y + (l & 1 ? 32 : 12);
        const px = g.x - 32;
        const [sx, sy] = srcPoint(leg.src);
        const d = sy === py ? `M${sx} ${sy}H${px + 24}` : `M${sx} ${sy}H${leg.bend}V${py}H${px + 24}`;
        return (
          <g key={`w${l}`}>
            <path className={`sch-wire ${valClass(sim.legIn[l])}`} d={d} />
            <path className={`sch-wire ${valClass(sim.legOut[l])}`} d={`M${px + 24} ${py}H${g.x + 12}`} />
          </g>
        );
      })}
      {topo.dots.map((dot) => (
        <circle
          key={`d${dot.x}`}
          className={`sch-dot ${valClass(sim.legIn[topo.legs.findIndex((leg) => leg.src === dot.src)])}`}
          cx={dot.x}
          cy={dot.y}
          r="3"
        />
      ))}
      <path className={`sch-wire ${valClass(sim.out)}`} d={`M${last.x + 60} ${outY}H${last.x + 92}`} />

      {/* inputs: click the bit to change the probed row */}
      {topo.inputs.map((y, i) => {
        const v = (probe >> (topo.n - 1 - i)) & 1;
        return (
          <g
            key={`in${i}`}
            className={`sch-bit ${v ? 'is-1' : 'is-0'}`}
            role="button"
            tabIndex={0}
            aria-label={`Input ${LETTERS[i]} is ${v}, toggle`}
            onClick={() => onToggle(i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggle(i);
              }
            }}
          >
            <text className="sch-label" x="4" y={y + 4}>
              {LETTERS[i]}
            </text>
            <rect x="16" y={y - 8} width="16" height="16" rx="2" />
            <text className="sch-bitval" x="24" y={y + 4}>
              {v}
            </text>
          </g>
        );
      })}

      {/* inverter slots */}
      {shape.inv &&
        topo.legs.map((leg, l) => {
          const g = topo.gates[l >> 1];
          const py = g.y + (l & 1 ? 32 : 12);
          const px = g.x - 32;
          const open = !locked && armed === 'NOT';
          const lit = flash?.type === 'inv' && flash.index === l;
          return (
            <g
              key={`i${l}`}
              className={`sch-slot${open ? ' is-open' : ''}${lit ? ' is-flash' : ''}`}
              data-slot="inv"
              data-index={l}
              role="button"
              tabIndex={0}
              aria-label={`Inverter on ${leg.name}: ${invs[l] ? 'NOT' : 'empty'}`}
              onClick={() => onSlot('inv', l)}
              onKeyDown={slotKeys('inv', l)}
            >
              <rect className="sch-hit" x={px} y={py - 11} width="24" height="22" rx="3" />
              {invs[l] ? (
                <g className="sch-inv">
                  <path d={`M${px + 2} ${py - 7}V${py + 7}L${px + 15} ${py}Z`} />
                  <circle cx={px + 18.5} cy={py} r="3.5" />
                </g>
              ) : (
                <circle className="sch-inv-empty" cx={px + 12} cy={py} r="5" />
              )}
            </g>
          );
        })}

      {/* gate slots */}
      {topo.gates.map((g, k) => {
        const kind = gates[k];
        const open = !locked && armed && armed !== 'NOT';
        const lit = flash?.type === 'gate' && flash.index === k;
        return (
          <g
            key={`g${k}`}
            className={`sch-slot${open ? ' is-open' : ''}${lit ? ' is-flash' : ''}`}
            data-slot="gate"
            data-index={k}
            transform={`translate(${g.x} ${g.y})`}
            role="button"
            tabIndex={0}
            aria-label={`Gate ${k + 1}: ${kind ?? 'empty'}`}
            onClick={() => onSlot('gate', k)}
            onKeyDown={slotKeys('gate', k)}
          >
            <rect className="sch-hit" x="-5" y="-5" width="80" height="54" rx="4" />
            {kind ? (
              <>
                <GateSymbol kind={kind} />
                <text className="sch-kind" x={KIND_X[kind.replace(/^N(AND|OR)$/, '$1')]} y="25.5">
                  {kind}
                </text>
              </>
            ) : (
              <>
                <rect className="sch-empty" x="0" y="0" width="60" height="44" rx="4" />
                <text className="sch-kind is-empty" x="30" y="25.5">
                  gate {k + 1}
                </text>
              </>
            )}
            {k < topo.gates.length - 1 && (
              <text className="sch-label sch-mid" x="72" y="16">
                {WIRE_NAMES[k]}
              </text>
            )}
          </g>
        );
      })}

      {/* output LED, with the target for this row beneath it */}
      <g className="sch-outpin">
        <text className="sch-label" x={last.x + 102} y={outY - 14}>
          OUT
        </text>
        <circle className={`sch-led ${valClass(sim.out)}${bad ? ' is-bad' : ''}`} cx={last.x + 102} cy={outY} r="8" />
        <text className="sch-label sch-target" x={last.x + 102} y={outY + 24}>
          want {target}
        </text>
      </g>
    </svg>
  );
}

/* ==========================================================================
   Game
   ========================================================================== */

const cycle = (list, current) => {
  const i = list.indexOf(current);
  if (current == null || i < 0) return list[0];
  return i === list.length - 1 ? null : list[i + 1];
};

export function GateGame() {
  const [saved] = useState(readSaved);
  const [level, setLevel] = useState(saved.level);
  const [solved, setSolved] = useState(saved.solved);
  const [clean, setClean] = useState(saved.clean);
  const shape = useMemo(() => shapeFor(level), [level]);
  const topo = TOPO[shape.topo];
  const gateCount = topo.gates.length;
  const legCount = gateCount * 2;
  const parts = shape.inv ? [...shape.palette, 'NOT'] : shape.palette;

  const [puzzle, setPuzzle] = useState(() => generate(shapeFor(saved.level), null));
  // 'none' | 'hint' | 'shown'. Hints still advance the level; a shown
  // solution does not.
  const [assist, setAssist] = useState('none');
  const [notice, setNotice] = useState(null);
  const [flash, setFlash] = useState(null);
  const [gates, setGates] = useState(EMPTY_GATES);
  const [invs, setInvs] = useState(EMPTY_INVS);
  const [probe, setProbe] = useState(0);

  // `held` is the tap-to-place selection; `drag` is the live pointer drag.
  const [held, setHeld] = useState(null);
  const [drag, setDrag] = useState(null);
  const origin = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => writeSaved({ level, solved, clean }), [level, solved, clean]);

  useEffect(() => {
    if (!notice && !flash) return undefined;
    const id = window.setTimeout(() => {
      setNotice(null);
      setFlash(null);
    }, 2600);
    return () => window.clearTimeout(id);
  }, [notice, flash]);

  const mine = useMemo(() => tableOf(topo, gates, invs), [topo, gates, invs]);
  const sim = useMemo(() => run(topo, gates, invs, probe), [topo, gates, invs, probe]);
  const expr = useMemo(() => exprOf(topo, gates, invs), [topo, gates, invs]);
  const complete = gates.slice(0, gateCount).every(Boolean);
  const matches = complete && mine.every((v, i) => v === puzzle.table[i]);
  const used = shape.inv ? invs.slice(0, legCount).reduce((a, b) => a + b, 0) : 0;
  const rows = 1 << topo.n;
  const hits = mine.filter((v, i) => v === puzzle.table[i]).length;

  useEffect(() => {
    if (matches) nextRef.current?.focus({ preventScroll: true });
  }, [matches]);

  const clearBoard = useCallback(() => {
    setGates(EMPTY_GATES);
    setInvs(EMPTY_INVS);
    setHeld(null);
    setNotice(null);
    setFlash(null);
  }, []);

  const loadPuzzle = (nextLevel) => {
    setLevel(nextLevel);
    setPuzzle(generate(shapeFor(nextLevel), puzzle.key));
    setAssist('none');
    setProbe(0);
    clearBoard();
  };

  const advance = () => {
    if (assist === 'shown') {
      loadPuzzle(level);
      return;
    }
    setSolved((s) => s + 1);
    if (assist === 'none' && used === puzzle.minCost) setClean((c) => c + 1);
    loadPuzzle(level + 1);
  };

  const giveHint = () => {
    const h = hintFor(puzzle.solutions, gates, invs, gateCount, legCount);
    if (!h) return;
    if (assist === 'none') setAssist('hint');
    if (h.type === 'gate') {
      setGates((c) => withAt(c, h.index, h.kind));
      setNotice(`Gate ${h.index + 1} is ${h.kind}.`);
    } else if (h.type === 'wrong') {
      setGates((c) => withAt(c, h.index, null));
      setNotice(`No solution has ${gates[h.index]} in gate ${h.index + 1}. Cleared it.`);
    } else {
      setInvs((c) => withAt(c, h.index, h.value));
      setNotice(
        h.value ? `Add a NOT on ${topo.legs[h.index].name}.` : `Remove the NOT on ${topo.legs[h.index].name}.`
      );
    }
    setFlash({ type: h.type === 'inv' ? 'inv' : 'gate', index: h.index });
  };

  const showSolution = () => {
    setGates(puzzle.solution.gates);
    setInvs(puzzle.solution.invs);
    setHeld(null);
    setNotice(null);
    setAssist('shown');
  };

  const resetProgress = () => {
    setSolved(0);
    setClean(0);
    loadPuzzle(0);
  };

  const place = useCallback((kind, slotType, index) => {
    if (slotType === 'gate' && kind !== 'NOT') {
      setGates((c) => withAt(c, index, kind));
    } else if (slotType === 'inv' && kind === 'NOT') {
      setInvs((c) => withAt(c, index, 1));
    } else if (kind === 'NOT') {
      setNotice('NOT goes in a ○ slot on a wire, not in a gate.');
    } else {
      setNotice(`${kind} goes in a gate slot. Only NOT fits on a wire.`);
    }
  }, []);

  const onSlot = (slotType, index) => {
    // The board is locked once it matches, until Next.
    if (matches) return;
    if (held) {
      place(held, slotType, index);
      setHeld(null);
      return;
    }
    // Nothing armed: a gate click cycles through the palette, then empty;
    // an inverter click toggles.
    if (slotType === 'gate') setGates((c) => withAt(c, index, cycle(shape.palette, c[index])));
    else setInvs((c) => withAt(c, index, c[index] ? 0 : 1));
  };

  const onPointerDown = (kind) => (event) => {
    if (matches) return;
    origin.current = { x: event.clientX, y: event.clientY, kind, moved: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    const from = origin.current;
    if (!from) return;
    const far = Math.hypot(event.clientX - from.x, event.clientY - from.y) > 6;
    if (!far && !from.moved) return;
    from.moved = true;
    setDrag({ kind: from.kind, x: event.clientX, y: event.clientY });
  };

  const onPointerUp = (event) => {
    const from = origin.current;
    origin.current = null;
    if (!from) return;
    if (!from.moved) {
      // A tap, not a drag: arm the chip and let the next slot click place it.
      setHeld((c) => (c === from.kind ? null : from.kind));
      setDrag(null);
      return;
    }
    // The ghost is pointer-events:none, so this hits what is underneath it.
    const under = document.elementFromPoint(event.clientX, event.clientY);
    const slot = under?.closest?.('[data-slot]');
    if (slot) place(from.kind, slot.dataset.slot, Number(slot.dataset.index));
    setDrag(null);
  };

  // Number keys arm parts in palette order; Escape drops the held part.
  const onKeyDown = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || matches) return;
    const idx = Number(e.key) - 1;
    if (Number.isInteger(idx) && idx >= 0 && idx < parts.length) {
      e.preventDefault();
      setHeld((c) => (c === parts[idx] ? null : parts[idx]));
    } else if (e.key === 'Escape') {
      setHeld(null);
    }
  };

  const armed = drag?.kind ?? held;
  const named = NAMES[puzzle.key];
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  return (
    <div className="game gate" onKeyDown={onKeyDown}>
      <p className="game-task">
        <span className="eyebrow">Level {level + 1}</span>
        <strong>
          {topo.n} inputs · {plural(gateCount, 'gate')}
          {shape.inv ? ' · inverters' : ''}
          {shape.palette === INVERTING ? ' · NAND/NOR only' : ''}
        </strong>
        <span className="game-step" title="Clean: solved with no hint and the fewest parts">
          solved {solved} · {clean} clean
        </span>
      </p>
      <p className="gate-note">{shape.note}</p>

      <div className="bin" aria-label="Parts">
        {parts.map((kind, i) => (
          <button
            key={kind}
            type="button"
            className={`chip chip-${kind.toLowerCase()}${held === kind ? ' is-held' : ''}`}
            title={`${kind} (key ${i + 1})`}
            onPointerDown={onPointerDown(kind)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setHeld((c) => (c === kind ? null : kind));
              }
            }}
          >
            <PartIcon kind={kind} />
            {kind}
            <span className="chip-key">{i + 1}</span>
          </button>
        ))}
        <span className="bin-hint game-muted">
          {held ? `${held} held. Click a slot.` : 'Drag a part onto the board, or click a gate to cycle it.'}
        </span>
      </div>

      <div className="gate-board">
        <div className="gate-sch">
          <Schematic
            topo={topo}
            shape={shape}
            gates={gates}
            invs={invs}
            sim={sim}
            probe={probe}
            target={puzzle.table[probe]}
            complete={complete}
            armed={armed}
            locked={matches}
            flash={flash}
            onSlot={onSlot}
            onToggle={(i) => setProbe((p) => p ^ (1 << (topo.n - 1 - i)))}
          />
          <p className="gate-expr">
            OUT = {expr}
          </p>
          <p className="game-muted gate-probe">
            Wires show row {LETTERS.slice(0, topo.n).map((l, i) => `${l}=${(probe >> (topo.n - 1 - i)) & 1}`).join(' ')}.
            Click a table row or an input bit to probe another.
          </p>
        </div>

        <table className="tt">
          <thead>
            <tr>
              {LETTERS.slice(0, topo.n).map((l) => (
                <th key={l}>{l}</th>
              ))}
              <th>Target</th>
              <th>Yours</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, row) => {
              const state = complete ? (mine[row] === puzzle.table[row] ? 'is-ok' : 'is-bad') : '';
              return (
                <tr
                  key={row}
                  className={`${state}${row === probe ? ' is-probe' : ''}`}
                  onClick={() => setProbe(row)}
                >
                  {LETTERS.slice(0, topo.n).map((l, i) => (
                    <td key={l}>{(row >> (topo.n - 1 - i)) & 1}</td>
                  ))}
                  <td>{puzzle.table[row]}</td>
                  <td>{mine[row] ?? '·'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {matches ? (
        <div className="gate-result" role="status">
          <strong className="gate-win">
            {assist === 'shown' ? 'One solution.' : 'Matched.'}
            {shape.inv && assist !== 'shown'
              ? used === puzzle.minCost
                ? ` ${plural(used, 'inverter')}, the fewest possible.`
                : ` ${plural(used, 'inverter')}. It can be done with ${puzzle.minCost}.`
              : ''}
            {assist === 'hint' ? ' Hint used.' : ''}
          </strong>
          {named && <span>This table is {named}.</span>}
          <span className="game-muted">
            {plural(puzzle.solutions.length, 'different circuit')} on this board produce it.
          </span>
          <span>
            <button ref={nextRef} type="button" className="game-btn" onClick={advance}>
              {assist === 'shown' ? 'Next puzzle' : `Level ${level + 2}`} →
            </button>
          </span>
        </div>
      ) : (
        <div className="game-status" role="status">
          {notice ? (
            <strong className="gate-notice">{notice}</strong>
          ) : (
            <span className="game-muted">
              {complete ? `${hits} of ${rows} rows match` : 'Fill every gate slot.'}
            </span>
          )}
          <button type="button" className="game-btn" onClick={giveHint}>
            Hint
          </button>
          <button type="button" className="game-btn" onClick={clearBoard}>
            Clear
          </button>
          <button type="button" className="game-btn" onClick={() => loadPuzzle(level)}>
            New puzzle
          </button>
          <button type="button" className="game-btn" onClick={showSolution}>
            Show solution
          </button>
          {(level > 0 || solved > 0) && (
            <button type="button" className="game-btn game-btn-quiet" onClick={resetProgress}>
              Back to level 1
            </button>
          )}
        </div>
      )}

      {drag && (
        <span className="chip chip-ghost" style={{ left: drag.x, top: drag.y }}>
          <PartIcon kind={drag.kind} />
          {drag.kind}
        </span>
      )}
    </div>
  );
}
