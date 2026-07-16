import './PlaceholderToast.css';

/** Tiny transient notice for Stella Core action placeholders — no real behavior exists yet. */
export function PlaceholderToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="placeholder-toast" role="status">
      {message} — em breve
    </div>
  );
}
