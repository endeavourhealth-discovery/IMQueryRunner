import { useAuth } from "~/composables/useAuth";
class UIGuard {
  public async checkPermission(object: string, action: string) {
    return await useAuth().hasPermission(object, action);
  }
}

export const uiGuard = new UIGuard();
