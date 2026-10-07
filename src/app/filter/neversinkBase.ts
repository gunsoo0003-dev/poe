import { NEVER_SINK, NEVER_SINK_STRICTNESSES, type NeverSinkStrictnessId } from "./filterData";

export type NeverSinkBasePayload = {
  id: NeverSinkStrictnessId;
  version: string;
  text: string;
};

export async function loadNeverSinkBase(id: NeverSinkStrictnessId): Promise<NeverSinkBasePayload> {
  const meta = NEVER_SINK_STRICTNESSES.find((entry) => entry.id === id);
  if (!meta) throw new Error(`Unknown NeverSink strictness: ${id}`);

  const response = await fetch(meta.localPath, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`NeverSink base file missing: ${meta.localPath}`);
  }

  const text = await response.text();
  const versionMatch = text.match(/^# VERSION:\s*([^\r\n]+)/m);
  const typeMatch = text.match(/^# TYPE:\s*([^\r\n]+)/m);
  const version = versionMatch?.[1]?.trim() ?? "";
  const type = typeMatch?.[1]?.trim() ?? "";

  if (version !== NEVER_SINK.version) {
    throw new Error(`NeverSink version mismatch: expected ${NEVER_SINK.version}, got ${version || "unknown"}`);
  }
  if (type !== id) {
    throw new Error(`NeverSink strictness mismatch: expected ${id}, got ${type || "unknown"}`);
  }

  return { id, version, text };
}

export function hasUserOverrides(customCount: number): boolean {
  return customCount > 0;
}

export function buildUnmodifiedFilter(base: NeverSinkBasePayload, customCount: number): string {
  if (hasUserOverrides(customCount)) {
    throw new Error("Unmodified base requested while user overrides exist.");
  }
  return base.text;
}
