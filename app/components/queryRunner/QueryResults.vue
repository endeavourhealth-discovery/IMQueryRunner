<template>
  <Dialog
    v-model:visible="showDialog"
    modal
    maximizable
    header="Query Results"
    :style="{
      width: '90vw',
      height: '90vh',
      minWidth: '90vw',
      minHeight: '90vh',
    }"
    class="query-results-dialog"
  >
    <div class="query-results-dialog-content">
      <DataTable
        :value="queryResults"
        :paginator="true"
        :rows="size"
        :scrollable="true"
        scroll-height="flex"
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
        <Column field="id" header="Patient ID"></Column>
      </DataTable>
    </div>
    <template #footer>
      <div class="im-dialog-footer">
        <div class="button-footer">
          <Button label="Close" @click="closeDialog" text />
          <Button
            :disabled="!queryItem"
            data-testid="query-results-download"
            label="Download"
            :loading="downloadLoading"
            @click="downloadQueryResults()"
            autofocus
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import type { QueueItem } from "@@/models";
import { cloneDeep, isArray } from "lodash-es";
import { onMounted, ref, watch } from "vue";
import type { Ref } from "vue";

interface Props {
  queryItem: QueueItem | undefined;
}

const props = defineProps<Props>();

const showDialog = defineModel<boolean>("showDialog");

const loading = ref(false);
const downloadLoading = ref(false);
const queryResults: Ref<{ id: string }[]> = ref([]);
const pageNumber = ref(1);
const size = ref(25);
const originalSize = ref(25);
const totalCount = ref();

function closeDialog() {
  showDialog.value = false;
}

async function downloadQueryResults() {
  if (props.queryItem?.queryRequest) {
    const request = cloneDeep(props.queryItem.queryRequest);
    // request.page = { pageNumber: pageNumber.value, pageSize: size.value }; //TODO: fix paging mechanism
    const results = useFetch("/api/query/results", {
      method: "get",
      body: request,
    });
    if (results.data.value && isArray(results.data.value)) {
      totalCount.value = results.data.value.length; //TODO: replace with actual count
      queryResults.value = results.data.value.map((id) => ({ id }));
    }
  }
}

async function onPage(event: any) {
  pageNumber.value = event.page;
  size.value = event.rows;
  await downloadQueryResults();
}

watch(showDialog, async (newValue, oldValue) => {
  if (newValue && totalCount.value === undefined) await downloadQueryResults();
});

onMounted(async () => {
  await downloadQueryResults();
});
</script>

<style scoped></style>
