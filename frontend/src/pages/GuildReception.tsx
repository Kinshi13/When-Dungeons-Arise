import { Link } from "react-router-dom";
import { playSfx } from "../sound";

export default function GuildReception() {
  return (
    <div className="page reception-page">
      <h1 className="sr-only">Recepção da Guilda</h1>

      <Link
        to="/diario"
        className="reception-edge-tap reception-edge-left"
        aria-label="Diário"
        onClick={() => playSfx("coin")}
      >
        <img className="reception-edge-icon" src="/icons-nav/icon-diario.png" alt="" />
      </Link>
      <Link
        to="/biblioteca"
        className="reception-edge-tap reception-edge-right"
        aria-label="Biblioteca"
        onClick={() => playSfx("coin")}
      >
        <img className="reception-edge-icon" src="/icons-nav/icon-biblioteca.png" alt="" />
      </Link>
    </div>
  );
}
