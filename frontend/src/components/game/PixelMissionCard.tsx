import type { Priority } from "../../api";

export type MissionCategory = "diaria" | "semanal" | "especial";

const CATEGORY_LABEL: Record<MissionCategory, string> = {
  diaria: "Diária",
  semanal: "Semanal",
  especial: "Especial",
};

interface PixelMissionCardProps {
  title: string;
  dueLabel?: string;
  category: MissionCategory;
  priority?: Priority;
  done?: boolean;
  fromNote?: boolean;
  onComplete?: () => void;
}

export default function PixelMissionCard({
  title,
  dueLabel,
  category,
  priority,
  done,
  fromNote,
  onComplete,
}: PixelMissionCardProps) {
  return (
    <div
      className={`mission-card mission-${category}${done ? " mission-done" : ""}`}
      style={fromNote ? { opacity: 0.85 } : undefined}
    >
      <div className="mission-card-top">
        <span className="badge">{CATEGORY_LABEL[category]}</span>
        {priority === "ALTA" && <span className="badge badge-priority">Prioridade</span>}
        {dueLabel && <span className="meta">{dueLabel}</span>}
      </div>
      <strong className="mission-card-title">{title}</strong>
      <div className="mission-card-bottom">
        {!done && onComplete && (
          <button className="icon-btn primary small-btn" onClick={onComplete}>
            Concluir
          </button>
        )}
        {done && <span className="mission-done-label">Concluída</span>}
      </div>
    </div>
  );
}
