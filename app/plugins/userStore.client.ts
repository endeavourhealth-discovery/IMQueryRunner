import { useUserStore } from "@endeavour/vue-library";

export default defineNuxtPlugin(() => {
  const userStore = useUserStore(usePinia());
  userStore.loadFromStorage();
});
