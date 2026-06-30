import { CoinIcon } from "../../icons";

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
  rewardXp: number;
  rewardCoins: number;
  done?: boolean;
  onComplete?: () => void;
}

export default function PixelMissionCard({
  title,
  dueLabel,
  category,
  rewardXp,
  rewardCoins,
  done,
  onComplete,
}: PixelMissionCardProps) {
  return (
    <div className={`mission-card mission-${category}${done ? " mission-done" : ""}`}>
      <div className="mission-card-top">
        <span className="badge">{CATEGORY_LABEL[category]}</span>
        {dueLabel && <span className="meta">{dueLabel}</span>}
      </div>
      <strong className="mission-card-title">{title}</strong>
      <div className="mission-card-bottom">
        <div className="mission-card-reward">
          <span className="reward-chip">+{rewardXp} XP</span>
          {rewardCoins > 0 && (
            <span className="reward-chip">
              <CoinIcon width={12} height={12} /> +{rewardCoins}
            </span>
          )}
        </div>
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
