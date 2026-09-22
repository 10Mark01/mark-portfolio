import { useEffect, useState } from 'react';

/**
 * Reports which section is currently the reader's focus, for the nav.
 *
 * IntersectionObserver rather than a scroll listener: the browser does the
 * geometry off the main thread and only calls back when a threshold is
 * actually crossed, so this costs nothing while the page sits still.
 *
 * rootMargin pulls the detection band into a strip near the top of the
 * viewport. Without it, a tall section and a short one both "intersect" at
 * once and the nav flickers between them as you scroll.
 *
 * @param {string[]} ids - section element ids, in document order
 * @returns {string} the id of the section currently in the band
 */
export function useActiveSection(ids) {
  const [activeId, setActiveId] = useState(ids[0] ?? '');

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Several sections can cross the band in one callback. Take the one
        // nearest the top of the document among those currently visible.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-72px 0px -65% 0px', threshold: 0 }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}
