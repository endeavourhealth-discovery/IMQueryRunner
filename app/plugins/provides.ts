import UserService from "~/services/UserService";

import { injectionKeysVueLibrary } from "@endeavour/vue-library";

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.provide(injectionKeysVueLibrary.userService, UserService);
});
