<template>
  <div>
    <div class="flex gap-2 m-2">
      <div class="m-2">
        <Button icon="fa-solid fa-arrow-left" label="Back to queue" severity="secondary" @click="backToQueue" />
      </div>
    </div>
    <div class="m-2">
      <span class="m-2">Find a query:</span>
      <AutocompleteSearchBar v-model:selected="selected" :im-query="request" :search-placeholder="'Search queries'" />
    </div>
    <div>
      <ArgumentDisplay
        v-if="selected && args?.length"
        :arguments="args"
        :showFooterButtons="false"
        :editArguments="true"
        @hide-dialog="showDialog = false"
        @arguments-completed="passArguments"
      />
    </div>
    <div class="m-2">
      <Button icon="fa-solid fa-play" label="Add to queue" :disabled="selected === undefined" @click="showDialog = true" />
    </div>
    <Dialog v-model:visible="showDialog" :closable="false" modal>
      Run query <span class="font-bold">{{ selected?.name }}</span
      >?
      <template #footer>
        <Button class="m-1" label="Cancel" variant="outlined" @click="showDialog = false" autofocus />
        <Button class="m-1" label="Select" @click="runQuery" autofocus />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import ArgumentDisplay from "~/components/queryRunner/ArgumentDisplay.vue";
import AutocompleteSearchBar from "~/components/queryRunner/AutocompleteSearchBar.vue";
import QueryService from "~/services/QueryService";
import type { JobRequest } from "~~/models";

import { watch } from "vue";

import { IM, RDF } from "@endeavour/vue-library";
import { type Argument, type ArgumentReference, type QueryRequest, type SearchResultSummary } from "@endeavour/vue-library/interfaces";

import { cloneDeep } from "lodash-es";

interface ArgumentSelection extends ArgumentReference {
  valueData?: any;
}

const selected: Ref<SearchResultSummary | undefined> = ref();
const args: Ref<ArgumentSelection[] | undefined> = ref([]);
const completedArguments: Ref<Argument[]> = ref([]);
const request: any = {
  query: {
    where: {
      and: [
        {
          iri: RDF.TYPE,
          is: [
            {
              iri: IM.QUERY
            },
            {
              iri: IM.INDICATOR
            }
          ]
        }
      ]
    }
  }
};

const showDialog = ref(false);
const missingArgs = ref(true);

watch(
  selected,
  (newValue, oldValue) => {
    if (newValue !== oldValue && newValue) {
      args.value = [];
      const index = selected.value?.type.findIndex(tp => tp.iri === IM.INDICATOR);
      if (index === -1) {
        getArguments();
      }
    }
  },
  { deep: true }
);

watch(
  () => cloneDeep(completedArguments.value),
  (newValue, oldValue) => {
    if (newValue !== oldValue) {
      if (completedArguments.value && completedArguments.value.length) {
        for (const arg of completedArguments.value) {
          missingArgs.value = !arg.valueData;
        }
      }
    }
  },
  { deep: true }
);

function passArguments(args: Argument[], runOnConfirm: boolean) {
  completedArguments.value = args;
  missingArgs.value = !runOnConfirm;
}

async function runQuery() {
  const jobRequest = {
    queryRequests: [
      {
        query: {
          iri: selected.value?.iri
        },
        argument: completedArguments.value
      }
    ]
  } as JobRequest;
  console.log("Running query with arguments:", jobRequest);

  await $fetch("/api/queue/job/add", {
    method: "post",
    body: jobRequest
  });
  showDialog.value = false;
  backToQueue();
}

async function getArguments() {
  const query = await QueryService.getQueryFromIri(selected.value!.iri);
  query.iri = selected.value!.iri;
  args.value = await QueryService.findMissingArguments({
    query: query
  } as QueryRequest);
  args.value = [
    { parameter: "$organisationId" } as ArgumentSelection,
    { parameter: "$patientId" } as ArgumentSelection,
    { parameter: "$debugPatientId" } as ArgumentSelection,
    { parameter: "$searchDate" } as ArgumentSelection
  ];
  missingArgs.value = !!args.value.length;
}

function backToQueue() {
  navigateTo("/QueryRunner");
}
</script>

<style scoped></style>
