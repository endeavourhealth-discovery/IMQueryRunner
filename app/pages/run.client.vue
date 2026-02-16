<template>
  <div>
    <div class="flex gap-2 m-2">
      <div class="m-2">
        <Button
          icon="fa-solid fa-arrow-left"
          label="Back to queue"
          severity="secondary"
          @click="backToQueue"
        />
      </div>
    </div>
    <div class="m-2">
      <span class="m-2">Find a query:</span>
      <AutocompleteSearchBar
        v-model:selected="selected"
        :im-query="request"
        :search-placeholder="'Search queries'"
      />
    </div>
    <div class="m-2">
      <Button
        icon="fa-solid fa-play"
        label="Add to queue"
        :disabled="selected === undefined"
        @click="showDialog = true"
      />
    </div>
    <div class="m-2"><Button icon="fa-solid fa-play" label="Add to queue" :disabled="selected === undefined" @click="showDialog = true" /></div>
    <Dialog v-model:visible="showDialog" :closable="false" modal>
      Run query <span class="font-bold">{{selected?.name}}</span>?
      <template #footer>
        <Button class="m-1" label="Cancel" variant="outlined" @click="showDialog = false" autofocus />
        <Button class="m-1" label="Select" @click="runQuery" autofocus />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import AutocompleteSearchBar from "~/components/queryRunner/AutocompleteSearchBar.vue";
import type { SearchResultSummary } from "~~/models/AutoGen";

const selected: Ref<SearchResultSummary | undefined> = ref();
const request: any = {
  query: {
    where: {
      and: [
        {
          iri: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
          is: [
            {
              iri: "http://endhealth.info/im#Query",
            },
          ],
        },
      ],
    },
  },
};

const showDialog = ref(false);

async function runQuery() {
  await $fetch("/api/queue/job/add", {
    method: "post",
    body: {
      query: {
        iri: selected.value?.iri,
      },
    },
  });
  showDialog.value = false;
  backToQueue();
}

function backToQueue() {
  navigateTo("/QueryRunner");
}
</script>

<style scoped></style>
