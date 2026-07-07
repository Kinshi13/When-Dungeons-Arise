import { Link, useLocation } from "react-router-dom";
import TreasuryOverview from "./TreasuryOverview";
import Finance from "./Finance";
import FinanceAnalysis from "./FinanceAnalysis";
import Bills from "./Bills";
import TreasuryTools from "./TreasuryTools";

type Tab = "visao-geral" | "movimentos" | "contas" | "analises" | "ferramentas";

function tabFromPath(pathname: string): Tab {
  if (pathname.endsWith("/movimentos")) return "movimentos";
  if (pathname.endsWith("/contas")) return "contas";
  if (pathname.endsWith("/analises")) return "analises";
  if (pathname.endsWith("/ferramentas")) return "ferramentas";
  return "visao-geral";
}

export default function Treasury() {
  const location = useLocation();
  const tab = tabFromPath(location.pathname);

  return (
    <div>
      <div className="page" style={{ paddingBottom: 0 }}>
        <div className="drawer-tabs treasury-tabs">
          <Link
            to="/tesouraria/visao-geral"
            className={tab === "visao-geral" ? "drawer-tab active" : "drawer-tab"}
          >
            Visão Geral
          </Link>
          <Link to="/tesouraria/movimentos" className={tab === "movimentos" ? "drawer-tab active" : "drawer-tab"}>
            Movimentos
          </Link>
          <Link to="/tesouraria/contas" className={tab === "contas" ? "drawer-tab active" : "drawer-tab"}>
            Contas
          </Link>
          <Link to="/tesouraria/analises" className={tab === "analises" ? "drawer-tab active" : "drawer-tab"}>
            Análises
          </Link>
          <Link
            to="/tesouraria/ferramentas"
            className={tab === "ferramentas" ? "drawer-tab active" : "drawer-tab"}
          >
            Ferramentas
          </Link>
        </div>
      </div>

      {tab === "visao-geral" && <TreasuryOverview />}
      {tab === "movimentos" && <Finance />}
      {tab === "contas" && <Bills />}
      {tab === "analises" && <FinanceAnalysis />}
      {tab === "ferramentas" && <TreasuryTools />}
    </div>
  );
}
