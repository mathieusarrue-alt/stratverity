// Expected optional application binding, not evidence it exists in a deployment.
// getDb() must still refuse an absent DB. No account/database IDs belong here.
declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
  }
}
