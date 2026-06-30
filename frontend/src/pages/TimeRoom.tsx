import Calendar from "./Calendar";
import PixelDialogBox from "../components/game/PixelDialogBox";

export default function TimeRoom() {
  return (
    <div>
      <div className="page" style={{ paddingBottom: 0 }}>
        <h1>Sala do Tempo</h1>
        <PixelDialogBox speaker="Guardião do Tempo">
          Aqui o tempo se curva à sua vontade. Organize seus compromissos no calendário abaixo.
        </PixelDialogBox>
      </div>
      <Calendar />
    </div>
  );
}
