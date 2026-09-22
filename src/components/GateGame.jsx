import { useMemo, useState } from 'react';

const GATES = {
  AND: (a, b) => a & b,
  OR: (a, b) => a | b,
  XOR: (a, b) => a ^ b,
  NAND: (a, b) => (a & b) ^ 1,
  NOR: (a, b) => (a | b) ^ 1,
  XNOR: (a, b) => (a ^ b) ^ 1,
};
const GATE_NAMES = Object.keys(GATES);

/**
 * Each level is defined by its SOLUTION and the target column is derived from
 * it. Hand-writing a target is how you end up with a puzzle this topology
 * cannot satisfy; deriving it makes every level reachable by construction.
 *
 * Topology: 2 inputs -> g0(A,B).  3 inputs -> g1( g0(A,B), C ).
 * Each input also has an inverter the player can toggle.
 */
const LEVELS = [
  { n: 2, label: 'A ⊕ B', sol: { g: ['XOR'], inv: [0, 0] } },
  { n: 2, label: 'A · B̅', sol: { g: ['AND'], inv: [0, 1] } },
  { n: 3, label: '(A · B) + C', sol: { g: ['AND', 'OR'], inv: [0, 0, 0] } },
  { n: 3, label: 'A ⊕ B ⊕ C — full-adder sum', sol: { g: ['XOR', 'XOR'], inv: [0, 0, 0] } },
  { n: 3, label: '((A + B) · C)′', sol: { g: ['OR', 'NAND'], inv: [0, 0, 0] } },
];

const LETTERS = ['A', 'B', 'C'];

function evaluate(n, gates, inv, row) {
  const bits = [];
  for (let i = 0; i < n; i += 1) {
    const raw = (row >> (n - 1 - i)) & 1;
    bits.push(inv[i] ? raw ^ 1 : raw);
  }
  const first = GATES[gates[0]](bits[0], bits[1]);
  return n === 2 ? first : GATES[gates[1]](first, bits[2]);
}

export function GateGame() {
  const [levelIndex, setLevelIndex] = useState(0);
  const level = LEVELS[levelIndex];
  const slots = level.n === 2 ? 1 : 2;

  const [gates, setGates] = useState(['AND', 'AND']);
  const [inv, setInv] = useState([0, 0, 0]);

  const rows = 1 << level.n;

  const target = useMemo(
    () =>
      Array.from({ length: rows }, (_, row) =>
        evaluate(level.n, level.sol.g, level.sol.inv, row)
      ),
    [level, rows]
  );

  const mine = useMemo(
    () => Array.from({ length: rows }, (_, row) => evaluate(level.n, gates, inv, row)),
    [level.n, gates, inv, rows]
  );

  const solved = mine.every((v, i) => v === target[i]);
  const last = levelIndex === LEVELS.length - 1;

  const cycleGate = (slot) =>
    setGates((current) => {
      const next = [...current];
      const at = GATE_NAMES.indexOf(current[slot]);
      next[slot] = GATE_NAMES[(at + 1) % GATE_NAMES.length];
      return next;
    });

  const toggleInv = (i) =>
    setInv((current) => {
      const next = [...current];
      next[i] ^= 1;
      return next;
    });

  const reset = (index) => {
    setLevelIndex(index);
    setGates(['AND', 'AND']);
    setInv([0, 0, 0]);
  };

  return (
    <div className="game">
      <p className="game-task">
        <span className="eyebrow">Target</span>
        <strong>{level.label}</strong>
        <span className="game-step">
          {levelIndex + 1} / {LEVELS.length}
        </span>
      </p>

      <div className="gate-rig">
        <div className="gate-inputs">
          {LETTERS.slice(0, level.n).map((letter, i) => (
            <button
              key={letter}
              type="button"
              className={inv[i] ? 'gate-inv is-on' : 'gate-inv'}
              onClick={() => toggleInv(i)}
              aria-pressed={inv[i] === 1}
            >
              {letter}
              {inv[i] ? '̅' : ''}
              <span className="gate-inv-tag">{inv[i] ? 'INV' : '—'}</span>
            </button>
          ))}
        </div>

        <div className="gate-slots">
          {Array.from({ length: slots }, (_, slot) => (
            <button key={slot} type="button" className="gate-slot" onClick={() => cycleGate(slot)}>
              <span className="gate-slot-name">{gates[slot]}</span>
              <span className="gate-slot-hint">
                {slot === 0 ? 'A, B' : 'prev, C'} · tap to change
              </span>
            </button>
          ))}
        </div>
      </div>

      <table className="tt">
        <thead>
          <tr>
            {LETTERS.slice(0, level.n).map((l) => (
              <th key={l}>{l}</th>
            ))}
            <th>Target</th>
            <th>Yours</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, row) => {
            const ok = mine[row] === target[row];
            return (
              <tr key={row} className={ok ? 'is-ok' : 'is-bad'}>
                {LETTERS.slice(0, level.n).map((l, i) => (
                  <td key={l}>{(row >> (level.n - 1 - i)) & 1}</td>
                ))}
                <td>{target[row]}</td>
                <td>{mine[row]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="game-status" role="status">
        {solved ? (
          last ? (
            <>
              <strong>All five solved.</strong>{' '}
              <button type="button" className="game-btn" onClick={() => reset(0)}>
                Start over
              </button>
            </>
          ) : (
            <>
              <strong>Solved.</strong>{' '}
              <button type="button" className="game-btn" onClick={() => reset(levelIndex + 1)}>
                Next level
              </button>
            </>
          )
        ) : (
          <span className="game-muted">
            {mine.filter((v, i) => v === target[i]).length} of {rows} rows matching
          </span>
        )}
      </p>
    </div>
  );
}
