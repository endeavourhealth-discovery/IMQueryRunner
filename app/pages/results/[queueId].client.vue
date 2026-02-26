<template>
  <QueryResults :jobId="route.params.queueId" />
</template>

<script setup lang="ts">
import QueryResults from "~/components/queryRunner/QueryResults.vue";

const route = useRoute();
</script>

<style scoped></style>
