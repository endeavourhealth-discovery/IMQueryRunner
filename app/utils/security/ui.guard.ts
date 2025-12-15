import { AuthService } from "~/services";
class UIGuard {
  public async checkPermission(object: string, action: string) {
    return await AuthService.hasPermission(object, action);
  }
}

export const uiGuard = new UIGuard();
