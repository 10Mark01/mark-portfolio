export function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-pressed={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
        {isDark ? (
          // Moon: a filled disc with a second disc punched out of it, so the
          // crescent takes the button's colour rather than needing a fill of
          // its own that would have to be themed separately.
          <path
            d="M13.2 10.4A5.6 5.6 0 0 1 5.6 2.8a5.6 5.6 0 1 0 7.6 7.6z"
            fill="currentColor"
          />
        ) : (
          <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <circle cx="8" cy="8" r="3.1" fill="none" />
            <path d="M8 1.2v1.6M8 13.2v1.6M1.2 8h1.6M13.2 8h1.6M3.2 3.2l1.1 1.1M11.7 11.7l1.1 1.1M12.8 3.2l-1.1 1.1M4.3 11.7l-1.1 1.1" />
          </g>
        )}
      </svg>
    </button>
  );
}
