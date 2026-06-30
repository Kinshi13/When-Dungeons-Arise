import type { Mission } from "../../game/missionGenerator";

interface DailyMissionSummaryProps {
  missions: Mission[];
}

export default function DailyMissionSummary({ missions }: DailyMissionSummaryProps) {
  if (missions.length === 0) return null;

  return (
    <div className="daily-mission-summary">
      <h2 className="daily-mission-summary-title">Missões de hoje</h2>
      <ul className="daily-mission-summary-list">
        {missions.map((mission) => (
          <li key={mission.id} className={mission.done ? "done" : undefined}>
            <span>{mission.title}</span>
            <span className="meta">{mission.dueLabel}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
