import PixelRoomButton from "../components/game/PixelRoomButton";
import { BookIcon, DiaryIcon } from "../icons";

export default function GuildReception() {
  return (
    <div className="page reception-page">
      <h1 className="sr-only">Recepção da Guilda</h1>

      <div className="reception-shortcuts">
        <PixelRoomButton to="/diario" label="Diário" icon={<DiaryIcon width={22} height={22} />} />
        <PixelRoomButton to="/biblioteca" label="Biblioteca" icon={<BookIcon width={22} height={22} />} />
      </div>
    </div>
  );
}
