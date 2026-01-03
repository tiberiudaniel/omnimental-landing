import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUTPUT_PATH = path.join(process.cwd(), "tests/e2e/fixtures/journeys.json");

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Export disabled in production" }, { status: 403 });
  }

  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { journeys?: unknown }).journeys)) {
    return NextResponse.json({ error: "Invalid journeys spec" }, { status: 422 });
  }

  try {
    await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
    await writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2), "utf-8");
    return NextResponse.json({ ok: true, path: OUTPUT_PATH });
  } catch (error) {
    console.error("[export-journeys] failed to write file", error);
    return NextResponse.json({ error: "Failed to write journeys file" }, { status: 500 });
  }
}
