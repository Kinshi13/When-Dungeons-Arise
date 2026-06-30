import Notes from "../components/Notes";
import PixelDialogBox from "../components/game/PixelDialogBox";

export default function AdventureDiary() {
  return (
    <div className="page">
      <h1>Diário do Aventureiro</h1>
      <PixelDialogBox speaker="Escriba">
        Registre suas ideias aqui. Uma boa anotação pode virar a próxima missão do mural.
      </PixelDialogBox>
      <Notes />
    </div>
  );
}
