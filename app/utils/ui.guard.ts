class UIGuard {
  public async checkPermission(object: string, action: string) {
    return useFetch("/api/public/auth/hasPermission", {
      method: "POST",
      body: {
        object: object,
        action: action
      }
    });
  }
}

export const uiGuard = new UIGuard();
