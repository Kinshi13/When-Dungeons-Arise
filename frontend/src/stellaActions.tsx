import type { useNavigate } from "react-router-dom";
import type { StellaAction } from "./ui/stella-core/StellaCore";
import { navigateToQuickAction } from "./useQuickAction";
import { BellIcon, HourglassIcon, DiaryIcon, ChecklistIcon, CoinIcon, CalendarIcon, CalculatorIcon, PlusIcon } from "./icons";

// Ações do Stella Core por área — compartilhado entre o shell mobile (App.tsx,
// dock) e o desktop (DesktopApp.tsx, sidebar), pra não duplicar a mesma regra
// em dois lugares. Só as que já têm um destino real (sinal de quickAction ou
// rota existente) hoje. O restante do brief original (nova conta, nova
// assinatura, valor a receber, nova reunião, planejar semana, nova anotação,
// continuar leitura, buscar) ainda não tem funcionalidade própria no app;
// entram junto com o conteúdo de cada área nas fases seguintes
// (Tempo/Tesouraria/Biblioteca), não como botões sem efeito.
type Navigate = ReturnType<typeof useNavigate>;

// Ações que aparecem em mais de uma área (com prioridade própria em cada
// uma) — extraídas pra não duplicar id/label/icon/execute em cada seção.
function novaMissaoAction(navigate: Navigate, priority: number): StellaAction {
  return {
    id: "nova-missao",
    label: "Nova tarefa",
    icon: <ChecklistIcon width={20} height={20} />,
    priority,
    execute: () => navigateToQuickAction(navigate, "/sala-do-tempo/tarefas/missoes", "nova-missao"),
  };
}

function novoEventoAction(navigate: Navigate, priority: number): StellaAction {
  return {
    id: "novo-evento",
    label: "Novo evento",
    icon: <CalendarIcon width={20} height={20} />,
    priority,
    execute: () => navigateToQuickAction(navigate, "/sala-do-tempo/calendario", "novo-evento"),
  };
}

function novoGastoAction(navigate: Navigate, priority: number): StellaAction {
  return {
    id: "novo-gasto",
    label: "Novo gasto",
    icon: <CoinIcon width={20} height={20} />,
    priority,
    execute: () => navigateToQuickAction(navigate, "/tesouraria/movimentos", "novo-gasto"),
  };
}

export function buildStellaActions(section: string | null, navigate: Navigate): StellaAction[] {
  if (section === "tempo") {
    return [
      novaMissaoAction(navigate, 3),
      novoEventoAction(navigate, 2),
      {
        id: "ir-hoje",
        label: "Ir para hoje",
        icon: <HourglassIcon width={20} height={20} />,
        priority: 1,
        execute: () => navigate("/sala-do-tempo/tarefas/hoje"),
      },
    ];
  }
  if (section === "tesouraria") {
    return [
      novoGastoAction(navigate, 2),
      {
        id: "calculadora",
        label: "Calculadora",
        icon: <CalculatorIcon width={20} height={20} />,
        priority: 1,
        execute: () => navigate("/tesouraria/ferramentas"),
      },
    ];
  }
  if (section === "biblioteca") {
    return [
      {
        id: "importar-livro",
        label: "Importar",
        icon: <PlusIcon width={20} height={20} />,
        priority: 1,
        execute: () => navigateToQuickAction(navigate, "/biblioteca", "importar-livro"),
      },
    ];
  }
  // Recepção (default) — hub com acesso rápido a todas as áreas.
  return [
    {
      id: "novo-alarme",
      label: "Novo alarme",
      icon: <BellIcon width={20} height={20} />,
      priority: 5,
      execute: () => navigateToQuickAction(navigate, "/", "novo-alarme"),
    },
    {
      id: "novo-temporizador",
      label: "Temporizador",
      icon: <HourglassIcon width={20} height={20} />,
      priority: 4,
      execute: () => navigateToQuickAction(navigate, "/", "novo-temporizador"),
    },
    {
      id: "nova-nota",
      label: "Nova nota",
      icon: <DiaryIcon width={20} height={20} />,
      priority: 3,
      execute: () => navigateToQuickAction(navigate, "/sala-do-tempo/diario/notas", "nova-nota"),
    },
    novaMissaoAction(navigate, 2),
    novoGastoAction(navigate, 1),
    novoEventoAction(navigate, 0),
  ];
}
