import './StellaEmptyState.css';

export function StellaEmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="stella-empty-state">
      <svg
        className="stella-empty-state__glyph"
        width="56"
        height="24"
        viewBox="0 0 56 24"
        aria-hidden="true"
      >
        <path d="M6 18 L26 8 L50 6" stroke="currentColor" strokeWidth="1" opacity="0.4" fill="none" />
        <circle cx="6" cy="18" r="2" fill="currentColor" />
        <circle cx="26" cy="8" r="2.5" fill="currentColor" />
        <circle cx="50" cy="6" r="1.6" fill="currentColor" />
      </svg>
      <p className="stella-empty-state__title">{title}</p>
      <p className="stella-empty-state__message">{message}</p>
    </div>
  );
}
