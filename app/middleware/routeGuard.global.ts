import { ErrorCode } from "~~/enums";

import { hasAnyRole } from "@endeavour/vue-library/models";
import { useUserStore } from "@endeavour/vue-library/stores";

import { isArray } from "lodash-es";

export default defineNuxtRouteMiddleware(async to => {
  const { requiresAuth, requiresRole } = to.meta;
  const userStore = useUserStore(usePinia());

  if (requiresAuth || (isArray(requiresRole) && requiresRole.length > 0)) {
    if (!userStore.isLoggedIn) {
      const { load, login } = useAuth();
      if (!(await load())) return login(to.fullPath);
    }

    if (!hasAnyRole(userStore.currentUser!, requiresRole as string[])) {
      throw createError({
        status: 403,
        statusText: ErrorCode.AuthorisationError,
        message: "The page or resource you were trying to reach is forbidden. Please contact an admin to request access to this resource.",
        data: { requiredRole: requiresRole }
      });
    }
  }
});
