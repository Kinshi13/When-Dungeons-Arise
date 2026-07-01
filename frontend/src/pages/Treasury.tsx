import { Link, useLocation } from "react-router-dom";
import Finance from "./Finance";
import FinanceAnalysis from "./FinanceAnalysis";
import Bills from "./Bills";
import Calculator from "../components/Calculator";
import PercentageCalculator from "../components/PercentageCalculator";

type Tab = "financas" | "contas" | "analises" | "calculadora" | "porcentagem";

function tabFromPath(pathname: string): Tab {
  if (pathname.endsWith("/contas")) return "contas";
  if (pathname.endsWith("/analises")) return "analises";
  if (pathname.endsWith("/calculadora")) return "calculadora";
  if (pathname.endsWith("/porcentagem")) return "porcentagem";
  return "financas";
}

interface TreasuryProps {
  // Usado só pela prévia de conteúdo durante o arraste (App.tsx): força qual
  // sub-aba mostrar sem depender da rota real do navegador.
  forcedPath?: string;
}

export default function Treasury({ forcedPath }: TreasuryProps = {}) {
  const location = useLocation();
  const tab = tabFromPath(forcedPath ?? location.pathname);

  return (
    <div>
      <div className="page" style={{ paddingBottom: 0 }}>
        <h1>Tesouraria</h1>
        <div className="drawer-tabs treasury-tabs">
          <Link to="/tesouraria/financas" className={tab === "financas" ? "drawer-tab active" : "drawer-tab"}>
            Finanças
          </Link>
          <Link to="/tesouraria/contas" className={tab === "contas" ? "drawer-tab active" : "drawer-tab"}>
            Contas
          </Link>
          <Link to="/tesouraria/analises" className={tab === "analises" ? "drawer-tab active" : "drawer-tab"}>
            Análises
          </Link>
          <Link
            to="/tesouraria/calculadora"
            className={tab === "calculadora" ? "drawer-tab active" : "drawer-tab"}
          >
            Calculadora
          </Link>
          <Link
            to="/tesouraria/porcentagem"
            className={tab === "porcentagem" ? "drawer-tab active" : "drawer-tab"}
            aria-label="Porcentagem"
          >
            %
          </Link>
        </div>
      </div>

      {tab === "financas" && <Finance />}
      {tab === "contas" && <Bills />}
      {tab === "analises" && <FinanceAnalysis />}
      {tab === "calculadora" && (
        <div className="page">
          <Calculator />
        </div>
      )}
      {tab === "porcentagem" && (
        <div className="page">
          <PercentageCalculator />
        </div>
      )}
    </div>
  );
}
