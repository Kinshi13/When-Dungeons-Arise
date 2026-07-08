import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export type QuickActionId =
  | "novo-alarme"
  | "novo-temporizador"
  | "nova-nota"
  | "nova-missao"
  | "novo-gasto"
  | "novo-evento"
  | "importar-livro";

interface QuickActionState {
  quickAction?: QuickActionId;
}

// Navega pra rota certa carregando qual ação disparou a navegação — cada tela
// de destino escuta a própria ação com este hook e decide o que fazer (focar
// um campo, abrir um editor, etc.). Usado pelo Stella Core (ver
// stellaActions.tsx) pra ter efeito real em vez de só trocar de tela.
export function navigateToQuickAction(
  navigate: ReturnType<typeof useNavigate>,
  path: string,
  action: QuickActionId
) {
  navigate(path, { state: { quickAction: action } });
}

// Cada tela de destino chama isso com a própria ação — dispara `onTrigger`
// uma única vez quando o location.state carrega essa ação, e limpa o state
// em seguida (replace) pra não repetir se o usuário voltar pra essa entrada
// do histórico depois.
export function useQuickAction(action: QuickActionId, onTrigger: () => void) {
  const location = useLocation();
  const navigate = useNavigate();
  const firedRef = useRef<unknown>(null);

  useEffect(() => {
    const state = location.state as QuickActionState | null;
    if (state?.quickAction === action && firedRef.current !== location.state) {
      firedRef.current = location.state;
      onTrigger();
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, action]);
}
