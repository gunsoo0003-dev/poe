// V004: Fetch the SAME listing from the English official PoE2 endpoint.
// Never translate guessed text, never send the user's account cookies to a third party.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.type !== "FIXLGS_ENGLISH_LISTING") return;
  const listingId = String(request.id || "");
  const searchId = String(request.query || "");
  if (!listingId) { sendResponse({ok:false,error:"LISTING_ID_MISSING"}); return; }
  if (!searchId) { sendResponse({ok:false,error:"SEARCH_ID_MISSING"}); return; }
  // ID shape and length may differ across regional services. URI-encode both
  // parameters rather than assuming a particular ID length.
  if (listingId.length > 500 || searchId.length > 500 || /[\s/#?]/.test(listingId + searchId)) {
    sendResponse({ok:false,error:"INVALID_ID_FORMAT"});return;
  }
  (async () => {
    const url=`https://www.pathofexile.com/api/trade2/fetch/${encodeURIComponent(listingId)}?query=${encodeURIComponent(searchId)}`;
    const response=await fetch(url,{headers:{"Accept":"application/json","Accept-Language":"en-US,en;q=0.9"},credentials:"include"});
    if(!response.ok) throw Error(`ENGLISH_API_HTTP_${response.status}`);
    const payload=await response.json();
    const entry=(payload.result||[]).find(row=>String(row.id)===listingId);
    if(!entry?.item) throw Error("ENGLISH_LISTING_NOT_FOUND");
    sendResponse({ok:true,entry});
  })().catch(error=>sendResponse({ok:false,error:String(error.message||error)}));
  return true;
});
