<template>
  <div>
    <div class="flex gap-2 m-2">
      <div class="m-2">
        <Button icon="fa-solid fa-arrow-left" label="Back to queue" severity="secondary" @click="backToQueue"/>
      </div>
    </div>
    <div class="m-2">
      <span class="m-2">Find a query:</span>
      <AutocompleteSearchBar v-model:selected="selected" :im-query="request" :search-placeholder="'Search queries'"/>
    </div>
    <div>
      <ArgumentDisplay v-if="selected && args?.length"
                       :arguments="args"
                       :showFooterButtons="false"
                       :editArguments="true"
                       @hide-dialog="showDialog = false"
                       @arguments-completed="passArguments"
      />
    </div>
    <div class="m-2">
      <Button icon="fa-solid fa-play" label="Add to queue" :disabled="selected === undefined"
              @click="showDialog = true"/>
    </div>
    <Dialog v-model:visible="showDialog" :closable="false" modal>
      Run query <span class="font-bold">{{ selected?.name }}</span>?
      <template #footer>
        <Button class="m-1" label="Cancel" variant="outlined" @click="showDialog = false" autofocus/>
        <Button class="m-1" label="Select" @click="runQuery" autofocus/>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import AutocompleteSearchBar from "~/components/queryRunner/AutocompleteSearchBar.vue";
import {
  type Argument,
  type ArgumentReference,
  type QueryRequest,
  type SearchResultSummary,
} from "~~/models/AutoGen";
import {watch} from "vue";
import {cloneDeep} from "lodash-es";
import ArgumentDisplay from "~/components/queryRunner/ArgumentDisplay.vue";

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
const missingArgs = ref(true);

const imapi = useIMAPI();

watch(
  selected,
  (newValue, oldValue) => {
    if (newValue !== oldValue && newValue) {
      args.value = [];
      getArguments();
    }
  },
  {deep: true}
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
  {deep: true}
);

function passArguments(args: Argument[], runOnConfirm: boolean) {
  completedArguments.value = args;
  missingArgs.value = !runOnConfirm;
}

async function runQuery() {
  await $fetch("/api/queue/job/add", {
    method: "post",
    body: {
      query: {
        iri: selected.value?.iri,
      },
      argument: completedArguments.value
    } as QueryRequest,
  });
  showDialog.value = false;
  backToQueue();
}

async function getArguments() {
  const query = await imapi.getQueryFromIri(selected.value!.iri);
  query.iri = selected.value!.iri;
  args.value = await imapi.findRequestMissingArguments({query: query} as QueryRequest);
  missingArgs.value = !!args.value.length;
}

function backToQueue() {
  navigateTo("/QueryRunner");
}
</script>

<style scoped></style>
