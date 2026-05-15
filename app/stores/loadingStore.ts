import { ref } from "vue";

import { localStorageWithExpiry } from "@endeavour/vue-library";

import { defineStore } from "pinia";

export const useLoadingStore = defineStore("loading", () => {
  const routerLoading = ref<boolean>(true);
  const initialLoadComplete = ref<boolean>(false);

  function updateRouterLoading(bool: boolean) {
    routerLoading.value = bool;
  }

  function updateInitialLoadComplete(bool: boolean) {
    initialLoadComplete.value = bool;
  }

  return {
    routerLoading,
    initialLoadComplete,
    updateRouterLoading,
    updateInitialLoadComplete
  };
});
