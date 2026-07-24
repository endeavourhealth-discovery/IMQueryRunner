<template>
  <div class="relative">
    <pre class="cursor-pointer overflow-auto rounded bg-gray-900 p-4 text-sm text-green-400" title="Click to copy" @click="copyToClipboard">{{
      props.sql
    }}</pre>
    <span v-if="copied" class="absolute right-2 top-2 rounded bg-green-600 px-2 py-1 text-xs text-white">Copied!</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  sql: string;
}

const props = defineProps<Props>();
const copied = ref(false);

async function copyToClipboard() {
  if (!props.sql) return;
  await navigator.clipboard.writeText(props.sql);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}
</script>

<style scoped></style>
