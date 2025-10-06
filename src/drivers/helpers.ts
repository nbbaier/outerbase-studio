import type { SavedConnectionRawLocalStorage } from "@/app/(theme)/connect/saved-connection-storage";
import { CloudflareD1Queryable } from "./database/cloudflare-d1";
import CloudflareWAEDriver from "./database/cloudflare-wae";
import { RqliteQueryable } from "./database/rqlite";
import { StarbaseQuery } from "./database/starbasedb";
import TursoDriver from "./database/turso";
import { ValtownQueryable } from "./database/valtown";
import { SqliteLikeBaseDriver } from "./sqlite-base-driver";

export function createLocalDriver(conn: SavedConnectionRawLocalStorage) {
  if (conn.driver === "rqlite") {
    if (!conn.url) throw new Error("RQLite URL is required");
    return new SqliteLikeBaseDriver(
      new RqliteQueryable(conn.url, conn.username, conn.password),
    );
  } else if (conn.driver === "valtown") {
    if (!conn.token) throw new Error("Valtown token is required");
    return new SqliteLikeBaseDriver(new ValtownQueryable(conn.token));
  } else if (conn.driver === "cloudflare-d1") {
    return new SqliteLikeBaseDriver(
      new CloudflareD1Queryable("/proxy/d1", {
        Authorization: `Bearer ${conn.token}`,
        "x-account-id": conn.username ?? "",
        "x-database-id": conn.database ?? "",
      }),
    );
  } else if (conn.driver === "starbase") {
    if (!conn.url || !conn.token) {
      throw new Error("Starbase URL and token are required");
    }
    return new SqliteLikeBaseDriver(new StarbaseQuery(conn.url, conn.token));
  } else if (conn.driver === "cloudflare-wae") {
    if (!conn.username || !conn.token) {
      throw new Error("Cloudflare WAE username and token are required");
    }
    return new CloudflareWAEDriver(conn.username, conn.token);
  }

  if (!conn.url || !conn.token) {
    throw new Error("Turso URL and token are required");
  }
  return new TursoDriver(conn.url, conn.token, true);
}
