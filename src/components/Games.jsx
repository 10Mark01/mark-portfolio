import { useState } from 'react';
import { games } from '../data/content.js';
import { GateGame } from './GateGame.jsx';
import { BitDrill } from './BitDrill.jsx';
import { SnakeVGA } from './SnakeVGA.jsx';

/* Keyed by the ids in content.js `games`. Only the selected game mounts, so
   Snake's rAF loop and the drill's timer never run in the background. */
const PANELS = {
  gates: GateGame,
  bits: BitDrill,
  snake: SnakeVGA,
};

export function Games() {
  const [activeId, setActiveId] = useState(games[0].id);
  const active = games.find((g) => g.id === activeId) ?? games[0];
  const Panel = PANELS[active.id];

  return (
    <div className="games">
      <div className="games-tabs" role="tablist" aria-label="Mini games">
        {games.map((game) => (
          <button
            key={game.id}
            type="button"
            role="tab"
            id={`tab-${game.id}`}
            aria-selected={game.id === activeId}
            aria-controls={`panel-${game.id}`}
            className={game.id === activeId ? 'games-tab is-current' : 'games-tab'}
            onClick={() => setActiveId(game.id)}
          >
            {game.name}
          </button>
        ))}
      </div>

      <div
        className="games-panel"
        role="tabpanel"
        id={`panel-${active.id}`}
        aria-labelledby={`tab-${active.id}`}
      >
        <p className="games-blurb">{active.blurb}</p>
        {Panel ? <Panel /> : null}
      </div>
    </div>
  );
}
