<template>
  <QueryResults :jobId="route.params.jobId" :queryType="route.params.queryType" :queryIri="route.params.queryIri" />
</template>

<script setup lang="ts">
import QueryResults from "~/components/queryRunner/QueryResults.vue";

const route = useRoute();
</script>

<style scoped></style>
