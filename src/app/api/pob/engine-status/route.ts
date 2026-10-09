import { NextResponse } from "next/server";
import { getPob2EngineStatus, runPob2Smoke } from "@/lib/pob2-engine/headless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getPob2EngineStatus();
  return NextResponse.json(status);
}

export async function POST() {
  const result = await runPob2Smoke();
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
