import { useState } from "react";
import Calculator from "../components/Calculator";
import PercentageCalculator from "../components/PercentageCalculator";

type Mode = "calculadora" | "porcentagem";

// Calculadora e Porcentagem juntas — as duas já eram componentes sem prop
// nenhuma (sem estado/rota própria), então cabem bem sob um alternador só.
export default function TreasuryTools() {
  const [mode, setMode] = useState<Mode>("calculadora");

  return (
    <div className="page">
      <h1>Ferramentas</h1>
      <div className="filters">
        <button className={mode === "calculadora" ? "filter active" : "filter"} onClick={() => setMode("calculadora")}>
          Calculadora
        </button>
        <button className={mode === "porcentagem" ? "filter active" : "filter"} onClick={() => setMode("porcentagem")}>
          Porcentagem
        </button>
      </div>

      {mode === "calculadora" ? <Calculator /> : <PercentageCalculator />}
    </div>
  );
}
