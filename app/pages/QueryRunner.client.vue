<template>
  <div class="flex-auto overflow-auto">
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
          <Column>
            <template #body="{ data }: { data: QueueItem }">
              <Button
                label="View arguments"
                @click="viewArgumentDisplay(data.queryRequest.argument)"
              />
            </template>
          </Column>
          <Column field="userName" header="User"></Column>
          <Column field="queuedAt" header="Queued at">
            <template #body="{ data }: { data: QueueItem }">
              <span>{{
                data.queuedAt ? getDisplayDateTime(data.queuedAt) : "-"
              }}</span>
            </template>
          </Column>
          <Column field="startedAt" header="Started at">
            <template #body="{ data }: { data: QueueItem }">
              <span>{{
                data.startedAt ? getDisplayDateTime(data.startedAt) : "-"
              }}</span>
            </template>
          </Column>
          <Column field="finishedAt" header="Finished at">
            <template #body="{ data }: { data: QueueItem }">
              <span>{{
                data.finishedAt ? getDisplayDateTime(data.finishedAt) : "-"
              }}</span>
            </template>
          </Column>
          <Column field="killedAt" header="Killed at">
            <template #body="{ data }: { data: QueueItem }">
              <span>{{
                data.killedAt ? getDisplayDateTime(data.killedAt) : "-"
              }}</span>
            </template>
          </Column>
          <Column field="status" header="Status">
            <template #body="{ data }: { data: QueueItem }">
              <Tag
                :severity="data.status ? getStatusSeverity(data.status) : '-'"
                :value="data.status"
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
    <ArgumentDisplayDialog
      :arguments="currentArguments"
      :show-footer-buttons="false"
      v-model:showDialog="showArgumentDisplay"
    />
  </div>
</template>

<script setup lang="ts">
import type { QueueItem } from "~~/models";
import { QueueItemStatus } from "~~/enums";
import { computed, onMounted, ref } from "vue";
import type { Ref } from "vue";
import type { Argument, QueryRequest } from "~~/models/AutoGen";
import ActionButtons from "~/components/queryRunner/ActionButtons.vue";
import QueryResults from "~/components/queryRunner/QueryResults.vue";
import { io } from "socket.io-client";
import { useUser } from "~/composables/useUser";

const { user } = useUser();
const confirm = useConfirm();

const socket = io({
  extraHeaders: {
    authorization: `bearer ${user.value?.id}`,
  },
});

const queryQueueItems: Ref<QueueItem[]> = ref([]);
const loading = ref(true);
const searchLoading = ref(false);
const totalCount = ref(0);
const page = ref(1);
const rows = ref(25);
const rowsOriginal = ref(25);
const selectedQuery: Ref<QueueItem | undefined> = ref();
const showQueryResults = ref(false);
const websocketIsConnected = ref(false);
const transport = ref("N/A");
const showArgumentDisplay = ref(false);
const currentArguments: Ref<Argument[]> = ref([]);

onMounted(async () => {
  loading.value = true;
  loading.value = false;
  socket.emit("joinRoom", "test-room", user.value?.userName);
  socket.on("message", function (data) {
    alert(data);
  });
  socket.emit("hello");
});

async function initSearch() {
  searchLoading.value = true;
  const results = await useFetch<{
    totalCount: number;
    result: QueueItem[];
  }>("/api/queue/user/", {
    query: {
      userId: user.value?.id,
      page: page.value,
      size: rows.value,
    },
  });
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
      query: {
        userId: user.value?.id,
        page: page.value,
        size: rows.value,
      },
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
  await useFetch("/api/queue/query/cancel", {
    params: { queueId: queryId },
  });
  await initSearch();
}

async function goToQuery(queryIri: string) {
  confirm.require({
    message: "Are you sure you want to navigate away from this page?",
    header: "Navigate",
    acceptProps: {
      label: "Proceed",
    },
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true,
    },
    accept: async () => {
      const config = useRuntimeConfig();
      await navigateTo(
        `${config.public.imDirectoryUrl!}"directory/folder/"${encodeURI(
          queryIri
        )}`
      );
    },
  });
}

async function viewQueryResults(queryItem: QueueItem) {
  selectedQuery.value = queryItem;
  showQueryResults.value = true;
}

async function viewArgumentDisplay(args: Argument[]) {
  currentArguments.value = args;
  showArgumentDisplay.value = true;
}

async function deleteQuery(queryId: string) {
  await useFetch("/api/queue/query/delete", {
    params: { queueId: queryId },
  });
  await initSearch();
}

async function requeueQuery(queryId: string) {
  const found = getById(queryId);
  if (found)
    await useFetch("/api/queue/query/requeue", {
      method: "post",
      body: found,
    });
  await initSearch();
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

function getDisplayDateTime(date: Date) {
  return (
    date.getUTCDate() +
    "/" +
    (date.getUTCMonth() + 1) +
    "/" +
    date.getUTCFullYear() +
    " " +
    date.getUTCHours() +
    ":" +
    date.getUTCMinutes() +
    ":" +
    date.getUTCMilliseconds()
  );
}

function onConnect() {
  websocketIsConnected.value = true;
  transport.value = socket.io.engine.transport.name;
  socket.io.engine.on("upgrade", (rawTransport) => {
    transport.value = rawTransport.name;
  });
}

function onDisconnect() {
  websocketIsConnected.value = false;
  transport.value = "N/A";
}

onBeforeUnmount(() => {
  socket.disconnect();
});

socket.on("queueUpdate", (value) => {
  queryQueueItems.value = value;
});
</script>

<style scoped></style>
