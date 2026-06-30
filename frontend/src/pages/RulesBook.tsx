import Settings from "./Settings";
import PixelDialogBox from "../components/game/PixelDialogBox";

export default function RulesBook() {
  return (
    <div>
      <div className="page" style={{ paddingBottom: 0 }}>
        <h1>Livro de Regras</h1>
        <PixelDialogBox speaker="Mestre da Guilda">
          Ajuste o som, o tamanho da interface e as notificações da guilda aqui.
        </PixelDialogBox>
      </div>
      <Settings />
    </div>
  );
}
