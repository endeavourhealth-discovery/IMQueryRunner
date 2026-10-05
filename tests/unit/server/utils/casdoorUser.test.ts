import { type CasdoorUser, fromCasdoorUser, toCasdoorProperties } from "~/server/utils/casdoorUser";

import { NAMESPACE } from "@endeavour/vue-library/enums";

import { describe, expect, it } from "vitest";

const baseUser: CasdoorUser = {
  owner: "Endeavour",
  name: "jbloggs",
  id: "11111111-2222-3333-4444-555555555555",
  type: "normal-user",
  displayName: "Joe Bloggs",
  email: "joe@example.com",
  avatar: "https://example.com/a.png",
  roles: [{ name: "EXECUTOR" }]
};

describe("fromCasdoorUser", () => {
  it("maps identity and roles", () => {
    const user = fromCasdoorUser(baseUser);
    expect(user).toMatchObject({ id: baseUser.id, username: "jbloggs", displayName: "Joe Bloggs", email: "joe@example.com", roles: ["EXECUTOR"] });
  });

  it("applies defaults when no properties are set", () => {
    const user = fromCasdoorUser({ ...baseUser, properties: null, roles: null });
    expect(user.roles).toEqual([]);
    expect(user.darkMode).toBe(false);
    expect(user.favourites).toEqual([]);
    expect(user.organisations).toEqual([NAMESPACE.IM]);
    expect(user.namespaces).toEqual([{ iri: NAMESPACE.IM, read: true, write: false }]);
  });

  it("decodes string-encoded properties", () => {
    const user = fromCasdoorUser({
      ...baseUser,
      properties: { darkMode: "true", favourites: JSON.stringify(["a", "b"]), namespaces: JSON.stringify([{ iri: NAMESPACE.IM, read: true, write: true }]) }
    });
    expect(user.darkMode).toBe(true);
    expect(user.favourites).toEqual(["a", "b"]);
    expect(user.namespaces).toEqual([{ iri: NAMESPACE.IM, read: true, write: true }]);
  });

  it("falls back to defaults for malformed JSON properties", () => {
    const user = fromCasdoorUser({ ...baseUser, properties: { favourites: "{not json" } });
    expect(user.favourites).toEqual([]);
  });

  it("drops an avatar that is not a valid URL", () => {
    expect(fromCasdoorUser({ ...baseUser, avatar: "/relative.png" }).avatar).toBe("");
  });
});

describe("toCasdoorProperties", () => {
  it("round-trips preferences through Casdoor properties", () => {
    const original = fromCasdoorUser({ ...baseUser, properties: { darkMode: "true", favourites: JSON.stringify(["a"]) } });
    const roundTripped = fromCasdoorUser({ ...baseUser, properties: toCasdoorProperties(original) });
    expect(roundTripped).toEqual(original);
  });

  it("keeps properties this app does not own", () => {
    const user = fromCasdoorUser(baseUser);
    expect(toCasdoorProperties(user, { somethingElse: "keep" }).somethingElse).toBe("keep");
  });
});
