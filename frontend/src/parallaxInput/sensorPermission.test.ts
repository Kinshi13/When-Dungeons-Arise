import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  isOrientationSupported,
  requiresExplicitPermission,
  initialPermissionState,
  requestOrientationPermission,
} from "./sensorPermission";

const originalDOE = (globalThis as any).DeviceOrientationEvent;

function restore() {
  if (originalDOE === undefined) delete (globalThis as any).DeviceOrientationEvent;
  else (globalThis as any).DeviceOrientationEvent = originalDOE;
}

describe("sensorPermission — sem DeviceOrientationEvent (unsupported)", () => {
  beforeEach(() => {
    delete (globalThis as any).DeviceOrientationEvent;
  });
  afterEach(restore);

  it("isOrientationSupported false", () => {
    expect(isOrientationSupported()).toBe(false);
  });
  it("initialPermissionState 'unsupported'", () => {
    expect(initialPermissionState()).toBe("unsupported");
  });
});

describe("sensorPermission — Android/desktop com sensor (sem requestPermission)", () => {
  beforeEach(() => {
    (globalThis as any).DeviceOrientationEvent = function () {};
  });
  afterEach(restore);

  it("isOrientationSupported true, requiresExplicitPermission false", () => {
    expect(isOrientationSupported()).toBe(true);
    expect(requiresExplicitPermission()).toBe(false);
  });
  it("initialPermissionState 'granted' direto (não exige gesto)", () => {
    expect(initialPermissionState()).toBe("granted");
  });
  it("requestOrientationPermission resolve 'granted' sem precisar de nada", async () => {
    await expect(requestOrientationPermission()).resolves.toBe("granted");
  });
});

describe("sensorPermission — iOS 13+ Safari (com requestPermission)", () => {
  afterEach(restore);

  it("initialPermissionState 'unknown' até o usuário decidir", () => {
    (globalThis as any).DeviceOrientationEvent = function () {};
    (globalThis as any).DeviceOrientationEvent.requestPermission = async () => "granted";
    expect(requiresExplicitPermission()).toBe(true);
    expect(initialPermissionState()).toBe("unknown");
  });

  it("requestOrientationPermission 'granted' quando o usuário concede", async () => {
    (globalThis as any).DeviceOrientationEvent = function () {};
    (globalThis as any).DeviceOrientationEvent.requestPermission = async () => "granted";
    await expect(requestOrientationPermission()).resolves.toBe("granted");
  });

  it("requestOrientationPermission 'denied' quando o usuário nega", async () => {
    (globalThis as any).DeviceOrientationEvent = function () {};
    (globalThis as any).DeviceOrientationEvent.requestPermission = async () => "denied";
    await expect(requestOrientationPermission()).resolves.toBe("denied");
  });

  it("requestOrientationPermission 'denied' se a chamada lançar erro", async () => {
    (globalThis as any).DeviceOrientationEvent = function () {};
    (globalThis as any).DeviceOrientationEvent.requestPermission = async () => {
      throw new Error("não permitido nesse contexto");
    };
    await expect(requestOrientationPermission()).resolves.toBe("denied");
  });
});
