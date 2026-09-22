/**
 * Renders **bold** spans inside a plain string.
 *
 * Deliberately not a markdown library: the content file needs exactly one
 * inline style, and pulling in a parser plus its sanitiser to get it would be
 * more dependency than the feature is worth.
 *
 * Splitting on a capturing group keeps the delimiters in the output array, so
 * the marked runs land on odd indices and everything else passes through as
 * plain text — no dangerouslySetInnerHTML, so nothing in the content file can
 * inject markup.
 *
 * @param {string} text
 * @returns {Array<string|JSX.Element>}
 */
export function renderEmphasis(text) {
  return text.split(/\*\*(.+?)\*\*/g).map((chunk, index) =>
    index % 2 === 1 ? <strong key={index}>{chunk}</strong> : chunk
  );
}
