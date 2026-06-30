interface PixelProgressBarProps {
  percent: number;
  color?: string;
  label?: string;
}

export default function PixelProgressBar({ percent, color = "var(--accent)", label }: PixelProgressBarProps) {
  return (
    <div className="pixel-progress">
      {label && <span className="pixel-progress-label">{label}</span>}
      <div className="pixel-progress-track">
        <div
          className="pixel-progress-fill"
          style={{ width: `${Math.max(0, Math.min(100, percent))}%`, background: color }}
        />
      </div>
    </div>
  );
}
