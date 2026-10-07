NeverSink PoE2 local base files
Current pinned release: 0.10.4
Official commit checked: f4b6b2d

Included strictness files:
0-SOFT, 1-REGULAR, 2-SEMI-STRICT, 3-STRICT, 4-VERY-STRICT, 5-UBER-STRICT, 6-UBER-PLUS-STRICT

Rule:
- If the user selects a strictness and makes zero custom changes, the downloaded .filter is the pinned NeverSink original file byte-for-byte.
- FIXLGS custom sound/importance/visibility rules are overrides only.
- FIXLGS-only convenience rules start disabled.

The baseline/*.json files are UI inspection indexes generated from the pinned originals.
They summarize matching Show/Hide rules for each FIXLGS list entry and do not replace the original filter files.
