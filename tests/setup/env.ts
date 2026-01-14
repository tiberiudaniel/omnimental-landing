import { JSDOM } from "jsdom";
import { beforeEach, afterEach } from "node:test";
import { cleanup } from "@testing-library/react";

const envDefaults: Record<string, string> = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "test-api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "test.local",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-project",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "demo-bucket",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "demo-sender",
  NEXT_PUBLIC_FIREBASE_APP_ID: "demo-app-id",
  NEXT_PUBLIC_DISABLE_PROGRESS_WRITES: "true",
};

const ensureEnv = (key: string, value: string) => {
  if (!process.env[key]) {
    Reflect.set(process.env, key, value);
  }
};

Object.entries(envDefaults).forEach(([key, value]) => {
  ensureEnv(key, value);
});

ensureEnv("NODE_ENV", process.env.NODE_ENV ?? "test");
ensureEnv("NEXT_PUBLIC_DISABLE_TELEMETRY", process.env.NEXT_PUBLIC_DISABLE_TELEMETRY ?? "1");

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });

const applyDomGlobals = () => {
  const { window } = dom;
  window.document.body.innerHTML = "";
  Object.assign(globalThis, {
    window,
    document: window.document,
    HTMLElement: window.HTMLElement,
    Node: window.Node,
    Event: window.Event,
    CustomEvent: window.CustomEvent,
    localStorage: window.localStorage,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  if (!("navigator" in globalThis)) {
    Object.defineProperty(globalThis, "navigator", {
      value: { userAgent: "node.js" },
      configurable: true,
    });
  }
  if (!globalThis.requestAnimationFrame) {
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) =>
      setTimeout(() => cb(Date.now()), 16) as unknown as number;
    globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id);
  }
};

applyDomGlobals();
beforeEach(() => {
  applyDomGlobals();
});

afterEach(() => {
  cleanup();
});
