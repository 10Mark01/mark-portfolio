import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Deck viewer for a project.
 *
 * Takes the `slides` array off a project in content.js — each entry is
 * `{ src, caption }`, where `src` is the 1400px WebP and a matching
 * `@0.5x` file is assumed to sit beside it for narrow screens.
 *
 * Only the current slide and its immediate neighbours are given a real
 * `src`, so a seven-slide deck costs one image on load rather than seven.
 * Arrow keys work once the viewer has focus — not globally, or they would
 * fight the page scroll.
 */
export function Slideshow({ slides, label }) {
  const [index, setIndex] = useState(0);
  const frameRef = useRef(null);

  const count = slides.length;
  const clamp = useCallback((n) => Math.min(Math.max(n, 0), count - 1), [count]);

  const go = useCallback(
    (n) => setIndex((current) => clamp(typeof n === 'function' ? n(current) : n)),
    [clamp],
  );

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;

    const onKey = (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        go((i) => i - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        go((i) => i + 1);
      }
    };

    frame.addEventListener('keydown', onKey);
    return () => frame.removeEventListener('keydown', onKey);
  }, [go]);

  const current = slides[index];

  return (
    <figure
      className="deck"
      ref={frameRef}
      tabIndex={0}
      role="group"
      aria-roledescription="slideshow"
      aria-label={label}
    >
      <div className="deck-stage">
        {slides.map((slide, i) => {
          // Render the neighbours so a click swaps an already-decoded image.
          const near = Math.abs(i - index) <= 1;
          const base = slide.src.replace(/\.webp$/, '');

          return (
            <img
              key={slide.src}
              className={`deck-slide${i === index ? ' is-current' : ''}`}
              src={near ? slide.src : undefined}
              srcSet={near ? `${base}@0.5x.webp 700w, ${slide.src} 1400w` : undefined}
              sizes="(max-width: 700px) 100vw, 700px"
              alt={`${label}, slide ${i + 1} of ${count}. ${slide.caption}`}
              width="1400"
              height="790"
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              aria-hidden={i === index ? undefined : 'true'}
            />
          );
        })}
      </div>

      <figcaption className="deck-bar">
        <button
          type="button"
          className="deck-nav"
          onClick={() => go((i) => i - 1)}
          disabled={index === 0}
          aria-label="Previous slide"
        >
          ←
        </button>

        <span className="deck-caption" aria-live="polite">
          {current.caption}
        </span>

        <span className="deck-count">
          {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
        </span>

        <button
          type="button"
          className="deck-nav"
          onClick={() => go((i) => i + 1)}
          disabled={index === count - 1}
          aria-label="Next slide"
        >
          →
        </button>
      </figcaption>
    </figure>
  );
}
