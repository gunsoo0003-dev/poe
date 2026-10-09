// V004: Fetch the SAME listing from the English official PoE2 endpoint.
// Never translate guessed text, never send the user's account cookies to a third party.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.type !== "FIXLGS_ENGLISH_LISTING") return;
  const listingId = String(request.id || "");
  const searchId = String(request.query || "");
  if (!/^[a-zA-Z0-9_-]{8,150}$/.test(listingId) || !/^[a-zA-Z0-9_-]{5,100}$/.test(searchId)) {
    sendResponse({ok:false,error:"INVALID_LISTING_OR_QUERY_ID"});return;
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
