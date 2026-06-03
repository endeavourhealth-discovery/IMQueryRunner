<template>
  <div id="server-offline-container" class="flex w-full flex-[1_0_auto] flex-col flex-nowrap justify-center items-center">
    <IMFontAwesomeIcon icon="fa-solid fa-bolt-lightning" size="10x" />
    <IMFontAwesomeIcon icon="fa-solid fa-robot" class="error-icon" size="10x" />
    <h1 class="error-code">500</h1>
    <h2 class="error-header">Unhandled error</h2>
    <p class="error-text">
      <span>An unexpected error has occurred.</span> <br />
      <span>Please check the console for details on this error.</span>
    </p>
    <div class="button-container">
      <Button label="Back" @click="goBack" icon="fa-solid fa-arrow-left" />
      <Button label="Home" @click="goHome" icon="fa-solid fa-home" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { IMFontAwesomeIcon } from "@endeavour/vue-library/components";

import { useRouter } from "vue-router";

const router = useRouter();

async function goBack() {
  await router.go(-1);
}

async function goHome() {
  await router.push("/");
}
</script>

<style scoped>
.error-icon {
  color: var(--p-red-500);
}

.error-code {
  color: var(--p-text-color);
  font-size: 6rem;
  margin: 1.5rem 0 0.5rem 0;
}

.error-header {
  color: var(--p-text-color);
  margin: 0.5rem;
}

.button-container {
  display: flex;
  flex-flow: row;
  gap: 1rem;
}
</style>
