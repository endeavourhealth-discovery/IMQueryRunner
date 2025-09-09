<template>
  <div
    class="h-[3.5rem] flex flex-row flex-nowrap justify-start items-center border-b border-solid border-(--p-content-border-color)"
  >
    <div
      id="header-start"
      class="h-full flex-initial flex flex-row justify-center items-center"
    >
      <img
        class="cursor-pointer w-[2.25rem] ml-[0.5rem] mr-[0.5rem]"
        src="/Logo-object-empty.png"
        alt="IM logo"
        v-on:click="toLandingPage"
      />
     <span>USER: [{{ currentUser?.name }}]</span>
    </div>
    <div
      id="header-content"
      class="h-full flex-grow-1 flex-shrink-1 flex-auto flex flex-row justify-center items-center"
    >
      <slot name="content" />
    </div>
    <div
      id="header-end"
      class="h-full flex-grow-0 flex-shrink-1 flex-auto flex flex-row items-center justify-self-end justify-end gap-[0.25rem]"
    ></div>
  </div>
</template>

<script setup lang="ts">
  const userStore = useUserStore();
  const { currentUser } = storeToRefs(userStore);
</script>

<style scoped></style>
