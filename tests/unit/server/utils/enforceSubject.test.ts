import { toEnforceSubject } from "~/server/utils/enforceSubject";

import type { User } from "@endeavour/vue-library/models";

import { describe, expect, it } from "vitest";

const user = {
  id: "u1",
  username: "jbloggs",
  password: "secret",
  roles: ["EXECUTOR"],
  namespaces: [{ iri: "http://endhealth.info/im#", read: true, write: false }],
  displayName: "Joe Bloggs"
} as unknown as User;

describe("toEnforceSubject", () => {
  it("capitalises top-level keys so Casdoor can build exported struct fields", () => {
    const subject = toEnforceSubject(user);
    expect(subject).toMatchObject({ Id: "u1", Username: "jbloggs", Roles: ["EXECUTOR"], DisplayName: "Joe Bloggs" });
    expect(Object.keys(subject).every(key => key[0] === key[0]!.toUpperCase())).toBe(true);
  });

  it("never includes the password", () => {
    const subject = toEnforceSubject(user);
    expect(subject).not.toHaveProperty("Password");
    expect(subject).not.toHaveProperty("password");
  });

  it("leaves nested values untouched", () => {
    expect(toEnforceSubject(user).Namespaces).toEqual(user.namespaces);
  });
});
