import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The DE1-SoC physics simulator, running in the page.
 *
 * The C from the FPGA project is compiled to WebAssembly; `physics-runtime`
 * presents its framebuffer on a canvas and feeds it PS/2 scan codes. Nothing
 * loads until the visitor asks for it — the module and its three backdrops
 * are about 160 KB, and a portfolio page should not spend that on someone
 * who is only scrolling past.
 */

/* Which keys matter on each screen the program can be showing. */
const CONTROLS = {
  0: [
    { key: 'g', label: 'G', hint: 'Gas particles' },
    { key: 'e', label: 'E', hint: 'Electric fields' },
  ],
  1: [
    { key: 'w', label: 'W', hint: 'Add particle' },
    { key: 's', label: 'S', hint: 'Remove particle' },
    { key: 'a', label: 'A', hint: 'Compress' },
    { key: 'd', label: 'D', hint: 'Expand' },
    { key: 'h', label: 'H', hint: 'Heat' },
    { key: 'c', label: 'C', hint: 'Cool' },
    { key: 'm', label: 'M', hint: 'Menu' },
  ],
  2: [
    { key: 'w', label: 'W', hint: 'Up' },
    { key: 'a', label: 'A', hint: 'Left' },
    { key: 's', label: 'S', hint: 'Down' },
    { key: 'd', label: 'D', hint: 'Right' },
    { key: 'p', label: 'P', hint: 'Place +' },
    { key: 'n', label: 'N', hint: 'Place −' },
    { key: 'c', label: 'C', hint: 'Clear' },
    { key: 'm', label: 'M', hint: 'Menu' },
  ],
};

const MODE_NAME = { 0: 'Menu', 1: 'Gas particles', 2: 'Charges and fields' };

export function PhysicsSim({ base = '/physics', poster = '/physics/assets/menu.png' }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const apiRef = useRef(null);

  const [state, setState] = useState('idle');   // idle | loading | running | error
  const [mode, setMode] = useState(0);
  const [error, setError] = useState('');

  const start = useCallback(async () => {
    if (state !== 'idle') return;
    setState('loading');
    try {
      const { bootPhysics } = await import(
        /* @vite-ignore */ `${base}/physics-runtime.js`
      );
      apiRef.current = await bootPhysics(canvasRef.current, base);
      setState('running');
      canvasRef.current?.focus();
    } catch (err) {
      setError(err?.message || String(err));
      setState('error');
    }
  }, [base, state]);

  /* Poll the program for which screen it is on, to label the buttons. */
  useEffect(() => {
    if (state !== 'running') return undefined;
    const id = setInterval(() => {
      const m = apiRef.current?.mode?.();
      if (typeof m === 'number') setMode(m);
    }, 200);
    return () => clearInterval(id);
  }, [state]);

  /* Idle the simulation when it is off-screen or the tab is hidden. */
  useEffect(() => {
    if (state !== 'running') return undefined;
    const el = wrapRef.current;
    let visible = true;
    let onScreen = true;

    const apply = () => apiRef.current?.setPaused?.(!(visible && onScreen));

    const io = new IntersectionObserver(
      ([entry]) => { onScreen = entry.isIntersecting; apply(); },
      { threshold: 0.05 },
    );
    if (el) io.observe(el);

    const onVisibility = () => { visible = !document.hidden; apply(); };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [state]);

  useEffect(() => () => apiRef.current?.destroy?.(), []);

  const tap = (key) => {
    apiRef.current?.press(key);
    canvasRef.current?.focus();
  };

  return (
    <figure className="sim" ref={wrapRef}>
      <div className="sim-stage">
        <canvas
          ref={canvasRef}
          className="sim-canvas"
          tabIndex={0}
          width={640}
          height={480}
          aria-label="Physics simulator, VGA output"
          hidden={state !== 'running'}
        />

        {state !== 'running' && (
          <div className="sim-cover">
            <img src={poster} alt="" aria-hidden="true" className="sim-poster" />
            <div className="sim-overlay">
              {state === 'error' ? (
                <p className="sim-msg">Couldn’t start the simulator ({error}).</p>
              ) : (
                <button type="button" className="sim-go" onClick={start} disabled={state === 'loading'}>
                  {state === 'loading' ? 'Loading…' : 'Run it'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <figcaption className="sim-bar">
        {state === 'running' ? (
          <>
            <span className="sim-mode">{MODE_NAME[mode]}</span>
            <div className="sim-keys">
              {CONTROLS[mode].map(({ key, label, hint }) => (
                <button key={key} type="button" className="sim-key" onClick={() => tap(key)} title={hint}>
                  <span className="sim-key-cap">{label}</span>
                  <span className="sim-key-hint">{hint}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <span className="sim-note">
            DE1-SoC project compiled to WebAssembly — originally 320×240 VGA. Keyboard or buttons.
          </span>
        )}
      </figcaption>
    </figure>
  );
}
