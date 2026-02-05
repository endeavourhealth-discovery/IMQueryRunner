<template>
  <div class="flex-auto overflow-auto">
    <div class="h-[calc(100% - 3.5rem)] overflow-auto">
      <div
          class="flex h-full flex-auto flex-col flex-nowrap overflow-auto bg-(--p-content-background)"
      >
        <div class="m-2"><Button icon="fa-solid fa-arrow-left" label="Back to queue" @click="backToQueue" /></div>
      <DataTable
        :size="'small'"
        :value="queryResults"
        :paginator="true"
        :rows="size"
        :scrollable="true"
        scroll-height="600px"
        :autoLayout="true"
        @page="onPage($event)"
        :lazy="true"
        :total-records="totalCount"
        :rows-per-page-options="[
          originalSize,
          originalSize * 2,
          originalSize * 4,
          originalSize * 8,
        ]"
        :loading="loading"
        :paginatorTemplate="'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown'"
      >
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xl font-bold"
              >Total results: {{ totalCount }}</span
            >
          </div>
        </template>
        <template #empty>None</template>
        <Column v-for="col of columns" :key="col.field" :field="col.field" :header="col.header"></Column>
      </DataTable>
    </div>
      <div class="im-dialog-footer">
        <div class="button-footer">
          <Button
              class="m-2"
            :disabled="!queryResults.length"
            data-testid="query-results-download"
            label="Download"
            :loading="downloadLoading"
            @click="downloadQueryResults()"
            autofocus
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isArray } from "lodash-es";
import { onMounted, ref } from "vue";
import type { Ref } from "vue";

interface Props {
  queryId: string | string[] | undefined;
}

const props = defineProps<Props>();

const loading = ref(false);
const downloadLoading = ref(false);
const queryResults: Ref<any[]> = ref([]);
const pageNumber = ref(1);
const size = ref(25);
const originalSize = ref(25);
const totalCount = ref();
const columns: Ref<any[]> = ref( []);

onMounted(async () => {
  await getQueryResults();
  formatResultsForTable();
});

async function getQueryResults() {
  if (props.queryId) {
    // request.page = { pageNumber: pageNumber.value, pageSize: size.value }; //TODO: fix paging mechanism
    const results = await useFetch(`/api/queue/query/results/hashcode/${props.queryId}`);
    if (results.data.value && isArray(results.data.value)) {
      totalCount.value = results.data.value.length; //TODO: replace with actual count
      queryResults.value = results.data.value;
    }
  }
}

function formatResultsForTable() {
    for (const key of Object.keys(queryResults.value[0])) {
      if (key !== "hashcode") columns.value.push({field: key, header: key.replace("_", " ")})
    }
}

function downloadQueryResults() {

}

async function onPage(event: any) {
  pageNumber.value = event.page;
  size.value = event.rows;
  await getQueryResults();
}

function backToQueue() {
  navigateTo("/");
}
</script>

<style scoped></style>
