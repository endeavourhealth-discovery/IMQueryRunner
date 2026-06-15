import { mysqlDb } from "~~/server/db/mysql";
import { organization } from "~~/server/db/mysql/schema";

export default defineEventHandler(async () => {
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
});
