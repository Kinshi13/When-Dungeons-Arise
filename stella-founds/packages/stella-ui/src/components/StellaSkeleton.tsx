import './StellaSkeleton.css';

/**
 * A single shimmer block — pages compose these into skeleton layouts that
 * mirror their real content's shape (see DashboardPage/BillsPage/
 * SummaryPanel for usage). Deliberately has no built-in "skeleton for X"
 * variants: one primitive, arranged per-screen, stays truthful to each
 * screen's actual layout instead of a generic placeholder.
 */
export function StellaSkeleton({
  width = '100%',
  height = 16,
  radius,
  className = '',
}: {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
}) {
  return (
    <span
      className={`stella-skeleton ${className}`.trim()}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}
