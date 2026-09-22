import { useCallback, useMemo, useState } from 'react';
import {
  about,
  blocks,
  experience,
  footer,
  offTheClock,
  portrait,
  profile,
  projects,
  teaching,
} from './data/content.js';
import { useTheme } from './hooks/useTheme.js';
import { useActiveSection } from './hooks/useActiveSection.js';
import { renderEmphasis } from './lib/richText.jsx';
import { Masthead } from './components/Masthead.jsx';
import { SectionNav } from './components/SectionNav.jsx';
import { Floorplan } from './components/Floorplan.jsx';
import { Section } from './components/Section.jsx';
import { ExperienceCard } from './components/ExperienceCard.jsx';
import { ProjectCard } from './components/ProjectCard.jsx';
import { ParametersTable } from './components/ParametersTable.jsx';
import { Games } from './components/Games.jsx';

const SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'parameters', label: 'Skills' },
  { id: 'games', label: 'Games' },
  { id: 'contact', label: 'Contact' },
];

const SECTION_IDS = SECTIONS.map((section) => section.id);

/** Pads a count to two digits for the section headers: 3 → "03". */
const pad = (n) => String(n).padStart(2, '0');

export default function App() {
  const { theme, toggle } = useTheme();
  const activeSection = useActiveSection(SECTION_IDS);

  // Which floorplan block is filtering the page. null = show everything.
  const [domain, setDomain] = useState(null);

  // Clicking the active block clears the filter, so one control does both.
  const selectDomain = useCallback(
    (id) => setDomain((current) => (current === id ? null : id)),
    []
  );

  // The floorplan filters both lists — a block is an area of work, not a
  // category of artifact, so it should surface a job as readily as a project.
  const { visibleExperience, visibleProjects } = useMemo(() => {
    if (!domain) {
      return { visibleExperience: experience, visibleProjects: projects };
    }
    return {
      visibleExperience: experience.filter((item) => item.domains.includes(domain)),
      visibleProjects: projects.filter((item) => item.domains.includes(domain)),
    };
  }, [domain]);

  const domainLabel = blocks.find((block) => block.id === domain)?.label;
  const matchCount = visibleExperience.length + visibleProjects.length;

  return (
    <div className="page">
      <a className="skip" href="#about">
        Skip to content
      </a>

      <Masthead theme={theme} onToggleTheme={toggle} />

      <Floorplan activeId={domain} onSelect={selectDomain} />

      <SectionNav sections={SECTIONS} activeId={activeSection} />

      {domain && (
        <div className="filterbar" role="status">
          <span>
            Showing <strong>{domainLabel}</strong> — {matchCount}{' '}
            {matchCount === 1 ? 'entry' : 'entries'}
          </span>
          <button type="button" onClick={() => setDomain(null)}>
            Clear filter
          </button>
        </div>
      )}

      <Section id="about" title="About">
        <div className="about-lede">
          <img
            className="portrait"
            src={portrait.src}
            srcSet={`${portrait.small} ${portrait.width / 2}w, ${portrait.src} ${portrait.width}w`}
            sizes="(max-width: 700px) 140px, 180px"
            width={portrait.width}
            height={portrait.height}
            alt={portrait.alt}
            loading="lazy"
            decoding="async"
          />
          <div className="prose">
            {about.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{renderEmphasis(paragraph)}</p>
            ))}
          </div>
        </div>

        <div className="two" style={{ marginTop: '22px' }}>
          {teaching.map((item) => (
            <div className="note" key={item.label}>
              <p className="eyebrow">{item.label}</p>
              <p>
                <strong>{item.title}</strong> — {item.body}
              </p>
            </div>
          ))}
        </div>

        <div className="prose" style={{ marginTop: '22px' }}>
          <p>{offTheClock.body}</p>
          <ul className="chips">
            {offTheClock.chips.map((chip) => (
              <li key={chip}>{chip}</li>
            ))}
          </ul>
        </div>

        {offTheClock.photo && (
          <figure className="shot">
            <img
              src={offTheClock.photo.src}
              srcSet={`${offTheClock.photo.small} ${offTheClock.photo.width / 2}w, ${offTheClock.photo.src} ${offTheClock.photo.width}w`}
              sizes="(max-width: 860px) 100vw, 860px"
              width={offTheClock.photo.width}
              height={offTheClock.photo.height}
              alt={offTheClock.photo.alt}
              loading="lazy"
              decoding="async"
            />
          </figure>
        )}
      </Section>

      {visibleExperience.length > 0 && (
        <Section id="experience" title="Experience" count={pad(visibleExperience.length)}>
          <div className="exp-list">
            {visibleExperience.map((item) => (
              <ExperienceCard key={item.id} item={item} />
            ))}
          </div>
        </Section>
      )}

      {visibleProjects.length > 0 && (
        <Section id="projects" title="Projects" count={pad(visibleProjects.length)}>
          <div className="projects">
            {visibleProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </Section>
      )}

      <Section id="parameters" title="Skills">
        <ParametersTable />
      </Section>

      <Section id="games" title="Games">
        <Games />
      </Section>

      <footer id="contact">
        <h2>{footer.heading}</h2>
        <p className="lede">{footer.body}</p>
        <nav className="links" aria-label="Contact">
          {profile.links
            .filter((link) => !link.href.endsWith('.pdf'))
            .map((link) => (
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
        <p className="colophon">{footer.colophon}</p>
      </footer>
    </div>
  );
}
