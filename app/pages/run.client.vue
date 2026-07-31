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
      <Button icon="fa-solid fa-plus" label="Add to queue" :disabled="selected === undefined" @click="addToQueue" />
    </div>
    <DataTable v-if="queuedQueries.length" class="m-2" :value="queuedQueries">
      <template #empty>None</template>
      <Column header="Query">
        <template #body="{ data }: { data: QueuedQuery }">{{ data.selected.name }}</template>
      </Column>
      <Column>
        <template #body="{ index }">
          <Button icon="fa-solid fa-trash" severity="danger" variant="outlined" @click="removeFromQueue(index)" />
        </template>
      </Column>
    </DataTable>
    <div class="m-2">
      <Button icon="fa-solid fa-play" label="Run queue" :disabled="!queuedQueries.length" @click="showDialog = true" />
    </div>
    <Dialog v-model:visible="showDialog" :closable="false" modal>
      Run <span class="font-bold">{{ jobName }}</span
      >?
      <template #footer>
        <Button class="m-1" label="Cancel" variant="outlined" @click="showDialog = false" autofocus />
        <Button class="m-1" label="Select" @click="runQueries" autofocus />
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
import { type Argument, type ArgumentReference, type QueryRequest, type SearchResultSummary } from "@endeavour/vue-library/models";

import { cloneDeep } from "lodash-es";

interface ArgumentSelection extends ArgumentReference {
  valueData?: any;
}

interface QueuedQuery {
  selected: SearchResultSummary;
  argument: Argument[];
}

const selected: Ref<SearchResultSummary | undefined> = ref();
const args: Ref<ArgumentSelection[] | undefined> = ref([]);
const completedArguments: Ref<Argument[]> = ref([]);
const queuedQueries: Ref<QueuedQuery[]> = ref([]);

const jobName = computed(() => {
  if (!queuedQueries.value.length) return "";
  const first = queuedQueries.value[0]!.selected.name;
  const others = queuedQueries.value.length - 1;
  if (!others) return first;
  return `${first} and ${others} other ${others === 1 ? "query" : "queries"}`;
});
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

function addToQueue() {
  if (!selected.value) return;
  queuedQueries.value.push({ selected: selected.value, argument: completedArguments.value });
  selected.value = undefined;
  args.value = [];
  completedArguments.value = [];
  missingArgs.value = true;
}

function removeFromQueue(index: number) {
  queuedQueries.value.splice(index, 1);
}

async function runQueries() {
  const jobRequest = {
    jobName: jobName.value,
    queryRequests: queuedQueries.value.map(queuedQuery => ({
      query: {
        iri: queuedQuery.selected.iri
      },
      argument: queuedQuery.argument
    }))
  } as JobRequest;

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
