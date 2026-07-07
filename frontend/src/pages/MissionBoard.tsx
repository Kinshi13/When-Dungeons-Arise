import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { tabContentEnter } from "../motion";
import MissionToday from "./MissionToday";
import MissionList from "./MissionList";
import NotificationInbox from "../components/NotificationInbox";

type Tab = "hoje" | "missoes" | "caixa";

function tabFromPath(pathname: string): Tab {
  if (pathname.endsWith("/missoes")) return "missoes";
  if (pathname.endsWith("/caixa")) return "caixa";
  return "hoje";
}

export default function MissionBoard() {
  const location = useLocation();
  const tab = tabFromPath(location.pathname);

  return (
    <div>
      <div className="page" style={{ paddingBottom: 0 }}>
        <h1>Mural</h1>
        <div className="drawer-tabs">
          <Link to="/missoes/hoje" className={tab === "hoje" ? "drawer-tab active" : "drawer-tab"}>
            Hoje
          </Link>
          <Link to="/missoes/missoes" className={tab === "missoes" ? "drawer-tab active" : "drawer-tab"}>
            Missões
          </Link>
          <Link to="/missoes/caixa" className={tab === "caixa" ? "drawer-tab active" : "drawer-tab"}>
            Caixa de Entrada
          </Link>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} {...tabContentEnter}>
          {tab === "hoje" && <MissionToday />}
          {tab === "missoes" && <MissionList />}
          {tab === "caixa" && <NotificationInbox />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
