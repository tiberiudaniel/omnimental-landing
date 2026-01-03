"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import clsx from "clsx";
import {
  usePathname,
  useRouter,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";
import type { StepManifest } from "@/lib/stepManifests/types";
import { applyStepOrderOverride, resolveNextStepId, resolveValidStepId } from "@/lib/stepRunner/engine";
import { useRuntimeFlowOverride } from "@/lib/stepRunner/useRuntimeFlowOverride";
import StepRunnerContext from "./StepRunnerContext";
import type {
  StepComponentProps,
  StepRunnerContextValue,
  StepRunnerGoHandler,
  StepRunnerSetState,
  StepRunnerState,
  StepRunnerStateInput,
} from "./types";

export type StepRegistry = Record<string, React.ComponentType<StepComponentProps>>;

type StepRunnerProps = {
  routePath: string;
  manifest: StepManifest;
  registry: StepRegistry;
  className?: string;
  fallback?: ReactNode;
};

const DEFAULT_FALLBACK = (
  <div className="rounded-2xl border border-[var(--omni-border-soft)] bg-white/80 p-6 text-sm text-[var(--omni-muted)]">
    Nu exista componenta pentru pasul curent.
  </div>
);

function getStorageKey(routePath: string): string {
  const slug = routePath.replace(/\s+/g, "").replace(/\/+/g, "_");
  return `step-runner:${slug || "root"}`;
}

function readState(key: string): StepRunnerState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StepRunnerState;
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
    return {};
  } catch {
    return {};
  }
}

function writeState(key: string, value: StepRunnerState) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value ?? {}));
  } catch (error) {
    console.warn("[step-runner] Failed to persist state", error);
  }
}

function cloneSearchParams(params: ReadonlyURLSearchParams | null): URLSearchParams {
  return new URLSearchParams(params ? params.toString() : "");
}

export function StepRunner({ routePath, manifest, registry, className, fallback }: StepRunnerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const override = useRuntimeFlowOverride(routePath);
  const resolvedManifest = useMemo(
    () => applyStepOrderOverride(manifest, override),
    [manifest, override],
  );
  const stepParam = searchParams?.get("step") ?? null;
  const currentStepId = useMemo(
    () => resolveValidStepId(resolvedManifest, stepParam),
    [resolvedManifest, stepParam],
  );
  const storageKey = useMemo(() => getStorageKey(routePath), [routePath]);
  const [state, setStateInternal] = useState<StepRunnerState>(() => readState(storageKey));
  useEffect(() => {
    setStateInternal(readState(storageKey));
  }, [storageKey]);
  useEffect(() => {
    writeState(storageKey, state);
  }, [state, storageKey]);

  const go = useCallback<StepRunnerGoHandler>(
    (variant = "next") => {
      if (!currentStepId) return;
      const nextId = resolveNextStepId(resolvedManifest, currentStepId, variant);
      if (!nextId) return;
      const params = cloneSearchParams(searchParams ?? null);
      params.set("step", nextId);
      const query = params.toString();
      const target = query ? `${pathname}?${query}` : pathname;
      router.replace(target, { scroll: false });
    },
    [currentStepId, pathname, resolvedManifest, router, searchParams],
  );

  useEffect(() => {
    if (!currentStepId || !pathname) return;
    const currentParam = searchParams?.get("step");
    if (currentParam === currentStepId) return;
    const params = cloneSearchParams(searchParams ?? null);
    params.set("step", currentStepId);
    const query = params.toString();
    const target = query ? `${pathname}?${query}` : pathname;
    router.replace(target, { scroll: false });
  }, [currentStepId, pathname, router, searchParams]);

  const setState = useCallback<StepRunnerSetState>((update: StepRunnerStateInput) => {
    setStateInternal((prev) => {
      const base = typeof prev === "object" && prev !== null ? prev : {};
      if (typeof update === "function") {
        const next = update(base);
        return next ?? {};
      }
      return { ...base, ...update };
    });
  }, []);

  const currentNode = useMemo(
    () => resolvedManifest.nodes.find((node) => node.id === currentStepId) ?? null,
    [resolvedManifest, currentStepId],
  );
  const CurrentStepComponent = currentNode ? registry[currentNode.id] ?? null : null;
  useEffect(() => {
    if (currentNode && !CurrentStepComponent) {
      console.warn(`[step-runner] missing component for step "${currentNode.id}"`);
    }
  }, [CurrentStepComponent, currentNode]);

  const contextValue = useMemo<StepRunnerContextValue>(
    () => ({
      routePath,
      manifest: resolvedManifest,
      currentStepId,
      node: currentNode,
      go,
      state,
      setState,
    }),
    [currentNode, currentStepId, go, resolvedManifest, routePath, setState, state],
  );

  return (
    <StepRunnerContext.Provider value={contextValue}>
      <div className={clsx("w-full", className)}>
        {currentNode && CurrentStepComponent ? (
          <CurrentStepComponent
            node={currentNode}
            manifest={resolvedManifest}
            routePath={routePath}
            go={go}
            state={state}
            setState={setState}
          />
        ) : (
          fallback ?? DEFAULT_FALLBACK
        )}
      </div>
    </StepRunnerContext.Provider>
  );
}

export default StepRunner;
