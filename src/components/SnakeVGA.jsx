import { useCallback, useEffect, useRef, useState } from 'react';

/* Same geometry as the DE1-SoC framebuffer the physics sim emulates:
   320x240 drawn at 1x, scaled 2x by CSS with nearest-neighbour so the
   pixels stay square instead of going soft. */
const W = 320;
const H = 240;
const CELL = 8;
const COLS = W / CELL;
const ROWS = H / CELL;
const TICK_MS = 110;

const PALETTE = {
  bg: '#0b0f1a',
  grid: '#141a2b',
  snake: '#49d0b0',
  head: '#8ef7dc',
  food: '#e2643c',
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

export function SnakeVGA() {
  const canvasRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);

  const snake = useRef([...START]);
  const dir = useRef({ x: 1, y: 0 });
  const queued = useRef({ x: 1, y: 0 });
  const food = useRef({ x: 24, y: 15 });

  // A 180-degree turn would eat your own neck on the next tick, so it is
  // rejected for both input methods here rather than in each handler.
  const steer = useCallback((want) => {
    if (want.x === -dir.current.x && want.y === -dir.current.y) return;
    queued.current = want;
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
    for (let guard = 0; guard < 500; guard += 1) {
      const spot = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
      };
      if (!snake.current.some((s) => s.x === spot.x && s.y === spot.y)) {
        food.current = spot;
        return;
      }
    }
  }, []);

  const draw = useCallback(() => {
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
      ctx.fillStyle = i === 0 ? PALETTE.head : PALETTE.snake;
      ctx.fillRect(seg.x * CELL, seg.y * CELL, CELL - 1, CELL - 1);
    });
  }, []);

  const reset = useCallback(() => {
    snake.current = [...START];
    dir.current = { x: 1, y: 0 };
    queued.current = { x: 1, y: 0 };
    placeFood();
    setScore(0);
    setDead(false);
    setRunning(true);
  }, [placeFood]);

  // Draw the idle frame once so the panel is never an empty box.
  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (!running) return undefined;

    const onKey = (event) => {
      const want = KEYS[event.key] || KEYS[event.key?.toLowerCase?.()];
      if (!want) return;
      // Stop arrow keys scrolling the page out from under the board.
      event.preventDefault();
      steer(want);
    };
    window.addEventListener('keydown', onKey, { passive: false });

    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const loop = (now) => {
      raf = window.requestAnimationFrame(loop);
      acc += now - last;
      last = now;
      if (acc < TICK_MS) return;
      acc = 0;

      dir.current = queued.current;
      const head = snake.current[0];
      const next = { x: head.x + dir.current.x, y: head.y + dir.current.y };

      const hitWall = next.x < 0 || next.y < 0 || next.x >= COLS || next.y >= ROWS;
      const hitSelf = snake.current.some((s) => s.x === next.x && s.y === next.y);
      if (hitWall || hitSelf) {
        setDead(true);
        setRunning(false);
        return;
      }

      snake.current = [next, ...snake.current];
      if (next.x === food.current.x && next.y === food.current.y) {
        setScore((s) => s + 1);
        placeFood();
      } else {
        snake.current.pop();
      }
      draw();
    };

    raf = window.requestAnimationFrame(loop);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
    };
  }, [running, draw, placeFood, steer]);

  return (
    <div className="game">
      <p className="game-task">
        <span className="eyebrow">320 × 240</span>
        <strong>Snake</strong>
        <span className="game-step">score {score}</span>
      </p>

      <div
        className="vga"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: running ? 'none' : 'auto' }}
      >
        <canvas ref={canvasRef} width={W} height={H} aria-label="Snake game board" />
        {!running && (
          <div className="vga-overlay">
            {dead && <p className="vga-dead">Crashed — {score}</p>}
            <button type="button" className="game-btn" onClick={reset}>
              {dead ? 'Run again' : 'Run it'}
            </button>
          </div>
        )}
      </div>

      <p className="game-muted game-controls">Arrow keys, WASD, or swipe. Walls are fatal.</p>
    </div>
  );
}
