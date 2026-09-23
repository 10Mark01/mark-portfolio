import { Slideshow } from './Slideshow.jsx';
import { PhysicsSim } from './PhysicsSim.jsx';
import { VideoDemo } from './VideoDemo.jsx';
import { PaperLink } from './PaperLink.jsx';
import { renderEmphasis } from '../lib/richText.jsx';

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
 * points at a runnable build and takes precedence over both. `video` is
 * independent — a demo clip renders above any of them, and `doc` attaches a
 * written report below the body.
 */
export function ProjectCard({ project }) {
  const {
    tag, date, title, result, body, stack, href, image, slides, sim, video, doc, todo,
  } = project;

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

        {video && (
          <VideoDemo
            src={video.src}
            webm={video.webm}
            poster={video.poster}
            caption={video.caption}
            label={title}
          />
        )}

        {sim ? (
          <PhysicsSim base={sim} />
        ) : slides?.length > 0 ? (
          <Slideshow slides={slides} label={title} />
        ) : (
          image && (
            <img
              className="proj-image"
              src={image}
              alt={`${title}, project photo`}
              loading="lazy"
              decoding="async"
            />
          )
        )}

        <p className="detail">{renderEmphasis(body)}</p>

        {doc && (
          <PaperLink
            href={doc.href}
            thumb={doc.thumb}
            label={doc.label}
            title={doc.title}
            meta={doc.meta}
          />
        )}

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
