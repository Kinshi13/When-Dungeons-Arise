import { Link, useLocation } from "react-router-dom";
import Finance from "./Finance";
import Bills from "./Bills";
import Calculator from "../components/Calculator";
import PixelDialogBox from "../components/game/PixelDialogBox";

type Tab = "financas" | "contas" | "calculadora";

function tabFromPath(pathname: string): Tab {
  if (pathname.endsWith("/contas")) return "contas";
  if (pathname.endsWith("/calculadora")) return "calculadora";
  return "financas";
}

export default function Treasury() {
  const location = useLocation();
  const tab = tabFromPath(location.pathname);

  return (
    <div>
      <div className="page" style={{ paddingBottom: 0 }}>
        <h1>Tesouraria</h1>
        <PixelDialogBox speaker="Tesoureira">
          Registre seus gastos, mantenha as contas em dia e use a calculadora quando precisar.
        </PixelDialogBox>
        <div className="drawer-tabs treasury-tabs">
          <Link to="/tesouraria/financas" className={tab === "financas" ? "drawer-tab active" : "drawer-tab"}>
            Finanças
          </Link>
          <Link to="/tesouraria/contas" className={tab === "contas" ? "drawer-tab active" : "drawer-tab"}>
            Contas
          </Link>
          <Link
            to="/tesouraria/calculadora"
            className={tab === "calculadora" ? "drawer-tab active" : "drawer-tab"}
          >
            Calculadora
          </Link>
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
