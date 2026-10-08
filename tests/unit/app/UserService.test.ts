import UserService from "~~/app/services/UserService";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
vi.stubGlobal("$fetch", fetchMock);

const user = { id: "u1", theme: "aura" };

describe("UserService preference saving", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset().mockResolvedValue(user);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends changes made together as one merged PATCH and gives every caller the result", async () => {
    const results = [UserService.updateUserPreset("lara" as any), UserService.updateUserPrimaryColor("blue" as any), UserService.updateUserDarkMode(true)];

    expect(fetchMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(300);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "api/user/preferences",
      expect.objectContaining({ method: "PATCH", body: { theme: "lara", primaryColor: "blue", darkMode: true } })
    );
    expect(await Promise.all(results)).toEqual([user, user, user]);
  });

  it("lets a later change to the same setting win", async () => {
    void UserService.updateUserDarkMode(true);
    const last = UserService.updateUserDarkMode(false);
    await vi.advanceTimersByTimeAsync(300);
    await last;
    expect(fetchMock.mock.calls[0]![1].body).toEqual({ darkMode: false });
  });

  it("waits for a quiet moment: each new change restarts the delay", async () => {
    void UserService.updateUserFavourites(["a"]);
    await vi.advanceTimersByTimeAsync(200);
    void UserService.updateUserFavourites(["a", "b"]);
    await vi.advanceTimersByTimeAsync(200);
    expect(fetchMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(100);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]![1].body).toEqual({ favourites: ["a", "b"] });
  });

  it("rejects every waiting caller when the save fails, and starts clean afterwards", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    const first = UserService.updateUserDarkMode(true);
    const second = UserService.updateUserFontSize("14px");
    const failures = Promise.allSettled([first, second]);
    await vi.advanceTimersByTimeAsync(300);
    expect((await failures).map(r => r.status)).toEqual(["rejected", "rejected"]);

    const retry = UserService.updateUserPreset("lara" as any);
    await vi.advanceTimersByTimeAsync(300);
    await retry;
    // The failed batch is not resent along with the new change
    expect(fetchMock.mock.calls[1]![1].body).toEqual({ theme: "lara" });
  });

  it("keeps organisations and namespaces on their own endpoints", async () => {
    await UserService.updateUserOrganisations(["org"]);
    expect(fetchMock).toHaveBeenCalledWith("api/user/organisations", expect.objectContaining({ method: "POST", body: ["org"] }));
  });
});
