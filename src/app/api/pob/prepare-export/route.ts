import { NextRequest, NextResponse } from "next/server";
import { inflateSync } from "node:zlib";

export const runtime = "nodejs";
const MAX_COMPRESSED = 8 * 1024 * 1024;
const MAX_XML = 32 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = typeof body?.exportCode === "string" ? body.exportCode : "";
    const code = text.trim().replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
    if (!code || code.length > MAX_COMPRESSED * 2 || !/^[A-Za-z0-9+/]*={0,2}$/.test(code)) {
      return NextResponse.json({ ok: false, error: "PoB Export 코드가 없거나 올바르지 않습니다." }, { status: 400 });
    }
    const compressed = Buffer.from(code, "base64");
    if (compressed.length > MAX_COMPRESSED) throw new Error("Export 데이터 용량 초과");
    const xmlBuffer = inflateSync(compressed, { maxOutputLength: MAX_XML });
    const xml = xmlBuffer.toString("utf8");
    if (!/<PathOfBuilding2?(?:\s|>)/.test(xml) || !/<\/PathOfBuilding2?\s*>/.test(xml)) {
      throw new Error("완전한 PathOfBuilding XML이 아닙니다.");
    }
    const buildAttrs = xml.match(/<Build\b([^>]*)>/)?.[1] || "";
    const attribute = (key: string) => buildAttrs.match(new RegExp(`\\b${key}="([^"]*)"`))?.[1] || null;
    const metadata = {
      level: attribute("level"), className: attribute("className"),
      ascendancy: attribute("ascendClassName"),
      itemCount: (xml.match(/<Item\b/g) || []).length,
      skillCount: (xml.match(/<Skill\b/g) || []).length,
      xmlBytes: xmlBuffer.length,
    };
    // Export remains in memory for this request. No persistent files or Windows executables.
    return NextResponse.json({ ok: true, stage: "EXPORT_VALIDATED", metadata, xml });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Export 해독 실패" }, { status: 422 });
  }
}
