import { mysqlDb } from "~~/server/db/mysql";
import { organization } from "~~/server/db/mysql/schema";

// The organisation list changes rarely and is the same for every user (the auth middleware has already run by the time this is reached).
// Served from cache for an hour, then refreshed in the background while the previous copy is still served.
export default defineCachedEventHandler(
  async () => {
    const rows = await mysqlDb
      .select({
        id: organization.id,
        odsCode: organization.odsCode,
        name: organization.name
      })
      .from(organization)
      .orderBy(organization.odsCode);

    return rows.map(row => ({
      id: row.id,
      odsCode: row.odsCode,
      name: row.name,
      label: `${row.name} - ${row.odsCode}`
    }));
  },
  { name: "organisations", getKey: () => "all", maxAge: 60 * 60, staleMaxAge: 60 * 60 * 24, swr: true }
);
