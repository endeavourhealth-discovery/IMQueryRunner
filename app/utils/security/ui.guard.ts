import { authService } from "~/services/authService";

class UIGuard {
  public async checkPermission(object: string, action: string) {
    return await authService.hasPermission(object, action);
  }
}

export const uiGuard = new UIGuard();
