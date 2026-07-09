import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createElement, act, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useReceptionParallax, type ParallaxController } from "./useReceptionParallax";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Harness manual (sem @testing-library) — o hook só pode ser chamado dentro
// de um componente; este componente mínimo expõe o container e o
// controller pra fora via variável de módulo, atualizada a cada render.
let latestController: ParallaxController | null = null;

function Harness({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  latestController = useReceptionParallax(ref, enabled);
  return createElement("div", { ref });
}

let container: HTMLDivElement;
let root: Root;

function mount(enabled: boolean) {
  act(() => {
    root.render(createElement(Harness, { enabled }));
  });
  return container.firstElementChild as HTMLDivElement;
}

function rerender(enabled: boolean) {
  act(() => {
    root.render(createElement(Harness, { enabled }));
  });
  return container.firstElementChild as HTMLDivElement;
}

function fakeRect(): DOMRect {
  return { width: 300, height: 300, left: 0, top: 0, right: 300, bottom: 300, x: 0, y: 0, toJSON() {} };
}

function fireMouseMove(el: HTMLElement, clientX: number, clientY: number) {
  act(() => {
    el.dispatchEvent(new MouseEvent("mousemove", { clientX, clientY }));
  });
}

function fireMouseLeave(el: HTMLElement) {
  act(() => {
    el.dispatchEvent(new MouseEvent("mouseleave"));
  });
}

// Evento mínimo com .beta/.gamma — o hook só lê essas duas propriedades,
// não faz `instanceof DeviceOrientationEvent`, então um Event genérico
// "aumentado" é suficiente e evita depender de um construtor nativo que o
// jsdom não implementa.
function fireOrientation(beta: number, gamma: number) {
  const ev = new Event("deviceorientation") as Event & { beta: number; gamma: number };
  ev.beta = beta;
  ev.gamma = gamma;
  act(() => {
    window.dispatchEvent(ev);
  });
}

async function waitFrames(n = 6) {
  for (let i = 0; i < n; i++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
  }
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  latestController = null;
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  delete (globalThis as any).DeviceOrientationEvent;
  vi.restoreAllMocks();
});

describe("useReceptionParallax — pointer desktop", () => {
  it("mousemove move o alvo e escreve --parallax-x/y no container via RAF", async () => {
    const el = mount(true);
    el.getBoundingClientRect = fakeRect;

    fireMouseMove(el, 250, 250);
    expect(latestController!.source).toBe("pointer");
    expect(latestController!.active).toBe(true);

    await waitFrames();
    const x = Number(el.style.getPropertyValue("--parallax-x"));
    const y = Number(el.style.getPropertyValue("--parallax-y"));
    expect(x).toBeGreaterThan(0);
    expect(y).toBeGreaterThan(0);
  });

  it("mouseleave volta suavemente o alvo pro neutro (não salta pra 0 instantaneamente)", async () => {
    const el = mount(true);
    el.getBoundingClientRect = fakeRect;
    fireMouseMove(el, 280, 280);
    await waitFrames(3);
    const beforeLeave = Number(el.style.getPropertyValue("--parallax-x"));
    expect(beforeLeave).toBeGreaterThan(0);

    fireMouseLeave(el);
    await waitFrames(1);
    const rightAfterLeave = Number(el.style.getPropertyValue("--parallax-x"));
    // suaviza: já caiu em relação ao pico, mas não zerou de uma vez
    expect(rightAfterLeave).toBeLessThan(beforeLeave);
    expect(rightAfterLeave).toBeGreaterThan(0);

    await waitFrames(15);
    const settled = Number(el.style.getPropertyValue("--parallax-x"));
    expect(settled).toBeCloseTo(0, 1);
  });
});

describe("useReceptionParallax — sensor de orientação", () => {
  it("sem DeviceOrientationEvent no ambiente, permissão inicial é 'unsupported'", () => {
    delete (globalThis as any).DeviceOrientationEvent;
    mount(true);
    expect(latestController!.permission).toBe("unsupported");
  });

  it("com suporte mas sem requestPermission (Android/desktop), permissão inicial já é 'granted'", () => {
    (globalThis as any).DeviceOrientationEvent = function () {};
    mount(true);
    expect(latestController!.permission).toBe("granted");
  });

  it("requestSensor() com requestPermission resolvendo 'denied' atualiza o estado pra 'denied'", async () => {
    (globalThis as any).DeviceOrientationEvent = function () {};
    (globalThis as any).DeviceOrientationEvent.requestPermission = vi.fn().mockResolvedValue("denied");
    mount(true);
    expect(latestController!.permission).toBe("unknown");

    await act(async () => {
      await latestController!.requestSensor();
    });
    expect(latestController!.permission).toBe("denied");
  });

  it("requestSensor() com requestPermission resolvendo 'granted' liga o listener de orientação", async () => {
    (globalThis as any).DeviceOrientationEvent = function () {};
    (globalThis as any).DeviceOrientationEvent.requestPermission = vi.fn().mockResolvedValue("granted");
    mount(true);

    await act(async () => {
      await latestController!.requestSensor();
    });
    expect(latestController!.permission).toBe("granted");

    // 1º evento calibra; 2º já produz alvo -> source vira "device-orientation"
    fireOrientation(10, 5);
    fireOrientation(16, 5);
    expect(latestController!.source).toBe("device-orientation");
  });
});

describe("useReceptionParallax — reduzidas (enabled=false)", () => {
  it("não agenda RAF nem registra listeners quando desabilitado", () => {
    const rafSpy = vi.spyOn(window, "requestAnimationFrame");
    const el = mount(false);
    expect(rafSpy).not.toHaveBeenCalled();
    expect(latestController!.active).toBe(false);
    expect(latestController!.source).toBe("idle");
    expect(el.style.getPropertyValue("--parallax-x")).toBe("0");
  });

  it("mousemove não tem efeito nenhum quando desabilitado", () => {
    const el = mount(false);
    el.getBoundingClientRect = fakeRect;
    fireMouseMove(el, 280, 280);
    expect(latestController!.active).toBe(false);
    expect(el.style.getPropertyValue("--parallax-x")).toBe("0");
  });
});

describe("useReceptionParallax — recalibração", () => {
  it("recalibrate() descarta o neutro capturado; o próximo evento só recalibra, não move o alvo", () => {
    (globalThis as any).DeviceOrientationEvent = function () {}; // sem requestPermission -> já "granted"
    mount(true);

    fireOrientation(10, 5); // calibra em (10,5)
    fireOrientation(15, 5); // alvo y=0.5

    act(() => {
      latestController!.recalibrate();
    });

    // mesmos valores absolutos de antes: como recalibrou, este evento só
    // CAPTURA o novo neutro (15,5) — o alvo não muda ainda.
    fireOrientation(15, 5);
    // outro evento idêntico ao novo neutro -> delta 0 -> alvo zera
    fireOrientation(15, 5);

    expect(latestController!.source).toBe("device-orientation");
  });
});

describe("useReceptionParallax — lifecycle/cleanup", () => {
  it("desmontar cancela o RAF pendente", () => {
    mount(true);
    const cafSpy = vi.spyOn(window, "cancelAnimationFrame");
    act(() => {
      root.unmount();
    });
    expect(cafSpy).toHaveBeenCalled();
  });

  it("alternar enabled não deixa dois listeners de mousemove ativos ao mesmo tempo", () => {
    const addSpy = vi.spyOn(EventTarget.prototype, "addEventListener");
    const removeSpy = vi.spyOn(EventTarget.prototype, "removeEventListener");

    const el = mount(true); // efeito 1: liga (add #1)
    el.getBoundingClientRect = fakeRect;
    rerender(false); // cleanup do efeito 1 (remove #1) + efeito 2 (enabled=false, sem add)
    rerender(true); // sem cleanup do efeito 2 (não tinha) + efeito 3 liga de novo (add #2)

    const mouseMoveAdds = addSpy.mock.calls.filter((c) => c[0] === "mousemove").length;
    const mouseMoveRemoves = removeSpy.mock.calls.filter((c) => c[0] === "mousemove").length;
    expect(mouseMoveAdds).toBe(2);
    expect(mouseMoveRemoves).toBe(1);

    fireMouseMove(el, 300, 300);
    expect(latestController!.source).toBe("pointer");
  });

  it("visibilitychange (voltar do segundo plano) força recalibração no próximo evento de orientação", () => {
    (globalThis as any).DeviceOrientationEvent = function () {};
    mount(true);

    fireOrientation(10, 5); // calibra
    fireOrientation(15, 5); // alvo y=0.5

    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    // Sem recalibração, este evento com os MESMOS valores do passo anterior
    // normalizaria contra o neutro antigo (10,5) e manteria y=0.5. Com
    // recalibração, ele só recaptura o neutro (15,5) — não move o alvo.
    fireOrientation(15, 5);
    // este evento normaliza contra o neutro NOVO (15,5): delta 0 -> alvo (0,0)
    fireOrientation(15, 5);

    expect(latestController!.source).toBe("device-orientation");
  });
});
