import { useCallback, useEffect, useRef, useState } from 'react';

const ROUND_SECONDS = 60;
const BEST_KEY = 'mark-portfolio:bitdrill-best';

const MODES = [
  {
    id: 'dec2bin',
    ask: (v) => `${v}`,
    prompt: 'decimal → binary',
    answer: (v) => v.toString(2),
    max: 255,
  },
  {
    id: 'bin2dec',
    ask: (v) => v.toString(2).padStart(8, '0'),
    prompt: 'binary → decimal',
    answer: (v) => `${v}`,
    max: 255,
  },
  {
    id: 'dec2hex',
    ask: (v) => `${v}`,
    prompt: 'decimal → hex',
    answer: (v) => v.toString(16).toUpperCase(),
    max: 4095,
  },
  {
    id: 'hex2dec',
    ask: (v) => v.toString(16).toUpperCase(),
    prompt: 'hex → decimal',
    answer: (v) => `${v}`,
    max: 4095,
  },
];

const nextQuestion = () => {
  const mode = MODES[Math.floor(Math.random() * MODES.length)];
  return { mode, value: 1 + Math.floor(Math.random() * mode.max) };
};

/** localStorage throws in some privacy modes; a best score is never worth a crash. */
const readBest = () => {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
};
const writeBest = (n) => {
  try {
    window.localStorage.setItem(BEST_KEY, String(n));
  } catch {
    /* ignore */
  }
};

export function BitDrill() {
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [question, setQuestion] = useState(() => nextQuestion());
  const [entry, setEntry] = useState('');
  const [flash, setFlash] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => setBest(readBest()), []);

  useEffect(() => {
    if (!running) return undefined;
    const id = window.setInterval(() => setLeft((t) => t - 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (left > 0 || !running) return;
    setRunning(false);
    setScore((final) => {
      if (final > readBest()) {
        writeBest(final);
        setBest(final);
      }
      return final;
    });
  }, [left, running]);

  const start = useCallback(() => {
    setScore(0);
    setLeft(ROUND_SECONDS);
    setEntry('');
    setFlash(null);
    setQuestion(nextQuestion());
    setRunning(true);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const onChange = (event) => {
    const raw = event.target.value;
    setEntry(raw);
    if (!running) return;
    const want = question.mode.answer(question.value);
    if (raw.trim().toUpperCase() === want) {
      setScore((s) => s + 1);
      setFlash('ok');
      setEntry('');
      setQuestion(nextQuestion());
      window.setTimeout(() => setFlash(null), 180);
    }
  };

  const skip = () => {
    setQuestion(nextQuestion());
    setEntry('');
    setScore((s) => (s > 0 ? s - 1 : 0));
    inputRef.current?.focus();
  };

  return (
    <div className="game">
      <p className="game-task">
        <span className="eyebrow">Convert</span>
        <strong>60 seconds</strong>
        <span className="game-step">best {best}</span>
      </p>

      <div className={flash ? 'drill is-ok' : 'drill'}>
        <div className="drill-q">
          <span className="drill-value">{question.mode.ask(question.value)}</span>
          <span className="drill-prompt">{question.mode.prompt}</span>
        </div>

        <input
          ref={inputRef}
          className="drill-input"
          value={entry}
          onChange={onChange}
          disabled={!running}
          placeholder={running ? 'type the answer' : 'press start'}
          spellCheck="false"
          autoComplete="off"
          aria-label={`Convert ${question.mode.ask(question.value)}, ${question.mode.prompt}`}
        />
      </div>

      <div className="drill-meta">
        <span className="drill-clock">{String(left).padStart(2, '0')}s</span>
        <span className="game-muted">score {score}</span>
        {running ? (
          <button type="button" className="game-btn" onClick={skip}>
            Skip (−1)
          </button>
        ) : (
          <button type="button" className="game-btn" onClick={start}>
            {left === 0 ? 'Play again' : 'Start'}
          </button>
        )}
      </div>

      {!running && left === 0 && (
        <p className="game-status" role="status">
          <strong>Time.</strong> <span className="game-muted">{score} correct.</span>
        </p>
      )}
    </div>
  );
}
