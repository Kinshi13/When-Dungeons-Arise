import { useState } from "react";
import Finance from "./Finance";
import Bills from "./Bills";
import Calculator from "../components/Calculator";
import PixelDialogBox from "../components/game/PixelDialogBox";

type Tab = "financas" | "contas" | "calculadora";

export default function Treasury() {
  const [tab, setTab] = useState<Tab>("financas");

  return (
    <div>
      <div className="page" style={{ paddingBottom: 0 }}>
        <h1>Tesouraria</h1>
        <PixelDialogBox speaker="Tesoureira">
          Registre seus gastos, mantenha as contas em dia e use a calculadora quando precisar.
        </PixelDialogBox>
        <div className="drawer-tabs treasury-tabs">
          <button className={tab === "financas" ? "drawer-tab active" : "drawer-tab"} onClick={() => setTab("financas")}>
            Finanças
          </button>
          <button className={tab === "contas" ? "drawer-tab active" : "drawer-tab"} onClick={() => setTab("contas")}>
            Contas
          </button>
          <button
            className={tab === "calculadora" ? "drawer-tab active" : "drawer-tab"}
            onClick={() => setTab("calculadora")}
          >
            Calculadora
          </button>
        </div>
      </div>

      {tab === "financas" && <Finance />}
      {tab === "contas" && <Bills />}
      {tab === "calculadora" && (
        <div className="page">
          <Calculator />
        </div>
      )}
    </div>
  );
}
