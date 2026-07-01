import { useState } from "react";
import { Link } from "react-router-dom";
import ThemesScreen from "../components/ThemesScreen";
import { playSfx } from "../sound";
import { pendingSwipeDirection } from "../useSwipeNav";

export default function GuildReception() {
  const [themesOpen, setThemesOpen] = useState(false);

  return (
    <div className="page reception-page">
      <h1 className="sr-only">Recepção da Guilda</h1>

      <Link
        to="/diario/notas"
        className="reception-edge-tap reception-edge-left"
        aria-label="Diário"
        onClick={() => {
          playSfx("coin");
          // Entra deslizando da esquerda — mesmo lado do ícone tocado, e o
          // reverso de como se sai (arrastando pra esquerda) de volta aqui.
          pendingSwipeDirection.current = -1;
        }}
      >
        <img className="reception-edge-icon" src="/icons-nav/icon-diario.png" alt="" />
      </Link>
      <Link
        to="/biblioteca"
        className="reception-edge-tap reception-edge-right"
        aria-label="Biblioteca"
        onClick={() => {
          playSfx("coin");
          pendingSwipeDirection.current = 1;
        }}
      >
        <img className="reception-edge-icon" src="/icons-nav/icon-biblioteca.png" alt="" />
      </Link>

      {/* Balão de fala em branco já desenhado na arte de fundo — o link mora
          dentro dele. */}
      <div className="reception-dialog-bubble">
        <button
          className="reception-dialog-bubble-link"
          onClick={() => {
            playSfx("coin");
            setThemesOpen(true);
          }}
        >
          Temas
        </button>
      </div>

      <ThemesScreen open={themesOpen} onClose={() => setThemesOpen(false)} />
    </div>
  );
}
