<template>
  <div class="flex-auto overflow-auto">
    <div class="h-[calc(100% - 3.5rem)] overflow-auto">
      <div class="flex h-full flex-auto flex-col flex-nowrap overflow-auto bg-(--p-content-background)">
        <div class="m-2">
          <Button icon="fa-solid fa-arrow-left" label="Back to queue" @click="backToQueue" />
        </div>
        <div v-if="executedSql" class="m-2">
          <Panel header="Executed SQL" :toggleable="true" :collapsed="true">
            <div class="relative">
              <pre class="cursor-pointer overflow-auto rounded bg-gray-900 p-4 text-sm text-green-400" title="Click to copy" @click="copyToClipboard">{{
                executedSql
              }}</pre>
              <span v-if="copied" class="absolute right-2 top-2 rounded bg-green-600 px-2 py-1 text-xs text-white">Copied!</span>
            </div>
          </Panel>
        </div>
        <DataTable
          ref="dt"
          :size="'small'"
          :value="queryResults"
          :paginator="true"
          :rows="rows"
          :scrollable="true"
          scroll-height="600px"
          :autoLayout="true"
          @page="onPage($event)"
          :lazy="true"
          :total-records="totalCount"
          :rows-per-page-options="[originalSize, originalSize * 2, originalSize * 4, originalSize * 8]"
          :loading="loading"
          :paginatorTemplate="'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown'"
        >
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xl font-bold">Total results: {{ totalCount }}</span>
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
import type { Ref } from "vue";
import { onMounted, ref } from "vue";

import { useUserStore } from "@endeavour/vue-library/stores";

import { isArray } from "lodash-es";

interface Props {
  jobId: string | string[] | undefined;
  queryIri: string | string[] | undefined;
  queryType: string | string[] | undefined;
}

const props = defineProps<Props>();
const { currentUser } = useUserStore();

const loading = ref(false);
const downloadLoading = ref(false);
const queryResults: Ref<any[]> = ref([]);
const totalResults: Ref<any[]> = ref([]);
const page = ref(1);
const rows = ref(25);
const originalSize = ref(25);
const totalCount = ref();
const columns: Ref<any[]> = ref([]);
const executedSql = ref<string | null>(null);

onMounted(async () => {
  await Promise.all([getQueryResults(), getExecutedSql()]);
  formatResultsForTable();
});

async function getQueryResults() {
  if (props.jobId && props.queryIri && props.queryType) {
    const value = await $fetch<{ totalCount: number; result: any[] }>(
      `/api/queue/job/results/${props.jobId}/${props.queryType}/${encodeURIComponent(props.queryIri as string)}`,
      {
        query: {
          userId: currentUser?.id,
          page: page.value,
          size: rows.value
        }
      }
    );
    if (value && isArray(value.result)) {
      totalCount.value = value.totalCount;
      queryResults.value = value.result;
    }
  }
}

async function getTotalQueryResults() {
  if (props.jobId) {
    const value = await $fetch<{ result: any[] }>(`/api/queue/job/results/total/${props.jobId}`, {
      query: {
        userId: currentUser?.id
      }
    });
    if (value && isArray(value.result)) {
      totalResults.value = value.result;
    }
  }
}

function formatResultsForTable() {
  for (const key of Object.keys(queryResults.value[0])) {
    if (key !== "hashcode") columns.value.push({ field: key, header: key.replace("_", " ") });
  }
}

async function downloadQueryResults() {
  await getTotalQueryResults();

  const headers = Object.keys(totalResults.value[0]);
  const csv = [
    headers.join(","),
    ...totalResults.value.map(row =>
      headers
        .map(field => {
          const value = row[field] ?? "";
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(",")
    )
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", props.jobId!.toString());
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function onPage(event: any) {
  page.value = ++event.page;
  rows.value = event.rows;
  await getQueryResults();
}

function backToQueue() {
  navigateTo("/");
}

async function getExecutedSql() {
  if (props.jobId && props.queryIri) {
    const value = await $fetch<{ executedSQL: string | null }>(
      `/api/queue/job/sql/${props.jobId}/${props.queryType}/${encodeURIComponent(props.queryIri as string)}`
    );
    if (value?.executedSQL) {
      executedSql.value = value.executedSQL;
    }
  }
}

const copied = ref(false);

async function copyToClipboard() {
  if (!executedSql.value) return;
  await navigator.clipboard.writeText(executedSql.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}
</script>

<style scoped></style>
