// Explicit OpenNext configuration prevents Wrangler auto-migration on every deploy.
// No R2/paid cache binding is enabled; preserve the V235 no-extra-service model.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
