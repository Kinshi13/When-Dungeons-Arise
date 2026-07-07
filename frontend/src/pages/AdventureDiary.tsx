import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Notes from "../components/Notes";
import Lists from "../components/Lists";
import PixelDialogBox from "../components/game/PixelDialogBox";
import { api } from "../api";

type Tab = "notas" | "listas";

function tabFromPath(pathname: string): Tab {
  return pathname.endsWith("/listas") ? "listas" : "notas";
}

export default function AdventureDiary() {
  const location = useLocation();
  const tab = tabFromPath(location.pathname);
  const [notaCount, setNotaCount] = useState(0);
  const [listaCount, setListaCount] = useState(0);

  useEffect(() => {
    api.notes.list("NOTA").then((items) => setNotaCount(items.length));
    api.notes.list("LISTA").then((items) => setListaCount(items.length));
  }, [tab]);

  return (
    <div>
      <div className="page" style={{ paddingBottom: 0 }}>
        <h1>Diário do Aventureiro</h1>
        <PixelDialogBox speaker="Escriba">
          {tab === "notas"
            ? `Registre suas ideias aqui. Você tem ${notaCount} nota${notaCount === 1 ? "" : "s"} guardada${notaCount === 1 ? "" : "s"}.`
            : `Organize suas listas de tarefas. Você tem ${listaCount} lista${listaCount === 1 ? "" : "s"} ativa${listaCount === 1 ? "" : "s"}.`}
        </PixelDialogBox>
        <div className="drawer-tabs">
          <Link to="/diario/notas" className={tab === "notas" ? "drawer-tab active" : "drawer-tab"}>
            Notas
          </Link>
          <Link to="/diario/listas" className={tab === "listas" ? "drawer-tab active" : "drawer-tab"}>
            Listas
          </Link>
        </div>
      </div>

      <div className="page">{tab === "notas" ? <Notes /> : <Lists />}</div>
    </div>
  );
}
