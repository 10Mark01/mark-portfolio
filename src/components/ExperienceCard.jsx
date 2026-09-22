/**
 * One role. Heavier than a project card on purpose — for an intern applying
 * to hardware teams, the work history is the strongest evidence on the page,
 * so it gets the wider measure and the bullets rather than a summary.
 */
export function ExperienceCard({ item }) {
  const { role, team, org, location, period, bullets, stack, logo } = item;

  return (
    <article className="exp">
      <header className="exp-head">
        <div className="exp-id">
          {logo && (
            <span className="exp-logo">
              <img src={logo.src} alt={logo.alt} loading="lazy" decoding="async" />
            </span>
          )}
          <div>
            <h3>
              {role}
              {team && <span className="exp-team"> · {team}</span>}
            </h3>
            <p className="exp-org">
              <strong>{org}</strong>
              <span className="exp-loc"> — {location}</span>
            </p>
          </div>
        </div>
        <p className="exp-period">{period}</p>
      </header>

      <ul className="exp-bullets">
        {bullets.map((bullet) => (
          <li key={bullet.slice(0, 40)}>{bullet}</li>
        ))}
      </ul>

      {stack?.length > 0 && (
        <ul className="stack">
          {stack.map((tool) => (
            <li key={tool}>{tool}</li>
          ))}
        </ul>
      )}
    </article>
  );
}
