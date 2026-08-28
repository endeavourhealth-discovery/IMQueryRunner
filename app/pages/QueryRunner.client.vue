<template>
  <div class="flex-auto overflow-auto">
    <div class="h-[calc(100% - 3.5rem)] overflow-auto">
      <div class="flex h-full flex-auto flex-col flex-nowrap overflow-auto bg-(--p-content-background)">
        <div class="flex gap-4 m-2">
          <div class="flex gap-1 m-0">
            <Button class="flex" severity="secondary" icon="fa-solid fa-arrows-rotate" label="Refresh" @click="refresh" />
            <Select v-model="selectedInterval" :options="intervalList" optionLabel="name" placeholder="Refresh options"></Select>
          </div>
          <Button class="flex" icon="fa-solid fa-magnifying-glass" label="Run a query" @click="runQuery" />
        </div>
        <transition name="fade">
          <DataTable
            :value="jobs"
            :paginator="true"
            :rows="rows"
            :scrollable="true"
            scrollHeight="flex"
            :autoLayout="true"
            @page="onPage($event)"
            :lazy="true"
            :totalRecords="totalCount"
            :rows-per-page-options="[rowsOriginal, rowsOriginal * 2, rowsOriginal * 4, rowsOriginal * 8]"
            :loading="searchLoading"
            :paginatorTemplate="'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown'"
          >
            <template #empty>None</template>
            <Column field="jobName" header="Job name"></Column>
            <Column>
              <template #body="{ data }: { data: Job }">
                <!-- <Button
                :disabled="!data.queryDefinition.argument.length"
                label="View arguments"
                @click="viewArgumentDisplay(data.queryDefinition.argument)"
              /> -->
              </template>
            </Column>
            <Column v-if="adminView" field="userId" header="User"></Column>
            <Column field="queuedAt" header="Queued">
              <template #body="{ data }: { data: Job }">
                <span>{{ data.queueDate ? getDisplayDateTime(data.queueDate) : "-" }}</span>
              </template>
            </Column>
            <Column field="stoppedAt" header="Finished">
              <template #body="{ data }: { data: Job }">
                <span>{{ data.finishDate ? getDisplayDateTime(data.finishDate) : "-" }}</span>
              </template>
            </Column>
            <Column field="status" header="Status">
              <template #body="{ data }: { data: Job }">
                <Tag :severity="data.status ? getStatusSeverity(data.status) : '-'" :value="data.status" />
              </template>
            </Column>
            <Column>
              <template #body="slotProps">
                <ActionButtons
                  :job="slotProps.data"
                  @cancel-query="cancelJob"
                  @go-to-query="goToQuery"
                  @view-query-results="viewQueryResults"
                  @delete-query="deleteJob"
                  @requeue-query="requeueJob"
                />
              </template>
            </Column>
          </DataTable>
        </transition>
      </div>
    </div>
    <ArgumentDisplayDialog :arguments="currentArguments" :show-footer-buttons="false" v-model:showDialog="showArgumentDisplay" />
  </div>
</template>

<script setup lang="ts">
import ActionButtons from "~/components/queryRunner/ActionButtons.vue";
import ArgumentDisplayDialog from "~/components/queryRunner/ArgumentDisplayDialog.vue";
import { JobStatus } from "~~/enums";
import type { Job, JobRequest } from "~~/models";

import { onMounted, ref } from "vue";
import type { Ref } from "vue";

import type { Argument } from "@endeavour/vue-library/models";
import { useUserStore } from "@endeavour/vue-library/stores";

import { io } from "socket.io-client";

definePageMeta({
  requiresAuth: true,
  requiresRole: ["EXECUTOR", "ADMIN"]
});

const userStore = useUserStore();
const confirm = useConfirm();

const socket = io();

const jobs: Ref<Job[]> = ref([]);
const loading = ref(true);
const searchLoading = ref(false);
const totalCount = ref(0);
const page = ref(1);
const rows = ref(25);
const rowsOriginal = ref(25);
const selectedQuery: Ref<Job | undefined> = ref();
const showQueryResults = ref(false);
const websocketIsConnected = ref(false);
const transport = ref("N/A");
const showArgumentDisplay = ref(false);
const currentArguments: Ref<Argument[]> = ref([]);
const adminView = false; //TODO: determine admin view based on user role and preference

interface IntervalOption {
  name: string;
  time: number;
}

const intervalList = ref<IntervalOption[]>([
  { name: "manual", time: 0 },
  { name: "auto", time: 0 },
  { name: "every 5s", time: 5000 },
  { name: "every 10s", time: 10000 },
  { name: "every 15s", time: 15000 },
  { name: "every 30s", time: 30000 }
]);
const pollTimer = ref<ReturnType<typeof setTimeout> | undefined>();
const polling = ref(false);

const selectedInterval: Ref<IntervalOption> = ref({ name: "manual", time: 0 });
const isAuto = computed(() => selectedInterval.value.name === "auto");
const isManual = computed(() => selectedInterval.value.name === "manual");
const isPolling = computed(() => !isAuto.value && !isManual.value);

onMounted(async () => {
  loading.value = true;
  if (userStore.refreshInterval) {
    const interval = intervalList.value.find(interval => interval.name === userStore.refreshInterval);
    if (interval) selectedInterval.value = interval;
  }
  loading.value = false;
  document.addEventListener("visibilitychange", handleVisibilityChange);
  await initSearch();
  if (selectedInterval.value.name === "auto") {
    connectWebSocket();
  } else if (selectedInterval.value.time && selectedInterval.value.time > 0) {
    scheduleNextPoll();
  }
});

watch(selectedInterval, async () => {
  if (!selectedInterval.value) return;
  userStore.updateRefreshInterval(selectedInterval.value.name);
  stopPolling();
  if (selectedInterval.value.name === "auto") {
    connectWebSocket();
    await refresh();
  } else {
    disconnectWebSocket();
    if (selectedInterval.value.time && selectedInterval.value.time > 0) {
      scheduleNextPoll();
    }
  }
});

async function initSearch() {
  searchLoading.value = true;
  const results = await useFetch<{
    totalCount: number;
    result: Job[];
  }>("/api/queue", {
    query: {
      userId: userStore.currentUser?.id,
      page: page.value,
      size: rows.value
    }
  });
  if (results.data.value) {
    totalCount.value = results.data.value.totalCount;
    jobs.value = results.data.value.result.sort((a, b) => {
      if (!a.queueDate) return 1;
      if (!b.queueDate) return -1;
      return new Date(b.queueDate).getTime() - new Date(a.queueDate).getTime();
    });
  } else {
    totalCount.value = 0;
    jobs.value = [];
  }
  searchLoading.value = false;
}

function stopPolling() {
  if (pollTimer.value) {
    clearTimeout(pollTimer.value);
    pollTimer.value = undefined;
  }
}

function scheduleNextPoll() {
  stopPolling();
  if (isPolling.value && document.visibilityState === "visible" && selectedInterval.value.time) {
    pollTimer.value = setTimeout(poll, selectedInterval.value.time);
  }
}

async function poll() {
  if (!isPolling.value) return;
  if (document.visibilityState !== "visible") return;
  if (polling.value) return;

  polling.value = true;

  try {
    await refresh();
  } catch (error) {
    console.error("Queue polling failed:", error);
  } finally {
    polling.value = false;
    if (isPolling.value) scheduleNextPoll();
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === "visible") {
    if (isPolling.value) void poll();
  } else {
    stopPolling();
  }
}

function connectWebSocket() {
  if (socket.connected) return;
  socket.on("connect", onConnect);
  socket.on("disconnect", onDisconnect);
  socket.on("queueUpdate", onQueueUpdate);
  socket.connect();
}

function disconnectWebSocket() {
  socket.off("connect", onConnect);
  socket.off("disconnect", onDisconnect);
  socket.off("queueUpdate", onQueueUpdate);
  if (socket.connected) socket.disconnect();
  websocketIsConnected.value = false;
  transport.value = "N/A";
}

async function onQueueUpdate() {
  if (!isAuto.value) return;
  await refresh();
}

function onConnect() {
  websocketIsConnected.value = true;
  transport.value = socket.io.engine.transport.name;
  socket.emit("joinRoom");
  socket.on("message", function (data) {
    alert(data);
  });
  socket.emit("hello");
  socket.io.engine.on("upgrade", rawTransport => {
    transport.value = rawTransport.name;
  });
}

function onDisconnect() {
  websocketIsConnected.value = false;
  transport.value = "N/A";
}

async function refresh() {
  const foundJobs = await $fetch<{ totalCount: number; result: Job[] }>("/api/queue", {
    query: {
      userId: userStore.currentUser?.id,
      page: page.value,
      size: rows.value
    }
  });
  if (foundJobs) {
    totalCount.value = foundJobs.totalCount;
    jobs.value = foundJobs.result;
  } else {
    totalCount.value = 0;
    jobs.value = [];
  }

  searchLoading.value = false;
}

function getStatusSeverity(status: JobStatus): "secondary" | "success" | "info" | "warn" | "danger" | "contrast" {
  switch (status) {
    case JobStatus.QUEUED:
      return "warn";
    case JobStatus.RUNNING:
      return "info";
    case JobStatus.COMPLETED:
      return "success";
    case JobStatus.ERRORED:
      return "danger";
    case JobStatus.CANCELLED:
      return "contrast";
    default:
      return "info";
  }
}

async function cancelJob(jobId: string) {
  await $fetch(`/api/queue/job/stop/${jobId}`);
  await refresh();
}

async function goToQuery(queryIri: string) {
  confirm.require({
    message: "Are you sure you want to navigate away from this page?",
    header: "Navigate",
    acceptProps: {
      label: "Proceed"
    },
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true
    },
    accept: async () => {
      const config = useRuntimeConfig();
      const encoded = `${config.public.imDirectoryUrl!}#/directory/folder/${encodeURIComponent(queryIri)}`;
      await navigateTo(encoded, { external: true });
    }
  });
}

async function viewQueryResults(queryItem: Job) {
  selectedQuery.value = queryItem;
  showQueryResults.value = true;
}

async function viewArgumentDisplay(args: Argument[]) {
  currentArguments.value = args;
  showArgumentDisplay.value = true;
}

function runQuery() {
  navigateTo("/run");
}

async function deleteJob(jobId: string) {
  await $fetch(`/api/queue/job/${jobId}`, {
    method: "delete"
  });
  await refresh();
}

async function requeueJob(jobId: string) {
  const found = getById(jobId);
  if (!found) {
    console.error("Job not found for requeueing:", jobId);
    return;
  }
  if (found) {
    const jobRequest = {
      jobName: "Requeued " + (found?.jobName || "Requeued Job"),
      queryRequests: found?.queryRequests
    } as JobRequest;
    await $fetch("/api/queue/job/add", {
      method: "post",
      body: jobRequest
    });
  }
  await refresh();
}

function getById(jobId: string): Job | undefined {
  return jobs.value.find(item => item.id === Number(jobId));
}

async function onPage(event: any) {
  page.value = ++event.page;
  rows.value = event.rows;
  await refresh();
  scrollToTop();
}

function scrollToTop() {
  const scrollArea = document.getElementsByClassName("p-datatable-scrollable-table")[0] as HTMLElement;
  scrollArea?.scrollIntoView({ block: "start", behavior: "smooth" });
}

function getDisplayDateTime(date: string) {
  const d = new Date(date);
  return (
    d.getUTCDate() + "/" + (d.getUTCMonth() + 1) + "/" + d.getUTCFullYear() + " " + d.getUTCHours() + ":" + d.getUTCMinutes() + ":" + d.getUTCMilliseconds()
  );
}

onBeforeUnmount(() => {
  stopPolling();
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  disconnectWebSocket();
});
</script>

<style scoped></style>
