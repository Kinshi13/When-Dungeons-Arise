import './EmptyState.css';

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state__glyph" aria-hidden="true">
        ✦
      </div>
      <p className="empty-state__title">{title}</p>
      <p className="empty-state__message">{message}</p>
    </div>
  );
}
