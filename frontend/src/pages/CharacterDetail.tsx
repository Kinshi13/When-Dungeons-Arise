import { useNavigate } from "react-router-dom";
import { useGame } from "../game/GameContext";
import { xpProgressInLevel } from "../game/levels";
import PixelCharacterIdle from "../components/game/PixelCharacterIdle";
import PixelProgressBar from "../components/game/PixelProgressBar";
import { ChevronLeftIcon, CoinIcon } from "../icons";

export default function CharacterDetail() {
  const { xp, coins, level, streak } = useGame();
  const navigate = useNavigate();
  const progress = xpProgressInLevel(xp);

  return (
    <div className="page">
      <div className="reader-fullscreen-header" style={{ margin: "-16px -16px 16px" }}>
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Voltar">
          <ChevronLeftIcon width={18} height={18} />
        </button>
        <strong className="reader-fullscreen-title">Perfil do Aventureiro</strong>
      </div>

      <div className="reception-scene" style={{ justifyContent: "center" }}>
        <PixelCharacterIdle name="Você" size={120} color="var(--accent)" />
      </div>

      <section className="settings-section">
        <h2>Nível {level}</h2>
        <PixelProgressBar percent={progress.percent} label={`${progress.current} / ${progress.needed} XP`} />
      </section>

      <section className="settings-section">
        <h2>Recursos</h2>
        <p className="meta">
          <CoinIcon width={16} height={16} /> {coins} moedas
        </p>
        <p className="meta">Sequência diária: {streak} dia(s)</p>
      </section>

      <section className="settings-section">
        <h2>XP total</h2>
        <p className="meta">{xp} pontos de experiência acumulados</p>
      </section>
    </div>
  );
}
