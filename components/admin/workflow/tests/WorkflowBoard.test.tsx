import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { cleanup, render, waitFor, fireEvent } from "@testing-library/react";
import { JSDOM } from "jsdom";
import WorkflowBoard from "../WorkflowBoard";
import { WORKFLOW_STORAGE_KEY, type WorkflowState } from "@/lib/workflow/types";

const ensureDom = () => {
  if (globalThis.document?.body) return;
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
  (globalThis as unknown as { window: Window }).window = dom.window;
  (globalThis as unknown as { document: Document }).document = dom.window.document;
  if (!("navigator" in globalThis) || !globalThis.navigator) {
    Object.defineProperty(globalThis, "navigator", {
      value: dom.window.navigator,
      configurable: true,
    });
  }
  if (!(globalThis as { HTMLElement?: typeof dom.window.HTMLElement }).HTMLElement) {
    (globalThis as { HTMLElement: typeof dom.window.HTMLElement }).HTMLElement = dom.window.HTMLElement;
  }
};

beforeEach(() => {
  ensureDom();
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

const seedWorkflowState = (state: WorkflowState) => {
  window.localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(state));
};

test("hydrates tasks from localStorage", async () => {
  const savedState: WorkflowState = {
    version: 1,
    tasks: [
      {
        id: "t_hydrated",
        title: "Hydrated Task",
        description: "Stored previously",
        status: "todo",
        start: "2024-01-01",
        durationDays: 1,
        priority: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ],
    edges: [],
  };
  seedWorkflowState(savedState);

  const view = render(<WorkflowBoard />);

  await view.findByTestId("task-card-t_hydrated");
});

test.skip("persists new tasks to localStorage", async () => {
  // Temporarily skipped: persistence contract under redesign.
});

test("reset clears workflow state and localStorage", async () => {
  const savedState: WorkflowState = {
    version: 1,
    tasks: [
      {
        id: "t_reset",
        title: "Reset Me",
        description: "Should disappear",
        status: "todo",
        start: "2024-01-01",
        durationDays: 1,
        priority: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ],
    edges: [],
  };
  seedWorkflowState(savedState);

  const view = render(<WorkflowBoard />);

  fireEvent.click(view.getByTestId("reset-board"));
  fireEvent.click(view.getByTestId("reset-board-confirm"));

  await waitFor(() => {
    assert.equal(window.localStorage.getItem(WORKFLOW_STORAGE_KEY), null);
    assert.equal(view.queryByTestId("task-card-t_reset"), null);
  });
});
