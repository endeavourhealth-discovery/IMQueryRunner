import { useUserStore } from "@endeavour/vue-library/stores";

export default defineNuxtPlugin(() => {
  const userStore = useUserStore(usePinia());
  userStore.loadFromStorage();
});
