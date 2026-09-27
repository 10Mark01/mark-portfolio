import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const GATES = {
  AND: (a, b) => a & b,
  OR: (a, b) => a | b,
  XOR: (a, b) => a ^ b,
};
const GATE_KINDS = Object.keys(GATES);
const PALETTE = [...GATE_KINDS, 'NOT'];

/**
 * Difficulty ladder. Levels are endless — past the last rung the shape stays
 * at its hardest and only the generated puzzle changes.
 *
 * 1 gate  :  out = G0(A, B)
 * 2 gates :  X = G0(A, B),  out = G1(X, C)
 *
 * `inv` adds an inverter slot on every operand leg.
 */
function shapeFor(level) {
  if (level < 1) return { n: 2, gates: 1, inv: false };
  if (level < 4) return { n: 2, gates: 1, inv: true };
  if (level < 7) return { n: 3, gates: 2, inv: false };
  return { n: 3, gates: 2, inv: true };
}

const legCount = (shape) => shape.gates * 2;

/** Evaluate one row. Returns null while any gate slot is still empty.
 *  Only the slots THIS shape uses count: `gates` is always length 2, so a
 *  one-gate shape leaves index 1 null and checking the whole array would
 *  report every board as incomplete. */
function evalRow(shape, gates, invs, row) {
  if (gates.slice(0, shape.gates).some((g) => !g)) return null;
  const bit = (i) => (row >> (shape.n - 1 - i)) & 1;
  const leg = (value, slot) => (invs[slot] ? value ^ 1 : value);

  const first = GATES[gates[0]](leg(bit(0), 0), leg(bit(1), 1));
  if (shape.gates === 1) return first;
  return GATES[gates[1]](leg(first, 2), leg(bit(2), 3));
}

const tableOf = (shape, gates, invs) =>
  Array.from({ length: 1 << shape.n }, (_, row) => evalRow(shape, gates, invs, row));

const pick = (list) => list[Math.floor(Math.random() * list.length)];

/** A puzzle nobody can solve is worse than an easy one, so the target is
 *  derived from a circuit this shape can actually build. */
function generate(shape, avoidKey) {
  for (let tries = 0; tries < 400; tries += 1) {
    const gates = Array.from({ length: shape.gates }, () => pick(GATE_KINDS));
    const invs = Array.from({ length: legCount(shape) }, () =>
      shape.inv && Math.random() < 0.38 ? 1 : 0
    );
    const table = tableOf(shape, gates, invs);

    // A constant column is not a puzzle, it is a shrug.
    if (table.every((v) => v === table[0])) continue;

    // Every input should matter, or the table has dead rows.
    let usesAll = true;
    for (let i = 0; i < shape.n && usesAll; i += 1) {
      const flip = 1 << (shape.n - 1 - i);
      usesAll = table.some((v, row) => (row & flip) === 0 && v !== table[row | flip]);
    }
    if (!usesAll) continue;

    const key = table.join('');
    if (key === avoidKey) continue;
    return { table, key, solution: { gates: padGates(gates), invs: padInvs(invs) } };
  }
  const gates = Array.from({ length: shape.gates }, () => 'XOR');
  const invs = Array(legCount(shape)).fill(0);
  const table = tableOf(shape, gates, invs);
  return { table, key: table.join(''), solution: { gates: padGates(gates), invs: padInvs(invs) } };
}

/* Board state is always two gate slots and four inverter slots. */
const padGates = (g) => [g[0] ?? null, g[1] ?? null];
const padInvs = (v) => [0, 1, 2, 3].map((i) => v[i] ?? 0);

/* Progress survives switching tabs and reloading. */
const SAVE_KEY = 'mark-portfolio:gates-progress';
const readSaved = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SAVE_KEY) || '{}');
    return {
      level: Math.max(0, Math.floor(Number(saved.level)) || 0),
      solved: Math.max(0, Math.floor(Number(saved.solved)) || 0),
    };
  } catch {
    return { level: 0, solved: 0 };
  }
};
const writeSaved = (level, solved) => {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify({ level, solved }));
  } catch {
    /* ignore */
  }
};

const LETTERS = ['A', 'B', 'C'];

export function GateGame() {
  const [saved] = useState(readSaved);
  const [level, setLevel] = useState(saved.level);
  const [solved, setSolved] = useState(saved.solved);
  const shape = useMemo(() => shapeFor(level), [level]);

  const [puzzle, setPuzzle] = useState(() => generate(shapeFor(saved.level), null));
  // Set when the player asked for the answer: the board still advances, but
  // it does not count as solved and the level does not go up.
  const [revealed, setRevealed] = useState(false);
  // One-line feedback for a part dropped in a slot that cannot take it.
  const [notice, setNotice] = useState(null);

  useEffect(() => writeSaved(level, solved), [level, solved]);

  useEffect(() => {
    if (!notice) return undefined;
    const id = window.setTimeout(() => setNotice(null), 2200);
    return () => window.clearTimeout(id);
  }, [notice]);
  const [gates, setGates] = useState([null, null]);
  const [invs, setInvs] = useState([0, 0, 0, 0]);

  // `held` is the tap-to-place selection; `drag` is the live pointer drag.
  const [held, setHeld] = useState(null);
  const [drag, setDrag] = useState(null);
  const origin = useRef(null);

  const mine = useMemo(() => tableOf(shape, gates, invs), [shape, gates, invs]);
  const complete = gates.slice(0, shape.gates).every(Boolean);
  const matches = complete && mine.every((v, i) => v === puzzle.table[i]);

  const clearBoard = useCallback(() => {
    setGates([null, null]);
    setInvs([0, 0, 0, 0]);
    setHeld(null);
    setNotice(null);
  }, []);

  const nextPuzzle = useCallback(
    (nextLevel) => {
      setLevel(nextLevel);
      setPuzzle(generate(shapeFor(nextLevel), puzzle.key));
      setRevealed(false);
      clearBoard();
    },
    [clearBoard, puzzle.key]
  );

  // Advance a beat after the board goes green, so the solve is visible.
  // A revealed answer gets longer on screen, since it is there to be read.
  useEffect(() => {
    if (!matches) return undefined;
    const id = window.setTimeout(
      () => {
        if (revealed) {
          nextPuzzle(level);
        } else {
          setSolved((s) => s + 1);
          nextPuzzle(level + 1);
        }
      },
      revealed ? 2600 : 700
    );
    return () => window.clearTimeout(id);
  }, [matches, revealed, level, nextPuzzle]);

  const showSolution = () => {
    setGates(puzzle.solution.gates);
    setInvs(puzzle.solution.invs);
    setHeld(null);
    setNotice(null);
    setRevealed(true);
  };

  const resetProgress = () => {
    setSolved(0);
    nextPuzzle(0);
  };

  const place = useCallback((kind, slotType, index) => {
    if (slotType === 'gate' && kind !== 'NOT') {
      setGates((current) => {
        const next = [...current];
        next[index] = kind;
        return next;
      });
    } else if (slotType === 'inv' && kind === 'NOT') {
      setInvs((current) => {
        const next = [...current];
        next[index] = 1;
        return next;
      });
    } else if (kind === 'NOT') {
      setNotice('NOT goes in a ○ slot on a wire, not in a gate box');
    } else {
      setNotice(`${kind} goes in a gate box, only NOT fits on a wire`);
    }
  }, []);

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
      setHeld((current) => (current === from.kind ? null : from.kind));
      setDrag(null);
      return;
    }

    // The ghost is pointer-events:none, so this hits what is underneath it.
    const under = document.elementFromPoint(event.clientX, event.clientY);
    const slot = under?.closest?.('[data-slot]');
    if (slot) {
      place(from.kind, slot.dataset.slot, Number(slot.dataset.index));
    }
    setDrag(null);
  };

  const onSlotClick = (slotType, index) => () => {
    // The board is locked for the beat between a match and the next puzzle.
    if (matches) return;
    if (held) {
      place(held, slotType, index);
      setHeld(null);
      return;
    }
    // No chip armed: clicking a filled slot empties it.
    if (slotType === 'gate') {
      setGates((c) => {
        const next = [...c];
        next[index] = null;
        return next;
      });
    } else {
      setInvs((c) => {
        const next = [...c];
        next[index] = 0;
        return next;
      });
    }
  };

  const rows = 1 << shape.n;
  const stageOperands =
    shape.gates === 1
      ? [[{ label: 'A', slot: 0 }, { label: 'B', slot: 1 }]]
      : [
          [{ label: 'A', slot: 0 }, { label: 'B', slot: 1 }],
          [{ label: 'X', slot: 2 }, { label: 'C', slot: 3 }],
        ];

  return (
    <div className="game gate">
      <p className="game-task">
        <span className="eyebrow">Level {level + 1}</span>
        <strong>
          {shape.n} inputs · {shape.gates} gate{shape.gates > 1 ? 's' : ''}
          {shape.inv ? ' · inverters' : ''}
        </strong>
        <span className="game-step">solved {solved}</span>
      </p>

      <div className="bin" aria-label="Parts">
        {PALETTE.map((kind) => (
          <button
            key={kind}
            type="button"
            className={`chip chip-${kind.toLowerCase()}${held === kind ? ' is-held' : ''}`}
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
            {kind}
          </button>
        ))}
        <span className="bin-hint game-muted">
          {held ? `${held} held, tap a slot` : 'drag a part, or tap it then tap a slot'}
        </span>
      </div>

      <div className="rig">
        {stageOperands.slice(0, shape.gates).map((legs, stage) => (
          <div className="rig-stage" key={stage}>
            <div className="rig-legs">
              {legs.map((legItem) => (
                <div className="rig-leg" key={legItem.label}>
                  <span className="rig-sig">{legItem.label}</span>
                  {shape.inv && (
                    <button
                      type="button"
                      data-slot="inv"
                      data-index={legItem.slot}
                      aria-label={`Inverter on ${legItem.label}: ${invs[legItem.slot] ? 'NOT' : 'empty'}`}
                      className={invs[legItem.slot] ? 'drop drop-inv is-set' : 'drop drop-inv'}
                      onClick={onSlotClick('inv', legItem.slot)}
                    >
                      {invs[legItem.slot] ? 'NOT' : '○'}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              data-slot="gate"
              data-index={stage}
              aria-label={`Gate ${stage + 1}: ${gates[stage] ?? 'empty'}`}
              className={gates[stage] ? 'drop drop-gate is-set' : 'drop drop-gate'}
              onClick={onSlotClick('gate', stage)}
            >
              {gates[stage] ?? 'gate'}
            </button>

            <span className="rig-out">{shape.gates === 1 || stage === 1 ? 'OUT' : 'X'}</span>
          </div>
        ))}
      </div>

      <table className="tt">
        <thead>
          <tr>
            {LETTERS.slice(0, shape.n).map((l) => (
              <th key={l}>{l}</th>
            ))}
            <th>Target</th>
            <th>Yours</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, row) => {
            const ok = complete && mine[row] === puzzle.table[row];
            return (
              <tr key={row} className={complete ? (ok ? 'is-ok' : 'is-bad') : undefined}>
                {LETTERS.slice(0, shape.n).map((l, i) => (
                  <td key={l}>{(row >> (shape.n - 1 - i)) & 1}</td>
                ))}
                <td>{puzzle.table[row]}</td>
                <td>{mine[row] ?? '·'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="game-status" role="status">
        {matches ? (
          revealed ? (
            <strong className="gate-win">One solution. Next puzzle…</strong>
          ) : (
            <strong className="gate-win">Matched. Next puzzle…</strong>
          )
        ) : (
          <>
            {notice ? (
              <strong className="gate-notice">{notice}</strong>
            ) : (
              <span className="game-muted">
                {complete
                  ? `${mine.filter((v, i) => v === puzzle.table[i]).length} of ${rows} rows matching`
                  : 'fill every gate slot'}
              </span>
            )}{' '}
            <button type="button" className="game-btn" onClick={clearBoard}>
              Clear
            </button>{' '}
            <button type="button" className="game-btn" onClick={() => nextPuzzle(level)}>
              New puzzle
            </button>{' '}
            <button type="button" className="game-btn" onClick={showSolution}>
              Show solution
            </button>
            {(level > 0 || solved > 0) && (
              <>
                {' '}
                <button type="button" className="game-btn game-btn-quiet" onClick={resetProgress}>
                  Back to level 1
                </button>
              </>
            )}
          </>
        )}
      </p>

      {drag && (
        <span className="chip chip-ghost" style={{ left: drag.x, top: drag.y }}>
          {drag.kind}
        </span>
      )}
    </div>
  );
}
