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

  function socketedItemLines(item) {
    if (!Array.isArray(item?.socketedItems)) return [];
    return item.socketedItems
      .filter(socketed => socketed && typeof socketed === "object" && socketed.frameType !== 4 && socketed.frameTypeId !== "Gem")
      .map(socketed => {
        const name = stripMarkup(socketed.name || "");
        const base = stripMarkup(socketed.typeLine || socketed.baseType || "");
        const label = [name, base].filter(Boolean).join(name && base && name !== base ? " · " : "");
        return label ? `Socketed Item: ${label}` : "";
      })
      .filter(Boolean);
  }

  function pushUniqueBlock(lines, seenLines, values, suffix = "") {
    const clean = [];
    for (const value of values || []) {
      let text = modObjectToText(value);
      if (!text) continue;
      if (suffix && !text.endsWith(suffix)) text = `${text} ${suffix}`;
      const key = text.trim();
      if (!key || seenLines.has(key)) continue;
      seenLines.add(key);
      clean.push(key);
    }
    if (clean.length) lines.push("--------", ...clean);
  }

  function pushPropertyBlock(lines, seenLines, properties) {
    const clean = [];
    for (const prop of properties || []) {
      const text = formatProperty(prop);
      if (!text || seenLines.has(text)) continue;
      seenLines.add(text);
      clean.push(text);
    }
    if (clean.length) lines.push("--------", ...clean);
  }

  const knownModKeys = [
    "enchantMods", "runeMods", "implicitMods", "fracturedMods", "explicitMods",
    "craftedMods", "utilityMods", "scourgeMods", "desecratedMods", "corruptedMods"
  ];

  function unknownModBuckets(item) {
    return Object.keys(item || {})
      .filter(key => /Mods$/.test(key) && Array.isArray(item[key]) && !knownModKeys.includes(key))
      .sort()
      .map(key => item[key]);
  }

  function itemToPobText(entry) {
    const item = entry?.item || entry;
    if (!item || typeof item !== "object") throw new Error("아이템 데이터 없음");

    const lines = [];
    const seenLines = new Set();
    lines.push(`Rarity: ${rarityName(item)}`);
    if (item.name) lines.push(stripMarkup(item.name));
    if (item.typeLine || item.baseType) lines.push(stripMarkup(item.typeLine || item.baseType));

    const props = (item.properties || []).map(formatProperty).filter(Boolean);
    if (props.length) lines.push("--------", ...props);

    if (item.ilvl != null) lines.push("--------", `Item Level: ${item.ilvl}`);

    const req = (item.requirements || []).map(formatProperty).filter(Boolean);
    if (req.length) lines.push("--------", "Requirements:", ...req.map(v => `  ${v}`));

    // Granted skills are part of the actual item spec (e.g. "Grants Skill: Spear Throw").
    pushPropertyBlock(lines, seenLines, item.grantedSkills);

    // Some trade items expose extra visible properties outside the normal property list.
    pushPropertyBlock(lines, seenLines, item.additionalProperties);

    const sockets = formatSockets(item);
    const socketed = socketedItemLines(item);
    if (sockets || socketed.length) {
      lines.push("--------");
      if (sockets) lines.push(`Sockets: ${sockets}`);
      lines.push(...socketed);
    }

    // Keep the API's semantic groups. This prevents rune/enchant/implicit effects from
    // being silently merged into normal explicit modifiers.
    pushUniqueBlock(lines, seenLines, item.enchantMods, "(enchant)");
    pushUniqueBlock(lines, seenLines, item.runeMods, "(rune)");
    pushUniqueBlock(lines, seenLines, item.implicitMods, "(implicit)");
    pushUniqueBlock(lines, seenLines, item.fracturedMods, "(fractured)");
    pushUniqueBlock(lines, seenLines, item.explicitMods);
    pushUniqueBlock(lines, seenLines, item.craftedMods, "(crafted)");
    pushUniqueBlock(lines, seenLines, item.utilityMods, "(utility)");
    pushUniqueBlock(lines, seenLines, item.scourgeMods, "(scourge)");
    pushUniqueBlock(lines, seenLines, item.desecratedMods, "(desecrated)");
    pushUniqueBlock(lines, seenLines, item.corruptedMods, "(corrupted)");
    unknownModBuckets(item).forEach(bucket => pushUniqueBlock(lines, seenLines, bucket));

    const states = [];
    if (item.corrupted) states.push("Corrupted");
    if (item.identified === false) states.push("Unidentified");
    if (item.mirrored) states.push("Mirrored");
    if (item.duplicated || item.split) states.push("Split");
    if (item.replica) states.push("Replica");
    if (item.synthesised) states.push("Synthesised");
    if (item.veiled) states.push("Veiled");
    if (states.length) lines.push("--------", ...states);

    return lines.join("\n");
  }

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
    if (event.source !== window) return;
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
    setTimeout(() => {
      if (button.isConnected) {
        button.dataset.state = "";
        button.textContent = "FIXLGS EXPORT";
      }
    }, 1600);
  }

  // V004: The official English API must return English item fields.
  function hasHangul(value) { return /[\uac00-\ud7a3]/.test(String(value || "")); }
  function currentSearchId() {
    const match = location.pathname.match(/\/trade2\/search\/(?:poe2\/)?[^/]+\/([a-zA-Z0-9_-]+)\/?$/);
    return match?.[1] || "";
  }
  function englishItemToPobText(entry) {
    const item = entry.item;
    const base = stripMarkup(item.baseType || item.typeLine || "");
    const name = stripMarkup(item.name || "");
    const modGroups = ["enchantMods", "runeMods", "implicitMods", "fracturedMods", "explicitMods", "craftedMods", "utilityMods", "scourgeMods", "desecratedMods", "corruptedMods"];
    const allMods = modGroups.flatMap(key => (item[key] || []).map(modObjectToText));
    if (!base || hasHangul(base) || hasHangul(name) || allMods.some(hasHangul)) throw new Error("ENGLISH_DATA_NOT_AVAILABLE");
    const rarity=rarityName(item);
    const lines=[`Rarity: ${rarity.toUpperCase()}`, ...(name && name!==base ? [name] : []), base];
    // Explicit original modifier lines only; never add already-calculated weapon DPS/properties.
    const quality=(item.properties||[]).find(p=>/quality/i.test(p?.name||""));
    if(quality){const value=formatProperty(quality).match(/([+]?[0-9]+)%/);if(value)lines.push(`Quality: ${value[1].replace(/^\+/,'')}`);}
    if(item.ilvl!=null)lines.push(`Item Level: ${item.ilvl}`);
    const implicit=(item.implicitMods||[]).map(modObjectToText).filter(Boolean);
    lines.push(`Implicits: ${implicit.length}`, ...implicit);
    for(const group of modGroups.filter(k=>k!=="implicitMods")) {
      const suffix={enchantMods:"(enchant)",runeMods:"(rune)",craftedMods:"(crafted)",fracturedMods:"(fractured)",corruptedMods:"(corrupted)"}[group];
      for (const mod of item[group]||[]) {const text=modObjectToText(mod);if(text)lines.push(suffix ? `${text} ${suffix}` : text);}
    }
    if(item.corrupted)lines.push("Corrupted");
    if(item.mirrored)lines.push("Mirrored");
    if(item.identified===false)lines.push("Unidentified");
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

  async function exportEntry(entry, button) {
    try {
      const id = String(entry.id || entry.item?.id || "");
      const query = currentSearchId();
      if(!id || !query) throw Error("SEARCH_ID_NOT_FOUND");
      button.textContent="FETCH EN…";
      const englishEntry = await getEnglishEntry(id,query);
      const text=englishItemToPobText(englishEntry);
      if(!await copyText(text)) throw Error("CLIPBOARD_FAILED");
      setButtonState(button,"ok","COPIED EN ✓");
    } catch(error) {
      console.warn("[FIXLGS V004] English listing unavailable",error);
      setButtonState(button,"error","EN ERROR");
      button.title=`영문 매물 조회 실패: ${error.message||error}. 한국어 텍스트를 잘못 계산하지 않도록 복사하지 않았습니다.`;
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
        exportEntry(entry, button);
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
    status.innerHTML = `<span class="fixlgs-status-text">FIXLGS EN V004: waiting</span>`;
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
