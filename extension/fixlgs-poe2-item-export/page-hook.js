(() => {
  if (window.__FIXLGS_POE2_HOOK__) return;
  window.__FIXLGS_POE2_HOOK__ = true;

  const emitJson = (payload, source) => {
    try {
      window.postMessage({
        source: "FIXLGS_POE2_PAGE",
        type: "FIXLGS_TRADE_JSON",
        payload,
        transport: source,
      }, "*");
    } catch (_) {}
  };

  const maybeParseText = (text, source) => {
    if (!text || typeof text !== "string") return;
    const trimmed = text.trim();
    if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return;
    try { emitJson(JSON.parse(trimmed), source); } catch (_) {}
  };

  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    try {
      const clone = response.clone();
      clone.text().then(text => maybeParseText(text, "fetch")).catch(() => {});
    } catch (_) {}
    return response;
  };

  const OriginalXHR = window.XMLHttpRequest;
  if (OriginalXHR) {
    const open = OriginalXHR.prototype.open;
    const send = OriginalXHR.prototype.send;
    OriginalXHR.prototype.open = function(method, url, ...rest) {
      this.__fixlgsUrl = url;
      return open.call(this, method, url, ...rest);
    };
    OriginalXHR.prototype.send = function(...args) {
      this.addEventListener("load", function() {
        try {
          if (typeof this.responseText === "string") {
            maybeParseText(this.responseText, "xhr");
          }
        } catch (_) {}
      });
      return send.apply(this, args);
    };
  }
})();
