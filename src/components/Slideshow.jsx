import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Deck viewer for a project.
 *
 * Takes the `slides` array off a project in content.js — each entry is
 * `{ src, caption }`, where `src` is the 1400px WebP and a matching
 * `@0.5x` file is assumed to sit beside it for narrow screens.
 *
 * Navigation, in rough order of how often it gets used:
 *   - click the slide itself to advance
 *   - the segment bar to jump anywhere directly, which matters once a deck
 *     runs to thirty-odd slides and stepping through is not viable
 *   - arrow buttons, wrapping at both ends
 *   - arrow keys once the viewer has focus, plus Home and End
 *
 * Only the current slide and its immediate neighbours carry a real `src`.
 * Because the ends wrap, the last slide counts as a neighbour of the first.
 */
export function Slideshow({ slides, label }) {
  const [index, setIndex] = useState(0);
  const frameRef = useRef(null);

  const count = slides.length;

  /* Wrapping means -1 lands on the last slide and count lands on the first. */
  const go = useCallback(
    (n) =>
      setIndex((current) => {
        const next = typeof n === 'function' ? n(current) : n;
        return ((next % count) + count) % count;
      }),
    [count],
  );

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;

    const onKey = (event) => {
      const keys = {
        ArrowLeft: () => go((i) => i - 1),
        ArrowRight: () => go((i) => i + 1),
        Home: () => go(0),
        End: () => go(count - 1),
      };
      const action = keys[event.key];
      if (!action) return;
      event.preventDefault();
      action();
    };

    frame.addEventListener('keydown', onKey);
    return () => frame.removeEventListener('keydown', onKey);
  }, [go, count]);

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
      <div
        className="deck-stage"
        onClick={() => go((i) => i + 1)}
        title="Click for the next slide"
      >
        {slides.map((slide, i) => {
          const distance = Math.abs(i - index);
          const near = distance <= 1 || distance === count - 1;
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

      {/* One segment per slide. Cheaper than a thumbnail rail — no images to
          fetch — while still allowing a jump straight to any slide. */}
      {count > 3 && (
        <div className="deck-track">
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              className={`deck-seg${i === index ? ' is-on' : ''}`}
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
            />
          ))}
        </div>
      )}

      <figcaption className="deck-bar">
        <button
          type="button"
          className="deck-nav"
          onClick={() => go((i) => i - 1)}
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
          aria-label="Next slide"
        >
          →
        </button>
      </figcaption>
    </figure>
  );
}
