import { useNavigate } from "react-router-dom";
import { useGame } from "../../game/GameContext";
import { xpProgressInLevel } from "../../game/levels";
import { CoinIcon } from "../../icons";

export default function GameTopBar() {
  const { xp, coins, level, streak } = useGame();
  const navigate = useNavigate();
  const progress = xpProgressInLevel(xp);

  return (
    <button className="game-top-bar" onClick={() => navigate("/perfil")} aria-label="Ver perfil do aventureiro">
      <div className="game-top-bar-level">Nv. {level}</div>
      <div className="game-top-bar-xp">
        <div className="pixel-progress-track small">
          <div className="pixel-progress-fill" style={{ width: `${progress.percent}%` }} />
        </div>
      </div>
      <div className="game-top-bar-coins">
        <CoinIcon width={16} height={16} />
        <span>{coins}</span>
      </div>
      {streak > 0 && <div className="game-top-bar-streak">Sequência {streak}</div>}
    </button>
  );
}
