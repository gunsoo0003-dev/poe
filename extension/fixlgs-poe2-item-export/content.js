(() => {
  if (window.__FIXLGS_POE2_CONTENT__) return;
  window.__FIXLGS_POE2_CONTENT__ = true;

  const itemById = new Map();
  const itemOrder = [];
  let lastCapturedAt = 0;

  const hook = document.createElement("script");
  hook.src = chrome.runtime.getURL("page-hook.js");
  hook.async = false;
  (document.documentElement || document.head).appendChild(hook);
  hook.addEventListener("load", () => hook.remove(), { once: true });

  function stripMarkup(value) {
    return String(value ?? "")
      .replace(/<<[^>]*>>/g, "")
      .replace(/\{[^}]*\}/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function rarityName(item) {
    if (typeof item?.rarity === "string" && item.rarity.trim()) return stripMarkup(item.rarity);
    if (typeof item?.frameTypeId === "string" && item.frameTypeId.trim()) return stripMarkup(item.frameTypeId);
    return ({
      0: "Normal", 1: "Magic", 2: "Rare", 3: "Unique", 4: "Gem",
      5: "Currency", 6: "Divination Card", 7: "Quest Item", 8: "Prophecy",
      9: "Relic", 10: "Relic", 11: "Normal", 12: "Magic", 13: "Rare", 14: "Unique"
    })[item?.frameType] || "Rare";
  }

  function formatValueTuple(value) {
    if (Array.isArray(value)) {
      if (Array.isArray(value[0])) return value.map(formatValueTuple).join(", ");
      return stripMarkup(value[0] ?? value.join(" "));
    }
    if (value && typeof value === "object") {
      for (const key of ["text", "name", "value", "displayText", "label"]) {
        if (value[key] != null && typeof value[key] !== "object") return stripMarkup(value[key]);
      }
      try { return stripMarkup(JSON.stringify(value)); } catch (_) { return ""; }
    }
    return stripMarkup(value);
  }

  function formatProperty(prop) {
    if (!prop || typeof prop !== "object" || !prop.name) return "";
    const values = Array.isArray(prop.values) ? prop.values.map(formatValueTuple).filter(Boolean) : [];
    let name = stripMarkup(prop.name);
    if (name.includes("%0") && values.length) {
      values.forEach(v => { name = name.replace("%0", v); });
      return name;
    }
    if (!values.length) return name;
    return `${name}: ${values.join(", ")}`;
  }

  function replaceIndexedPlaceholders(template, values) {
    let text = stripMarkup(template);
    values.forEach((value, index) => {
      const v = stripMarkup(value);
      text = text.replaceAll(`%${index}`, v).replaceAll(`{${index}}`, v);
    });
    return text;
  }

  function modObjectToText(mod) {
    if (mod == null) return "";
    if (typeof mod === "string" || typeof mod === "number") return stripMarkup(mod);
    if (Array.isArray(mod)) return mod.map(modObjectToText).filter(Boolean).join(" ");
    if (typeof mod !== "object") return "";

    const directKeys = [
      "text", "displayText", "display_text", "formatted", "description",
      "line", "modText", "mod_text", "translatedText", "translated_text"
    ];
    for (const key of directKeys) {
      if (typeof mod[key] === "string" && mod[key].trim()) return stripMarkup(mod[key]);
    }

    const values = Array.isArray(mod.values)
      ? mod.values.map(formatValueTuple).filter(Boolean)
      : mod.value != null ? [formatValueTuple(mod.value)].filter(Boolean) : [];

    const template = [mod.name, mod.template, mod.format, mod.label].find(
      value => typeof value === "string" && value.trim()
    );

    if (template) {
      let text = replaceIndexedPlaceholders(template, values);
      if (values.length && text === stripMarkup(template)) text = `${text}: ${values.join(", ")}`;
      return stripMarkup(text);
    }

    const nestedKeys = ["option", "mod", "data", "value", "translation", "translated"];
    for (const key of nestedKeys) {
      const text = modObjectToText(mod[key]);
      if (text) return text;
    }

    try { return `[FIXLGS RAW MOD] ${JSON.stringify(mod)}`; }
    catch (_) { return "[FIXLGS RAW MOD]"; }
  }

  function socketSymbol(socket) {
    const attr = stripMarkup(socket?.attr || "");
    if (attr) return attr;
    const type = String(socket?.type || "").toLowerCase();
    if (type === "rune") return "S";
    if (type === "gem") return "G";
    if (type === "abyss") return "A";
    return "S";
  }

  function formatSockets(item) {
    if (!Array.isArray(item?.sockets) || !item.sockets.length) return "";
    const groups = new Map();
    item.sockets.forEach((socket, index) => {
      const group = Number.isFinite(socket?.group) ? socket.group : index;
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(socketSymbol(socket));
    });
    return [...groups.values()].map(group => group.join("-")).join(" ");
  }

  // V004.4: Read quality from explicit item-quality fields only. Some official
  // listings omit it from the English properties array while retaining it in
  // the captured regional listing. Numeric quality is locale independent.
  // Never derive it from already quality-adjusted weapon damage / DPS.
  function parseQualityAmount(value) {
    if (typeof value === "number") {
      return Number.isInteger(value) && value >= 0 && value <= 100 ? value : null;
    }
    if (typeof value === "string") {
      const match = stripMarkup(value).match(/^\+?(\d{1,3})(?:\s*%)?(?:\s*\(augmented\))?$/i);
      if (!match) return null;
      const amount = Number(match[1]);
      return amount >= 0 && amount <= 100 ? amount : null;
    }
    if (value && typeof value === "object") {
      for (const key of ["value", "text", "amount"]) {
        if (value[key] != null) {
          const parsed = parseQualityAmount(value[key]);
          if (parsed != null) return parsed;
        }
      }
    }
    return null;
  }

  function qualityValuesFromItem(item, source, allowKorean = false) {
    if (!item || typeof item !== "object") return [];
    const found = [];
    const add = (value, field) => {
      const amount = parseQualityAmount(value);
      if (amount == null) throw Error(`QUALITY_PARSE_FAILED:${source}.${field}`);
      found.push({ amount, source: `${source}.${field}` });
    };
    for (const field of ["quality", "qualityValue"]) {
      if (item[field] != null) add(item[field], field);
    }
    if (item.extended && typeof item.extended === "object" && item.extended.quality != null) {
      add(item.extended.quality, "extended.quality");
    }
    const label = allowKorean ? /^(?:Quality|퀄리티)(?=\s*(?:[:：]|\(|$))/i : /^Quality(?=\s*(?:[:：]|\(|$))/i;
    for (const field of ["properties", "additionalProperties"]) {
      const list = Array.isArray(item[field]) ? item[field] : [];
      for (const prop of list) {
        if (!label.test(stripMarkup(prop?.name || ""))) continue;
        const values = Array.isArray(prop.values) ? prop.values.map(formatValueTuple).filter(Boolean) : [];
        let amount = values.map(parseQualityAmount).find(v => v != null);
        if (amount == null) {
          const match = stripMarkup(prop.name).match(/[:：]\s*\+?(\d{1,3})\s*%?/);
          if (match) amount = parseQualityAmount(match[1]);
        }
        if (amount == null) throw Error(`QUALITY_PARSE_FAILED:${source}.${field}`);
        found.push({ amount, source: `${source}.${field}` });
      }
    }
    return found;
  }

  // V004.5: The trade page sometimes renders a quality line although both the
  // regional and English JSON omit a supported quality field. Read only a row
  // whose listing identity can be verified. Never scan the page or another row.
  function qualityValuesFromRenderedRow(row, expectedId, capturedEntry) {
    if (!row || !expectedId) return [];
    const directId = rowId(row);
    const idMatches = directId === expectedId;
    // The old extension also supports item-name matching, but only when that
    // mapping is unique among captured entries. No result-index guessing.
    const uniqueMatch = !directId && !!capturedEntry && entryForRow(row) === capturedEntry;
    if (!idMatches && !uniqueMatch) return [];

    const texts = [row.innerText, row.textContent].filter(value => typeof value === "string" && value.trim());
    const values = [];
    for (const text of texts) {
      // textContent may concatenate neighboring HTML spans with no whitespace.
      // The field label plus percent sign is required; arbitrary percentages do
      // not count as quality.
      const label = /(?:퀄리티|Quality)\s*[:：]/gi;
      const parsed = /(?:퀄리티|Quality)\s*[:：]\s*\+?(\d{1,3})\s*%/gi;
      const matches = [...text.matchAll(parsed)];
      if (label.test(text) && !matches.length) throw Error("QUALITY_RENDERED_UNREADABLE");
      for (const match of matches) {
        const amount = parseQualityAmount(match[1]);
        if (amount == null) throw Error("QUALITY_RENDERED_INVALID");
        values.push({amount, source: "rendered.trade-row"});
      }
    }
    return values;
  }

  function resolveQuality(englishItem, capturedItem, renderedQualityValues = []) {
    const values = [
      ...qualityValuesFromItem(englishItem, "english"),
      ...qualityValuesFromItem(capturedItem, "captured", true),
      ...renderedQualityValues
    ];
    if (!values.length) return null;
    if (values.some(v => v.amount !== values[0].amount)) throw Error("QUALITY_CONFLICT");
    return values[0];
  }

  // V004.3: Only englishItemToPobText is the active EXPORT serializer.
  // The former unused alternative clipboard formatter was removed to prevent
  // divergence between preview-only code and the real English API pathway.

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.focus();
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    }
  }

  function collectEntries(node, output, seen = new WeakSet(), depth = 0) {
    if (!node || depth > 7 || typeof node !== "object" || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      for (const child of node) collectEntries(child, output, seen, depth + 1);
      return;
    }
    if (node.item && typeof node.item === "object") {
      const item = node.item;
      if (item.typeLine || item.name || item.explicitMods || item.properties) output.push(node);
    }
    for (const value of Object.values(node)) collectEntries(value, output, seen, depth + 1);
  }

  function ingest(payload) {
    const found = [];
    collectEntries(payload, found);
    let added = 0;
    for (const entry of found) {
      const id = String(entry.id || entry.item?.id || entry.listing?.id || "").trim();
      const key = id || `anonymous:${entry.item?.name || ""}:${entry.item?.typeLine || ""}:${itemOrder.length}`;
      if (!itemById.has(key)) {
        itemById.set(key, entry);
        itemOrder.push(entry);
        added++;
      } else {
        itemById.set(key, entry);
      }
    }
    if (added) {
      lastCapturedAt = Date.now();
      updateStatus();
      scheduleDecorate();
    }
  }

  window.addEventListener("message", event => {
    if (event.source !== window || event.origin !== location.origin) return;
    const data = event.data;
    if (!data || data.source !== "FIXLGS_POE2_PAGE" || data.type !== "FIXLGS_TRADE_JSON") return;
    ingest(data.payload);
  });

  function rowId(row) {
    const candidates = [
      row.getAttribute("data-id"), row.id,
      row.querySelector("[data-id]")?.getAttribute("data-id"),
      row.querySelector("[id]")?.id,
    ].filter(Boolean);
    for (const value of candidates) {
      const v = String(value).replace(/^result-/, "").trim();
      if (itemById.has(v)) return v;
    }
    return "";
  }

  function likelyRows() {
    const selectors = [
      ".resultset .row", ".resultset > .result", ".resultset [data-id]",
      ".search-results .row", "[class*=resultset] [class*=row]"
    ];
    const set = new Set();
    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach(el => {
        if (!(el instanceof HTMLElement)) return;
        const text = el.innerText || "";
        if (text.length < 20 || el.querySelector(".fixlgs-export-button")) return;
        set.add(el);
      });
    }
    return [...set];
  }

  function normalizedText(value) {
    return stripMarkup(value).replace(/\s+/g, "").toLowerCase();
  }

  function entryForRow(row) {
    const id = rowId(row);
    if (id && itemById.has(id)) return itemById.get(id);

    // Safe fallback: match the visible row against item name/base. Never use only row index,
    // because trade results can be re-ordered or incrementally loaded.
    const rowText = normalizedText(row.innerText || "");
    const matches = itemOrder.filter(entry => {
      const item = entry?.item || entry;
      const name = normalizedText(item?.name || "");
      const base = normalizedText(item?.typeLine || item?.baseType || "");
      return (!name || rowText.includes(name)) && (!base || rowText.includes(base));
    });
    return matches.length === 1 ? matches[0] : null;
  }

  function setButtonState(button, state, text) {
    button.dataset.state = state;
    button.textContent = text;
    // Keep errors visible until the user retries; successful copies reset normally.
    if (state !== "error") setTimeout(() => {
      if (button.isConnected && button.dataset.state === state) {
        button.dataset.state = "";
        button.textContent = "FIXLGS EXPORT";
      }
    }, 1600);
  }

  // V004: The official English API must return English item fields.
  function hasHangul(value) { return /[\uac00-\ud7a3]/.test(String(value || "")); }
  function currentSearchId() {
    // Supports both /trade2/search/<league>/<query> and
    // /trade2/search/poe2/<league>/<query>, including trailing routes.
    const parts = location.pathname.split("/").filter(Boolean);
    const searchIndex = parts.indexOf("search");
    if (searchIndex < 0 || parts[searchIndex - 1] !== "trade2") return "";
    const remaining = parts.slice(searchIndex + 1);
    if (remaining[0] === "poe2") remaining.shift();
    // Exactly league + query; do not accidentally interpret a search page as an ID.
    if (remaining.length !== 2) return "";
    return decodeURIComponent(remaining[1]);
  }
  // The clipboard contract is still FIXLGS-EN-V004 for older FIXLGS web builds.
  // V004.3 appends metadata solely for auditing source fidelity; the PoB adapter
  // strips metadata before handing the item to PoB's unchanged Item parser.
  function englishItemToPobText(entry, capturedListing = null, renderedQualityValues = []) {
    const item = entry?.item;
    if (!item || typeof item !== "object") throw Error("ENGLISH_ITEM_MISSING");
    const base = stripMarkup(item.baseType || item.typeLine || "");
    const displayName = stripMarkup(item.name || "");
    const typeLine = stripMarkup(item.typeLine || "");
    const name = displayName || (typeLine && typeLine !== base ? typeLine : "");
    const rarity = rarityName(item).toUpperCase();
    const modGroups = ["enchantMods", "runeMods", "implicitMods", "fracturedMods", "explicitMods", "craftedMods", "utilityMods", "scourgeMods", "desecratedMods", "corruptedMods"];
    const extraModKeys = Object.keys(item).filter(key => /Mods$/.test(key) && Array.isArray(item[key]) && !modGroups.includes(key)).sort();
    const modTexts = [...modGroups, ...extraModKeys].flatMap(key =>
      (Array.isArray(item[key]) ? item[key] : []).map(modObjectToText).filter(Boolean));
    const propertyTexts = [...(item.properties || []), ...(item.additionalProperties || [])].map(formatProperty).filter(Boolean);
    const unknownGrantedData = [];
    const grantedSkills = (Array.isArray(item.grantedSkills) ? item.grantedSkills : []).map(value => {
      const text = modObjectToText(value);
      if (text.startsWith('[FIXLGS RAW MOD]')) {
        unknownGrantedData.push(text);
        return '';
      }
      return text && !/^Grants (?:Skill|Level)\b/i.test(text) ? `Grants Skill: ${text}` : text;
    }).filter(Boolean);
    const allTexts = [base, name, ...modTexts, ...propertyTexts, ...grantedSkills];
    if (!base || allTexts.some(hasHangul)) throw Error("ENGLISH_DATA_NOT_AVAILABLE");

    const unresolvedMods = [];
    const safeMod = (value) => {
      const text = modObjectToText(value);
      if (text.startsWith('[FIXLGS RAW MOD]')) { unresolvedMods.push(text); return ''; }
      return text;
    };
    const lines = [`Rarity: ${rarity}`, ...(name && name !== base ? [name] : []), base];
    const quality = resolveQuality(item, capturedListing?.item, renderedQualityValues);
    if (quality) lines.push(`Quality: ${quality.amount}`);
    if (item.ilvl != null) lines.push(`Item Level: ${item.ilvl}`);
    const implicit = (item.implicitMods || []).map(safeMod).filter(Boolean);
    lines.push(`Implicits: ${implicit.length}`, ...implicit);
    // Preserve repeated modifier lines. Two separately sourced modifiers with the
    // same display string must not be silently collapsed into one effect.
    const insertMod = (text) => { if (text) lines.push(text); };
    for (const key of modGroups.filter(key => key !== "implicitMods")) {
      const suffix = {
        enchantMods: "(enchant)", runeMods: "(rune)", craftedMods: "(crafted)",
        fracturedMods: "(fractured)", corruptedMods: "(corrupted)"
      }[key];
      for (const value of item[key] || []) {
        const text = safeMod(value);
        if (text) insertMod(suffix && !text.endsWith(suffix) ? `${text} ${suffix}` : text);
      }
    }
    // Granted skills can arrive as grantedSkills, properties, or additionalProperties.
    // Use the original official English text; do not infer any skill from the base.
    const grantedSeen = new Set(lines.filter(text => /^Grants (?:Skill|Level)\b/i.test(text)));
    for (const text of [...propertyTexts, ...grantedSkills]) {
      if (/^Grants (?:Skill|Level)\b/i.test(text) && !grantedSeen.has(text)) {
        insertMod(text);
        grantedSeen.add(text);
      }
    }
    for (const key of extraModKeys) {
      for (const value of item[key]) insertMod(safeMod(value));
    }
    if (item.corrupted) lines.push("Corrupted");
    if (item.mirrored) lines.push("Mirrored");
    if (item.identified === false) lines.push("Unidentified");

    const socketed = (Array.isArray(item.socketedItems) ? item.socketedItems : [])
      .filter(value => value && typeof value === "object")
      .map(value => ({
        name: stripMarkup(value.name || ""), type: stripMarkup(value.typeLine || value.baseType || ""),
        mods: [...(value.implicitMods || []), ...(value.explicitMods || []), ...(value.runeMods || [])]
          .map(modObjectToText).filter(Boolean)
      }));
    // No seller/account/listing metadata is exported. Extra text stays visible to
    // FIXLGS for validation but is never silently treated as a PoB damage modifier.
    const audit = {
      version: 1,
      source: "official-english-trade",
      ...(quality ? { quality: quality.amount, qualitySource: quality.source } : {}),
      sockets: formatSockets(item),
      socketed,
      extraProperties: (item.additionalProperties || []).map(formatProperty).filter(Boolean),
      unknownModGroups: Object.fromEntries(extraModKeys.map(key => [key, item[key].map(modObjectToText).filter(Boolean)])),
      grants: grantedSkills,
      requirements: (item.requirements || []).map(formatProperty).filter(Boolean),
      unresolvedMods,
      unknownGrantedData,
      warnings: []
    };
    if (socketed.some(value => value.mods.length > 0)) {
      audit.warnings.push("Socketed item effects require PoB verification");
    }
    if (extraModKeys.length) audit.warnings.push("Unknown modifier groups require PoB verification");
    if (unresolvedMods.length || unknownGrantedData.length) audit.warnings.push("Unparsed official modifier data needs verification");
    if (item.identified === false) audit.warnings.push("Unidentified item options cannot be verified");
    // This line is explicitly removed by FIXLGS web before PoB parses the item.
    lines.push(`FIXLGS-META-V1:${JSON.stringify(audit)}`);
    return `FIXLGS-EN-V004\n${lines.join("\n")}`;
  }

  function getEnglishEntry(id, query) {
    return new Promise((resolve,reject)=>{
      chrome.runtime.sendMessage({type:"FIXLGS_ENGLISH_LISTING",id,query}, reply=>{
        if(chrome.runtime.lastError) return reject(Error(chrome.runtime.lastError.message));
        if(!reply?.ok) return reject(Error(reply?.error||"ENGLISH_API_FAILED"));
        resolve(reply.entry);
      });
    });
  }

  async function exportEntry(entry, button, row) {
    try {
      const id = String(entry.id || entry.item?.id || entry.listing?.id || "").trim();
      const query = currentSearchId();
      if(!id) throw Error("LISTING_ID_NOT_FOUND");
      if(!query) throw Error("SEARCH_ID_NOT_FOUND: " + location.pathname);
      button.textContent="FETCH EN…";
      const englishEntry = await getEnglishEntry(id,query);
      // Match the captured listing ID before using its locale-independent quality.
      const capture = String(entry?.id || entry?.item?.id || entry?.listing?.id || "").trim() === id ? entry : null;
      const renderedQuality = qualityValuesFromRenderedRow(row, id, entry);
      const text=englishItemToPobText(englishEntry, capture, renderedQuality);
      if(!await copyText(text)) throw Error("CLIPBOARD_FAILED");
      setButtonState(button,"ok","COPIED EN ✓");
    } catch(error) {
      const reason=String(error?.message || error || "UNKNOWN_ERROR");
      console.error("[FIXLGS V004.6] English listing failed:", reason, {listingId: entry?.id, searchId: currentSearchId()}, error);
      setButtonState(button,"error",`EN ERROR: ${reason}`);
      button.title=`영문 매물 조회 실패: ${reason}. 한국어 텍스트는 복사하지 않았습니다. 버튼을 다시 누르면 재시도합니다.`;
    }
  }

  function decorate() {
    const rows = likelyRows();
    rows.forEach(row => {
      if (row.querySelector(":scope > .fixlgs-export-button")) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fixlgs-export-button";
      button.textContent = "FIXLGS EXPORT";
      button.title = "이 매물 아이템을 FIXLGS / PoB 형식으로 복사";
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        const entry = entryForRow(row);
        if (!entry) {
          setButtonState(button, "error", "DATA WAIT");
          return;
        }
        exportEntry(entry, button, row);
      });
      row.prepend(button);
    });
    updateStatus();
  }

  let decorateTimer = null;
  function scheduleDecorate() {
    clearTimeout(decorateTimer);
    decorateTimer = setTimeout(decorate, 80);
  }

  function ensureStatus() {
    if (!document.body) return null;
    let status = document.getElementById("fixlgs-export-status");
    if (status) return status;
    status = document.createElement("div");
    status.id = "fixlgs-export-status";
    status.innerHTML = `<span class="fixlgs-status-text">FIXLGS EN V004.6: waiting</span>`;
    document.body.appendChild(status);
    return status;
  }

  function updateStatus() {
    const status = ensureStatus();
    if (!status) return;
    const text = status.querySelector(".fixlgs-status-text");
    const age = lastCapturedAt ? Math.max(0, Math.floor((Date.now() - lastCapturedAt) / 1000)) : null;
    text.textContent = itemOrder.length
      ? `FIXLGS: ${itemOrder.length} item${itemOrder.length === 1 ? "" : "s"} captured${age != null ? ` · ${age}s` : ""}`
      : "FIXLGS: waiting for trade data";
  }

  const observer = new MutationObserver(scheduleDecorate);
  const start = () => {
    if (!document.documentElement) return setTimeout(start, 20);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    scheduleDecorate();
    setInterval(updateStatus, 1000);
  };
  start();
})();
