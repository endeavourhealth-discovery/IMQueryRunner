<template>
  <div>
    <div class="m-2">
      Find a query:
      <AutocompleteSearchBar v-model:selected="selected" :im-query="request" :search-placeholder="'Search queries'" />
    </div>
      {{selected?.name}}
  <div>DISPLAY</div>

  <div class="m-2"><Button icon="fa-solid fa-play" label="Add to queue" /></div>
  </div>
</template>

<script setup lang="ts">

import AutocompleteSearchBar from "~/components/queryRunner/AutocompleteSearchBar.vue";
import type {SearchResultSummary} from "~~/models/AutoGen";
import { imapi } from "~~/server/utils/imapi";

const tree: Ref<any> = ref([]);
const selected: Ref<SearchResultSummary | undefined> = ref();
const request: any = {
  "query": {
    "where": {
      "and": [
        {
          "iri": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
          "is": [
            {
              "iri": "http://endhealth.info/im#Query"
            }
          ]
        }
      ]
    }
  }
}

</script>

<style scoped>

</style>