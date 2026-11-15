import { NextRequest, NextResponse } from "next/server";
import { decodePob2ExportCode } from "@/app/pob/pobExport";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = typeof body?.exportCode === "string" ? body.exportCode : "";
    const { xml, parsed } = decodePob2ExportCode(text);

    // The XML and normalized view are derived from the same user-provided
    // PoB export. No character is fabricated from the poe.ninja URL alone.
    return NextResponse.json({
      ok: true,
      stage: "EXPORT_VALIDATED",
      metadata: parsed.metadata,
      characterData: {
        level: parsed.level,
        characterClass: parsed.characterClass,
        mainSkill: parsed.mainSkill,
        ascendancy: parsed.ascendancy,
        items: parsed.items,
        jewels: parsed.jewels,
        skills: parsed.skills,
        stats: [],
      },
      xml,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Export 해독 실패",
    }, { status: 422 });
  }
}
