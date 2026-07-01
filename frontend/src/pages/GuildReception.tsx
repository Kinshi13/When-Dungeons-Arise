import { Link } from "react-router-dom";
import { playSfx } from "../sound";
import { BookIcon, DiaryIcon } from "../icons";

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
        <span className="reception-edge-icon">
          <DiaryIcon width={13} height={13} />
        </span>
      </Link>
      <Link
        to="/biblioteca"
        className="reception-edge-tap reception-edge-right"
        aria-label="Biblioteca"
        onClick={() => playSfx("coin")}
      >
        <span className="reception-edge-icon">
          <BookIcon width={13} height={13} />
        </span>
      </Link>
    </div>
  );
}
