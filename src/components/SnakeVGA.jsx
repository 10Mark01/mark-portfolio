import { useCallback, useEffect, useRef, useState } from 'react';

/* Same geometry as the DE1-SoC framebuffer the physics sim emulates:
   320x240 drawn at 1x, scaled 2x by CSS with nearest-neighbour so the
   pixels stay square instead of going soft. */
const W = 320;
const H = 240;
const CELL = 8;
const COLS = W / CELL;
const ROWS = H / CELL;

/* Tick period shrinks with every pellet, down to a floor. */
const TICK_START_MS = 120;
const TICK_MIN_MS = 60;
const TICK_STEP_MS = 2.5;
const tickFor = (score) => Math.max(TICK_MIN_MS, TICK_START_MS - score * TICK_STEP_MS);

/* Two turns can be queued inside one tick, so a quick down-then-left
   U-turn registers instead of dropping the second key. */
const MAX_QUEUED_TURNS = 2;

const BEST_KEY = 'mark-portfolio:snake-best';

const PALETTE = {
  bg: '#0b0f1a',
  grid: '#141a2b',
  snake: '#49d0b0',
  head: '#8ef7dc',
  food: '#e2643c',
  dead: '#e2643c',
};

const START = [
  { x: 8, y: 15 },
  { x: 7, y: 15 },
  { x: 6, y: 15 },
];

const KEYS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
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

export function SnakeVGA() {
  const canvasRef = useRef(null);
  const boardRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [dead, setDead] = useState(false);
  const [newBest, setNewBest] = useState(false);

  const snake = useRef([...START]);
  const dir = useRef({ x: 1, y: 0 });
  const turns = useRef([]);
  const food = useRef({ x: 24, y: 15 });
  const scoreRef = useRef(0);

  useEffect(() => setBest(readBest()), []);

  // A 180-degree turn would eat your own neck, so each turn is checked
  // against the last direction it will follow, queued or current.
  const steer = useCallback((want) => {
    const queue = turns.current;
    const last = queue.length ? queue[queue.length - 1] : dir.current;
    if (want.x === last.x && want.y === last.y) return;
    if (want.x === -last.x && want.y === -last.y) return;
    if (queue.length >= MAX_QUEUED_TURNS) return;
    queue.push(want);
  }, []);

  /* Phones have no arrow keys, so the board also takes swipes. */
  const touchStart = useRef(null);
  const onTouchStart = (event) => {
    const t = event.changedTouches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (event) => {
    const from = touchStart.current;
    if (!from) return;
    const t = event.changedTouches[0];
    const dx = t.clientX - from.x;
    const dy = t.clientY - from.y;
    touchStart.current = null;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
    steer(
      Math.abs(dx) > Math.abs(dy)
        ? { x: Math.sign(dx), y: 0 }
        : { x: 0, y: Math.sign(dy) }
    );
  };

  const placeFood = useCallback(() => {
    const taken = new Set(snake.current.map((s) => s.y * COLS + s.x));
    const free = [];
    for (let i = 0; i < COLS * ROWS; i += 1) if (!taken.has(i)) free.push(i);
    if (!free.length) return;
    const i = free[Math.floor(Math.random() * free.length)];
    food.current = { x: i % COLS, y: Math.floor(i / COLS) };
  }, []);

  const draw = useCallback((crashed = false) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = PALETTE.grid;
    for (let x = 0; x < COLS; x += 1) {
      for (let y = 0; y < ROWS; y += 1) {
        ctx.fillRect(x * CELL, y * CELL, 1, 1);
      }
    }

    ctx.fillStyle = PALETTE.food;
    ctx.fillRect(food.current.x * CELL + 1, food.current.y * CELL + 1, CELL - 2, CELL - 2);

    snake.current.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? (crashed ? PALETTE.dead : PALETTE.head) : PALETTE.snake;
      ctx.fillRect(seg.x * CELL, seg.y * CELL, CELL - 1, CELL - 1);
    });
  }, []);

  const reset = useCallback(() => {
    snake.current = [...START];
    dir.current = { x: 1, y: 0 };
    turns.current = [];
    scoreRef.current = 0;
    placeFood();
    draw();
    setScore(0);
    setDead(false);
    setNewBest(false);
    setPaused(false);
    setRunning(true);
    boardRef.current?.focus({ preventScroll: true });
  }, [placeFood, draw]);

  const die = useCallback(() => {
    draw(true);
    setDead(true);
    setRunning(false);
    setPaused(false);
    const final = scoreRef.current;
    if (final > readBest()) {
      writeBest(final);
      setBest(final);
      setNewBest(final > 0);
    }
  }, [draw]);

  // Draw the idle frame once so the panel is never an empty box.
  useEffect(() => {
    draw();
  }, [draw]);

  // Keys are only captured while a game is live, so arrow keys and space
  // scroll the page normally the rest of the time.
  useEffect(() => {
    if (!running) return undefined;
    const onKey = (event) => {
      if (event.key === ' ' || event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
        event.preventDefault();
        setPaused((p) => (event.key === 'Escape' ? true : !p));
        return;
      }
      if (paused) return;
      const want = KEYS[event.key] || KEYS[event.key?.toLowerCase?.()];
      if (!want) return;
      // Stop arrow keys scrolling the page out from under the board.
      event.preventDefault();
      steer(want);
    };
    window.addEventListener('keydown', onKey, { passive: false });
    return () => window.removeEventListener('keydown', onKey);
  }, [running, paused, steer]);

  // Pause when the tab is hidden or the board scrolls mostly out of view,
  // instead of dying off-screen.
  useEffect(() => {
    if (!running || paused) return undefined;
    const onHide = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener('visibilitychange', onHide);

    let observer;
    if (typeof IntersectionObserver !== 'undefined' && boardRef.current) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.intersectionRatio < 0.5) setPaused(true);
        },
        { threshold: [0, 0.5, 1] }
      );
      observer.observe(boardRef.current);
    }
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      observer?.disconnect();
    };
  }, [running, paused]);

  useEffect(() => {
    if (!running || paused) return undefined;

    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const step = () => {
      if (turns.current.length) dir.current = turns.current.shift();
      const head = snake.current[0];
      const next = { x: head.x + dir.current.x, y: head.y + dir.current.y };

      const hitWall = next.x < 0 || next.y < 0 || next.x >= COLS || next.y >= ROWS;
      const eating = next.x === food.current.x && next.y === food.current.y;
      // The tail moves out of the way this tick unless we are growing.
      const body = eating ? snake.current : snake.current.slice(0, -1);
      const hitSelf = body.some((s) => s.x === next.x && s.y === next.y);
      if (hitWall || hitSelf) {
        die();
        return false;
      }

      snake.current = [next, ...body];
      if (eating) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        placeFood();
      }
      return true;
    };

    const loop = (now) => {
      acc += now - last;
      last = now;
      const tick = tickFor(scoreRef.current);
      // Never try to catch up more than a couple of ticks after a stall.
      if (acc > tick * 2) acc = tick * 2;
      if (acc >= tick) {
        acc -= tick;
        if (!step()) return;
        draw();
      }
      raf = window.requestAnimationFrame(loop);
    };

    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [running, paused, draw, placeFood, die]);

  const overlay = !running || paused;

  return (
    <div className="game">
      <p className="game-task">
        <span className="eyebrow">320 × 240</span>
        <strong>Snake</strong>
        <span className="game-step">
          score {score} · best {best}
        </span>
      </p>

      <div
        ref={boardRef}
        className="vga"
        tabIndex={-1}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: running && !paused ? 'none' : 'auto' }}
      >
        <canvas ref={canvasRef} width={W} height={H} aria-label="Snake game board" />
        {overlay && (
          <div className="vga-overlay">
            {paused && <p className="vga-dead">Paused at {score}</p>}
            {dead && (
              <p className="vga-dead">
                {newBest ? `New best: ${score}` : `Crashed at ${score}`}
              </p>
            )}
            {paused ? (
              <button type="button" className="game-btn" onClick={() => setPaused(false)}>
                Resume
              </button>
            ) : (
              <button type="button" className="game-btn" onClick={reset}>
                {dead ? 'Run again' : 'Run it'}
              </button>
            )}
          </div>
        )}
      </div>

      <p className="game-muted game-controls">
        Arrow keys, WASD, or swipe. Space pauses. Speeds up as it grows. Walls are fatal.
      </p>
    </div>
  );
}
