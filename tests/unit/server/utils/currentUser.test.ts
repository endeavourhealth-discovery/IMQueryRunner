import { userPreferencesSchema } from "~~/models/userPreferences.schema";
import { updateCurrentUserPreferences } from "~~/server/utils/currentUser";

import { beforeEach, describe, expect, it, vi } from "vitest";

const casdoor = vi.hoisted(() => ({ getCasdoorUser: vi.fn(), updateCasdoorUser: vi.fn() }));
vi.mock("~~/server/utils/casdoor", () => casdoor);

vi.stubGlobal("requireUserSession", async () => ({ user: { owner: "org", name: "jbloggs", id: "u1" } }));

const existing = {
  owner: "org",
  name: "jbloggs",
  id: "u1",
  type: "normal-user",
  email: "j@example.org",
  roles: [{ name: "EXECUTOR" }],
  // namespaces are authorisation data stored beside the preferences and must survive every save untouched
  properties: {
    theme: "Aura",
    darkMode: "false",
    fontSize: "14px",
    favourites: '["x"]',
    namespaces: '[{"iri":"http://endhealth.info/im#","read":true,"write":false}]',
    other: "keep"
  }
};

describe("updateCurrentUserPreferences", () => {
  beforeEach(() => {
    casdoor.getCasdoorUser.mockReset().mockResolvedValue(structuredClone(existing));
    casdoor.updateCasdoorUser.mockReset().mockResolvedValue(undefined);
  });

  it("reads Casdoor once and writes once, changing only the fields given", async () => {
    await updateCurrentUserPreferences({} as any, { darkMode: true });

    expect(casdoor.getCasdoorUser).toHaveBeenCalledTimes(1);
    expect(casdoor.updateCasdoorUser).toHaveBeenCalledTimes(1);
    const written = casdoor.updateCasdoorUser.mock.calls[0]![0];
    expect(written.properties).toMatchObject({ darkMode: "true", theme: "Aura", fontSize: "14px", favourites: '["x"]' });
  });

  it("keeps properties it does not own, including namespaces", async () => {
    await updateCurrentUserPreferences({} as any, { theme: "Lara" });
    const written = casdoor.updateCasdoorUser.mock.calls[0]![0];
    expect(written.properties.other).toBe("keep");
    expect(written.properties.namespaces).toBe(existing.properties.namespaces);
    expect(written.roles).toEqual(existing.roles);
  });

  it("returns the updated user", async () => {
    const result = await updateCurrentUserPreferences({} as any, { favourites: ["a", "b"] });
    expect(result.favourites).toEqual(["a", "b"]);
  });

  it("ignores fields passed as undefined", async () => {
    await updateCurrentUserPreferences({} as any, { theme: undefined, darkMode: true });
    expect(casdoor.updateCasdoorUser.mock.calls[0]![0].properties.theme).toBe("Aura");
  });
});

describe("userPreferencesSchema", () => {
  it("accepts any subset", () => {
    expect(userPreferencesSchema.safeParse({ darkMode: true }).success).toBe(true);
    expect(userPreferencesSchema.safeParse({ favourites: ["a"], darkMode: false }).success).toBe(true);
  });

  it("rejects an empty update", () => {
    expect(userPreferencesSchema.safeParse({}).success).toBe(false);
  });

  it.each(["roles", "namespaces", "organisations", "id", "username"])("rejects %s, which must not be user-settable", field => {
    expect(userPreferencesSchema.safeParse({ darkMode: true, [field]: [] }).success).toBe(false);
  });

  it("rejects values of the wrong type", () => {
    expect(userPreferencesSchema.safeParse({ darkMode: "yes" }).success).toBe(false);
  });
});
