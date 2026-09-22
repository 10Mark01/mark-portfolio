/**
 * Sticky section nav. The active item comes from useActiveSection, which
 * watches the sections rather than the scroll position.
 */
export function SectionNav({ sections, activeId }) {
  return (
    <nav className="secnav" aria-label="Sections">
      <ul>
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={activeId === section.id ? 'is-active' : undefined}
              aria-current={activeId === section.id ? 'true' : undefined}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
