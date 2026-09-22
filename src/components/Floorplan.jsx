import { memo } from 'react';
import { blocks, traces, vias } from '../data/content.js';

/**
 * The die floorplan, and the page's main control.
 *
 * Each block is a real button: clicking one filters the project list below,
 * clicking it again clears the filter. The SVG is authored in a fixed
 * 560 × 210 user-space and scaled by CSS, so block coordinates in content.js
 * stay readable numbers instead of percentages.
 *
 * Accessibility note: an SVG <g> gets no keyboard behaviour for free, so each
 * block carries role/tabIndex/aria-pressed and handles Enter and Space itself.
 */
function FloorplanBase({ activeId, onSelect }) {
  const handleKeyDown = (event, id) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(id);
    }
  };

  return (
    <figure className="floorplan">
      <svg
        viewBox="0 0 560 210"
        className={activeId ? 'is-filtered' : undefined}
        aria-label="Chip floorplan. Each block filters the projects below."
      >
        <rect
          x="8" y="8" width="544" height="194" rx="2"
          fill="var(--die)" stroke="var(--line-strong)" strokeWidth="1"
        />

        {/* Pad ring. A dashed stroke draws evenly spaced pads for the price
            of four elements instead of eighty. */}
        <g stroke="var(--line-strong)" strokeWidth="7" strokeDasharray="7 12">
          <line x1="22" y1="18" x2="538" y2="18" />
          <line x1="22" y1="192" x2="538" y2="192" />
          <line x1="18" y1="30" x2="18" y2="180" />
          <line x1="542" y1="30" x2="542" y2="180" />
        </g>

        {/* Core boundary */}
        <rect
          x="32" y="32" width="496" height="132"
          fill="none" stroke="var(--line)" strokeWidth="1" strokeDasharray="3 4"
        />

        <g className="traces" fill="none" stroke="var(--copper)" strokeWidth="1.4">
          {traces.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>

        <g fill="var(--via)">
          {vias.map((via) => (
            <rect key={`${via.x}-${via.y}`} x={via.x} y={via.y} width="4" height="4" />
          ))}
        </g>

        {blocks.map((block) => {
          const isActive = activeId === block.id;
          const isDimmed = Boolean(activeId) && !isActive;

          return (
            <g
              key={block.id}
              className={`block${isActive ? ' is-active' : ''}${isDimmed ? ' is-dimmed' : ''}`}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              aria-label={`${block.label}. ${isActive ? 'Showing' : 'Show'} related projects.`}
              onClick={() => onSelect(block.id)}
              onKeyDown={(event) => handleKeyDown(event, block.id)}
            >
              <rect
                x={block.x} y={block.y} width={block.w} height={block.h} rx="1.5"
              />
              {/* Labels centre on the block rather than sitting a fixed
                  distance from its top, so a tall block stays balanced. */}
              <text
                className="block-label"
                x={block.x + block.w / 2}
                y={block.y + block.h / 2 - 2}
                textAnchor="middle"
              >
                {block.label}
              </text>
              <text
                className="block-sub"
                x={block.x + block.w / 2}
                y={block.y + block.h / 2 + 11}
                textAnchor="middle"
              >
                {block.sub}
              </text>
            </g>
          );
        })}

        <text className="die-mark" x="32" y="180">
          M. SAMUEL — UofT ECE 2T8 — TORONTO, ON
        </text>
      </svg>

      <figcaption>
        Blocks are areas I&rsquo;ve actually worked in, not a wish list.{' '}
        <span className="hint">Pick one to filter the page.</span>
      </figcaption>
    </figure>
  );
}

// The floorplan re-renders only when the selection changes, not on every
// parent render. Cheap here, but it is the right habit in a tree this size.
export const Floorplan = memo(FloorplanBase);
