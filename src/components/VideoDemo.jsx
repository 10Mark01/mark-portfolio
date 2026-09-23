/**
 * A demo recording on a project card.
 *
 * `preload="none"` matters here: without it the browser starts pulling the
 * file as soon as the page loads, which is a lot of bandwidth spent on
 * someone who is only scrolling past. The poster frame carries the card
 * until they press play.
 */
export function VideoDemo({ src, webm, poster, caption, label }) {
  return (
    <figure className="clip">
      <video
        className="clip-video"
        controls
        preload="none"
        playsInline
        poster={poster}
        aria-label={label ? `${label}, demo recording` : 'Demo recording'}
      >
        {webm && <source src={webm} type="video/webm" />}
        <source src={src} type="video/mp4" />
        Your browser can’t play this video.{' '}
        <a href={src} download>
          Download it instead
        </a>
        .
      </video>

      {caption && <figcaption className="clip-bar">{caption}</figcaption>}
    </figure>
  );
}
