import { useEffect, useRef } from "react";

// Pilha (LIFO) de "o que fechar se o usuário apertar Voltar agora" — cada
// overlay aberto (gaveta/sheet/popup/menu) empilha sua própria função de
// fechar enquanto estiver aberto. Aninhamento (ex.: WallpaperSettingsScreen
// dentro de ThemesScreen) funciona sozinho: quem abriu por último empilha por
// último, então é o primeiro a fechar — sem precisar de nenhuma prioridade
// explícita por componente.
const stack: (() => void)[] = [];

// Chamado pelo listener global do botão físico Voltar (ver App.tsx). Fecha só
// o overlay mais recente; devolve se consumiu o toque (pra quem chamou saber
// que NÃO deve navegar de rota/sair do app dessa vez).
export function consumeBackPress(): boolean {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top();
  return true;
}

// Cada overlay chama isso com seu próprio `open`/`onClose` (ou equivalente,
// tipo `!!note`). Enquanto `active` for true, sua função de fechar fica no
// topo da pilha; ao fechar (ou desmontar) ela sai de novo. Usa ref pro
// `onClose` pra não reempilhar a cada render — só quando `active` muda de
// verdade (esses componentes quase sempre passam uma arrow function nova a
// cada render como onClose).
export function useOverlayBackClose(active: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active) return;
    const close = () => onCloseRef.current();
    stack.push(close);
    return () => {
      const i = stack.indexOf(close);
      if (i !== -1) stack.splice(i, 1);
    };
  }, [active]);
}
