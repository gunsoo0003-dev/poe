/**
 * Canonical POE2 ring slots. Ring 1 and Ring 2 MUST be exact matches:
 * substring matching `ring` against `ring2` can render the same item twice.
 *
 * poe.ninja may supply inventoryId `Ring` with inventory x=0/1,
 * or explicit `Ring 1`/`Ring 2` slot names. Unknown positions are left
 * unresolved rather than guessed, to avoid showing a wrong item.
 */
export type CanonicalRingSlot = "Ring 1" | "Ring 2";

export function canonicalRingSlot(rawSlot?: string, inventoryX?: number): CanonicalRingSlot | undefined {
  const normalized = (rawSlot ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (normalized === "ring1" || normalized === "leftring") return "Ring 1";
  if (normalized === "ring2" || normalized === "rightring") return "Ring 2";
  if (normalized !== "ring") return undefined;
  if (inventoryX === 0) return "Ring 1";
  if (inventoryX === 1) return "Ring 2";
  return undefined;
}

export function matchesRingSlot(uiSlot: string, importedSlot?: string): boolean {
  const resolved = canonicalRingSlot(importedSlot);
  return (uiSlot === "ring-a" && resolved === "Ring 1") ||
    (uiSlot === "ring-b" && resolved === "Ring 2");
}
