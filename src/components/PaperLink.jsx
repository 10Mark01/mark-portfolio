/**
 * A link to a written report attached to a project.
 *
 * The thumbnail is a render of the first page — enough to signal "this is a
 * real document" without the visitor having to download 7 MB to find out.
 */
export function PaperLink({ href, label, meta, thumb, title }) {
  return (
    <a
      className="paper"
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`${label}, opens a PDF in a new tab`}
    >
      {thumb && <img className="paper-thumb" src={thumb} alt="" aria-hidden="true" loading="lazy" />}

      <span className="paper-text">
        <span className="paper-label">
          {label}
          <span className="ext" aria-hidden="true">
            ↗
          </span>
        </span>
        {title && <span className="paper-title">{title}</span>}
        {meta && <span className="paper-meta">{meta}</span>}
      </span>
    </a>
  );
}
