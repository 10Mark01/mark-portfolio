import { Slideshow } from './Slideshow.jsx';
import { PhysicsSim } from './PhysicsSim.jsx';

/**
 * One project entry.
 *
 * `image` is optional. A card with no photo reads fine; a card with a bad
 * photo does not, so the field stays null until there is something worth
 * showing. `todo` renders the entry in placeholder styling — delete the flag
 * in content.js once an entry is real.
 *
 * `slides` is optional too — give a project an array of `{ src, caption }`
 * and the card renders a deck viewer in place of the single image. `sim`
 * points at a runnable build and takes precedence over both.
 */
export function ProjectCard({ project }) {
  const { tag, date, title, result, body, stack, href, image, slides, sim, todo } = project;

  return (
    <article className={`proj${todo ? ' is-todo' : ''}`}>
      <div className="proj-rail">
        <span className="tag">{tag}</span>
        {date && <span className="proj-date">{date}</span>}
      </div>

      <div className="proj-body">
        <h3>
          {href ? (
            <a href={href} target="_blank" rel="noreferrer noopener">
              {title}
              <span className="ext" aria-hidden="true">
                ↗
              </span>
            </a>
          ) : (
            title
          )}
        </h3>

        <p className="result">{result}</p>

        {sim ? (
          <PhysicsSim base={sim} />
        ) : slides?.length > 0 ? (
          <Slideshow slides={slides} label={title} />
        ) : (
          image && (
            <img
              className="proj-image"
              src={image}
              alt={`${title} — project photo`}
              loading="lazy"
              decoding="async"
            />
          )
        )}

        <p className="detail">{body}</p>

        {stack?.length > 0 && (
          <ul className="stack">
            {stack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
