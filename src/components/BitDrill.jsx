import { useCallback, useEffect, useRef, useState } from 'react';

const ROUND_SECONDS = 60;
const BEST_KEY = 'mark-portfolio:bitdrill-best';

/* Binary answers are shown in nibbles so an 8-bit value is readable at a glance. */
const nibbles = (bits) => bits.replace(/\B(?=(\d{4})+$)/g, ' ');

const CONVERSIONS = {
  dec2bin: {
    ask: (v) => `${v}`,
    prompt: 'decimal → binary',
    answer: (v) => v.toString(2),
    show: (v) => nibbles(v.toString(2)),
    base: 2,
    max: 255,
  },
  bin2dec: {
    ask: (v) => nibbles(v.toString(2).padStart(8, '0')),
    prompt: 'binary → decimal',
    answer: (v) => `${v}`,
    show: (v) => `${v}`,
    base: 10,
    max: 255,
  },
  dec2hex: {
    ask: (v) => `${v}`,
    prompt: 'decimal → hex',
    answer: (v) => v.toString(16).toUpperCase(),
    show: (v) => `0x${v.toString(16).toUpperCase()}`,
    base: 16,
    max: 4095,
  },
  hex2dec: {
    ask: (v) => `0x${v.toString(16).toUpperCase()}`,
    prompt: 'hex → decimal',
    answer: (v) => `${v}`,
    show: (v) => `${v}`,
    base: 10,
    max: 4095,
  },
  bin2hex: {
    ask: (v) => nibbles(v.toString(2).padStart(8, '0')),
    prompt: 'binary → hex',
    answer: (v) => v.toString(16).toUpperCase(),
    show: (v) => `0x${v.toString(16).toUpperCase()}`,
    base: 16,
    max: 255,
  },
  hex2bin: {
    ask: (v) => `0x${v.toString(16).toUpperCase()}`,
    prompt: 'hex → binary',
    answer: (v) => v.toString(2),
    show: (v) => nibbles(v.toString(2)),
    base: 2,
    max: 255,
  },
};

/* Each set keeps its own best score; `mix` keeps the original storage key. */
const SETS = [
  { id: 'mix', label: 'Mixed', modes: ['dec2bin', 'bin2dec', 'dec2hex', 'hex2dec'] },
  { id: 'bin', label: 'Binary', modes: ['dec2bin', 'bin2dec'] },
  { id: 'hex', label: 'Hex', modes: ['dec2hex', 'hex2dec'] },
  { id: 'b2h', label: 'Bin ↔ hex', modes: ['bin2hex', 'hex2bin'] },
];

const bestKey = (setId) => (setId === 'mix' ? BEST_KEY : `${BEST_KEY}:${setId}`);

const nextQuestion = (set, previous) => {
  for (let tries = 0; tries < 10; tries += 1) {
    const id = set.modes[Math.floor(Math.random() * set.modes.length)];
    const mode = CONVERSIONS[id];
    const value = 1 + Math.floor(Math.random() * mode.max);
    if (!previous || previous.value !== value || previous.id !== id) {
      return { id, mode, value };
    }
  }
  const id = set.modes[0];
  return { id, mode: CONVERSIONS[id], value: 1 };
};

/** Accept what an engineer would actually type: leading zeros, spaces or
 *  underscores between digit groups, and a 0b / 0x prefix. The typed value is
 *  compared numerically, so "0000 1010", "0b1010" and "1010" all count. */
const parseEntry = (raw, base) => {
  let s = raw.trim().toLowerCase().replace(/[\s_]/g, '');
  if (base === 2 && s.startsWith('0b')) s = s.slice(2);
  if (base === 16 && s.startsWith('0x')) s = s.slice(2);
  const digits = { 2: /^[01]+$/, 10: /^\d+$/, 16: /^[0-9a-f]+$/ }[base];
  if (!digits.test(s)) return null;
  return parseInt(s, base);
};

/** localStorage throws in some privacy modes; a best score is never worth a crash. */
const readBest = (setId) => {
  try {
    return Number(window.localStorage.getItem(bestKey(setId))) || 0;
  } catch {
    return 0;
  }
};
const writeBest = (setId, n) => {
  try {
    window.localStorage.setItem(bestKey(setId), String(n));
  } catch {
    /* ignore */
  }
};

export function BitDrill() {
  const [setId, setSetId] = useState('mix');
  const set = SETS.find((s) => s.id === setId) ?? SETS[0];

  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [left, setLeft] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  const [skips, setSkips] = useState(0);
  const [best, setBest] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const [question, setQuestion] = useState(() => nextQuestion(SETS[0], null));
  const [entry, setEntry] = useState('');
  const [flash, setFlash] = useState(null);
  const [reveal, setReveal] = useState(null);
  const inputRef = useRef(null);
  const deadline = useRef(0);
  const flashTimer = useRef(0);

  useEffect(() => setBest(readBest(setId)), [setId]);
  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  // Count down from a wall-clock deadline so a throttled background tab
  // cannot stretch the round.
  useEffect(() => {
    if (!running) return undefined;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setLeft(remaining);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running || left > 0) return;
    setRunning(false);
    setFinished(true);
    if (score > readBest(setId)) {
      writeBest(setId, score);
      setBest(score);
      setNewBest(true);
    }
  }, [left, running, score, setId]);

  const pulse = (kind) => {
    setFlash(kind);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 220);
  };

  const start = useCallback(() => {
    setScore(0);
    setSkips(0);
    setNewBest(false);
    setFinished(false);
    setEntry('');
    setFlash(null);
    setReveal(null);
    setQuestion(nextQuestion(set, null));
    deadline.current = Date.now() + ROUND_SECONDS * 1000;
    setLeft(ROUND_SECONDS);
    setRunning(true);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [set]);

  const chooseSet = (id) => {
    if (running) return;
    setSetId(id);
    setFinished(false);
    setLeft(ROUND_SECONDS);
    setScore(0);
    setReveal(null);
    setQuestion(nextQuestion(SETS.find((s) => s.id === id) ?? SETS[0], null));
  };

  const onChange = (event) => {
    const raw = event.target.value;
    setEntry(raw);
    if (!running) return;
    if (parseEntry(raw, question.mode.base) === question.value) {
      setScore((s) => s + 1);
      pulse('ok');
      setEntry('');
      setReveal(null);
      setQuestion((q) => nextQuestion(set, q));
    }
  };

  const skip = () => {
    // Show what the answer was, so a skip still teaches something.
    setReveal({
      ask: question.mode.ask(question.value),
      answer: question.mode.show(question.value),
    });
    pulse('skip');
    setQuestion((q) => nextQuestion(set, q));
    setEntry('');
    setSkips((n) => n + 1);
    setScore((s) => (s > 0 ? s - 1 : 0));
    inputRef.current?.focus();
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && running && entry.trim() === '') {
      event.preventDefault();
      skip();
    }
  };

  const typedBase = question.mode.base;

  return (
    <div className="game">
      <p className="game-task">
        <span className="eyebrow">Convert</span>
        <strong>{ROUND_SECONDS} seconds</strong>
        <span className="game-step">best {best}</span>
      </p>

      <div className="drill-sets" role="group" aria-label="Question set">
        {SETS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={s.id === setId ? 'drill-set is-current' : 'drill-set'}
            aria-pressed={s.id === setId}
            disabled={running && s.id !== setId}
            onClick={() => chooseSet(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className={flash ? `drill is-${flash}` : 'drill'}>
        <div className="drill-q">
          <span className="drill-value">{question.mode.ask(question.value)}</span>
          <span className="drill-prompt">{question.mode.prompt}</span>
        </div>

        <input
          ref={inputRef}
          className="drill-input"
          value={entry}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={!running}
          placeholder={running ? 'type the answer' : 'press start'}
          inputMode={typedBase === 16 ? 'text' : 'numeric'}
          autoCapitalize="characters"
          spellCheck="false"
          autoComplete="off"
          aria-label={`Convert ${question.mode.ask(question.value)}, ${question.mode.prompt}`}
        />
      </div>

      <p className="drill-reveal game-muted" aria-live="polite">
        {reveal ? (
          <>
            {reveal.ask} = <strong>{reveal.answer}</strong>
          </>
        ) : running ? (
          'Enter on an empty box skips (−1). 0x / 0b prefixes and leading zeros are fine.'
        ) : (
          ' '
        )}
      </p>

      <div className="drill-meta">
        <span className={left <= 10 && running ? 'drill-clock is-low' : 'drill-clock'}>
          {String(left).padStart(2, '0')}s
        </span>
        <span className="game-muted">score {score}</span>
        {running ? (
          <button type="button" className="game-btn" onClick={skip}>
            Skip (−1)
          </button>
        ) : (
          <button type="button" className="game-btn" onClick={start}>
            {finished ? 'Play again' : 'Start'}
          </button>
        )}
      </div>

      {finished && (
        <p className="game-status" role="status">
          <strong>{newBest ? 'New best.' : 'Time.'}</strong>{' '}
          <span className="game-muted">
            {score} correct, {skips} skipped.
          </span>
        </p>
      )}
    </div>
  );
}
