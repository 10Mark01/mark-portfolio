/**
 * Section shell: anchor id, heading, optional right-hand count.
 * Keeps the rule-and-heading pattern in one place so every section lines up.
 */
export function Section({ id, title, count, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`}>
      <div className="sec-head">
        <h2 id={`${id}-heading`}>{title}</h2>
        <span className="rule" aria-hidden="true" />
        {count != null && <span className="count">{count}</span>}
      </div>
      {children}
    </section>
  );
}
