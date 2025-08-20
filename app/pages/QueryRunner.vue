<template>
  <div class="h-screen w-screen overflow-auto">
    <div class="h-[calc(100% - 3.5rem)] overflow-auto">
      <div
        class="flex h-full flex-auto flex-col flex-nowrap overflow-auto bg-(--p-content-background)"
      >
        <div><Button label="Refresh" @click="refresh" /></div>
        <DataTable
          :value="queryQueueItems"
          :paginator="true"
          :rows="rows"
          :scrollable="true"
          scrollHeight="flex"
          :autoLayout="true"
          @page="onPage($event)"
          :lazy="true"
          :totalRecords="totalCount"
          :rows-per-page-options="[
            rowsOriginal,
            rowsOriginal * 2,
            rowsOriginal * 4,
            rowsOriginal * 8,
          ]"
          :loading="searchLoading"
          :paginatorTemplate="'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown'"
        >
          <template #empty>None</template>
          <Column field="id" header="ID"></Column>
          <Column field="queryIri" header="Iri"></Column>
          <Column field="queryName" header="Query name"></Column>
          <Column field="userName" header="User"></Column>
          <Column field="queuedAt" header="Queued at">
            <template #body="slotProps">
              <span>{{
                slotProps.data.queuedAt ? slotProps.data.queuedAt : "-"
              }}</span>
            </template>
          </Column>
          <Column field="startedAt" header="Started at">
            <template #body="slotProps">
              <span>{{
                slotProps.data.startedAt ? slotProps.data.startedAt : "-"
              }}</span>
            </template>
          </Column>
          <Column field="finishedAt" header="Finished at">
            <template #body="slotProps">
              <span>{{
                slotProps.data.finishedAt ? slotProps.data.finishedAt : "-"
              }}</span>
            </template>
          </Column>
          <Column field="killedAt" header="Killed at">
            <template #body="slotProps">
              <span>{{
                slotProps.data.killedAt ? slotProps.data.killedAt : "-"
              }}</span>
            </template>
          </Column>
          <Column field="status" header="Status">
            <template #body="slotProps">
              <Tag
                :severity="getStatusSeverity(slotProps.data.status)"
                :value="slotProps.data.status"
              />
            </template>
          </Column>
          <Column>
            <template #body="slotProps">
              <ActionButtons
                :queryQueueItem="slotProps.data"
                @cancel-query="cancelQuery"
                @go-to-query="goToQuery"
                @view-query-results="viewQueryResults"
                @delete-query="deleteQuery"
                @requeue-query="requeueQuery"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
    <QueryResults
      :queryItem="selectedQuery"
      v-model:showDialog="showQueryResults"
    />
  </div>
</template>

<script setup lang="ts">
import type { QueueItem } from "~~/models";
import { QueueItemStatus } from "~~/enums";
import { onMounted, ref } from "vue";
import type { Ref } from "vue";
import type { QueryRequest } from "~~/models/AutoGen";
import ActionButtons from "~/components/queryRunner/ActionButtons.vue";
import QueryResults from "~/components/queryRunner/QueryResults.vue";

const queryQueueItems: Ref<QueueItem[]> = ref([]);
const loading = ref(true);
const searchLoading = ref(false);
const totalCount = ref(0);
const page = ref(1);
const rows = ref(25);
const rowsOriginal = ref(25);
const selectedQuery: Ref<QueueItem | undefined> = ref();
const showQueryResults = ref(false);

await init();

async function init() {
  loading.value = true;
  await initSearch();
  loading.value = false;
}

async function initSearch() {
  searchLoading.value = true;
  const results = await useFetch<{ totalCount: number; result: QueueItem[] }>(
    "/api/queue/user/",
    {
      query: { userId: "test", page: page.value, size: rows.value },
    }
  );
  if (results.data.value) {
    totalCount.value = results.data.value.totalCount;
    queryQueueItems.value = results.data.value.result.sort((a, b) => {
      if (!a.queuedAt) return 1;
      if (!b.queuedAt) return -1;
      return new Date(b.queuedAt).getTime() - new Date(a.queuedAt).getTime();
    });
  } else {
    totalCount.value = 0;
    queryQueueItems.value = [];
  }
  searchLoading.value = false;
}

async function refresh() {
  searchLoading.value = true;
  const results = await $fetch<{ totalCount: number; result: QueueItem[] }>(
    "/api/queue/user/",
    {
      query: { userId: "test", page: page.value, size: rows.value },
    }
  );
  if (results) {
    totalCount.value = results.totalCount;
    queryQueueItems.value = results.result.sort((a, b) => {
      if (!a.queuedAt) return 1;
      if (!b.queuedAt) return -1;
      return new Date(b.queuedAt).getTime() - new Date(a.queuedAt).getTime();
    });
  } else {
    totalCount.value = 0;
    queryQueueItems.value = [];
  }
  searchLoading.value = false;
}

function getStatusSeverity(
  status: QueueItemStatus
): "secondary" | "success" | "info" | "warn" | "danger" | "contrast" {
  switch (status) {
    case QueueItemStatus.QUEUED:
      return "warn";
    case QueueItemStatus.RUNNING:
      return "info";
    case QueueItemStatus.COMPLETED:
      return "success";
    case QueueItemStatus.ERRORED:
      return "danger";
    case QueueItemStatus.CANCELLED:
      return "contrast";
    default:
      return "info";
  }
}

async function cancelQuery(queryId: string) {
  await useFetch("/api/queue/query/cancel", { params: { queueId: queryId } });
  await init();
}

function goToQuery(queryIri: string) {}

async function viewQueryResults(queryItem: QueueItem) {
  selectedQuery.value = queryItem;
  showQueryResults.value = true;
}

async function deleteQuery(queryId: string) {
  await useFetch("/api/queue/query/delete", { params: { queueId: queryId } });
  await init();
}

async function requeueQuery(queryId: string) {
  const found = getById(queryId);
  if (found)
    await useFetch("/api/queue/query/requeue", { method: "post", body: found });
  await init();
}

function getById(queryId: string): QueueItem | undefined {
  return queryQueueItems.value.find((item) => item.id === queryId);
}

async function onPage(event: any) {
  page.value = event.page;
  rows.value = event.rows;
  await refresh();
  scrollToTop();
}

function scrollToTop() {
  const scrollArea = document.getElementsByClassName(
    "p-datatable-scrollable-table"
  )[0] as HTMLElement;
  scrollArea?.scrollIntoView({ block: "start", behavior: "smooth" });
}
</script>

<style scoped></style>
