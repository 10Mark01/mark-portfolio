import { profile } from '../data/content.js';
import { ThemeToggle } from './ThemeToggle.jsx';

export function Masthead({ theme, onToggleTheme }) {
  return (
    <header className="mast">
      <div className="mast-top">
        <p className="eyebrow">
          {profile.eyebrow.map((part, index) => (
            <span key={part}>
              {index > 0 && <span className="sep" aria-hidden="true">/</span>}
              {part}
            </span>
          ))}
        </p>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <h1>{profile.name}</h1>
      <p className="lede">{profile.lede}</p>

      {profile.credentials?.length > 0 && (
        <p className="creds">
          {profile.credentials.map((item, index) => (
            <span key={item}>
              {index > 0 && <span className="sep" aria-hidden="true">·</span>}
              {item}
            </span>
          ))}
        </p>
      )}

      <dl className="spec">
        {profile.spec.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd className={item.highlight ? 'live' : undefined}>{item.value}</dd>
          </div>
        ))}
      </dl>

      <nav className="links" aria-label="Contact">
        {profile.links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className={link.todo ? 'is-todo' : undefined}
            {...(link.href.startsWith('http')
              ? { target: '_blank', rel: 'noreferrer noopener' }
              : {})}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
