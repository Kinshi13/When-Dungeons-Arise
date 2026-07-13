import './StellaConstellationDivider.css';

export function StellaConstellationDivider() {
  return (
    <svg
      className="stella-constellation-divider"
      viewBox="0 0 320 20"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M0 10 L120 6 L160 14 L200 6 L320 10" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.35" />
      <circle cx="120" cy="6" r="1.8" fill="currentColor" />
      <circle cx="160" cy="14" r="2.4" fill="currentColor" />
      <circle cx="200" cy="6" r="1.8" fill="currentColor" />
    </svg>
  );
}
