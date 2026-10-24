<template>
  <div class="flex-auto overflow-auto">
    <div class="h-[calc(100% - 3.5rem)] overflow-auto">
      <div class="flex h-full flex-auto flex-col flex-nowrap overflow-auto bg-(--p-content-background)">
        <div class="flex gap-4 m-2">
          <div class="flex gap-1 m-0">
            <Button class="flex" severity="secondary" icon="fa-solid fa-arrows-rotate" label="Refresh" @click="refresh" />
            <Select v-model="selectedInterval" :options="intervalList" optionLabel="name" placeholder="Refresh options"></Select>
          </div>
          <Button class="flex" icon="fa-solid fa-magnifying-glass" label="Search and run" @click="runQuery" />
          <Button
            class="flex"
            severity="secondary"
            :icon="reportProgress ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-file-arrow-down'"
            :label="reportProgress ? `Running report ${reportProgress.done}/${reportProgress.total}` : 'Query reports'"
            :disabled="!!reportProgress"
            aria-haspopup="true"
            aria-controls="query-report-menu"
            @click="reportMenu.toggle($event)"
          />
          <Menu ref="reportMenu" id="query-report-menu" :model="reportMenuItems" :popup="true" />
        </div>
        <transition name="fade">
          <TreeTable
            v-model:expandedKeys="expandedKeys"
            :value="nodes"
            :paginator="true"
            :rows="rows"
            :scrollable="true"
            scrollHeight="flex"
            @page="onPage($event)"
            :lazy="true"
            :totalRecords="totalCount"
            :rows-per-page-options="[rowsOriginal, rowsOriginal * 2, rowsOriginal * 4, rowsOriginal * 8]"
            :loading="searchLoading"
            :paginatorTemplate="'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown'"
            data-testid="job-table"
          >
            <template #empty>None</template>
            <Column field="name" header="Name" :expander="true">
              <template #body="{ node }: { node: QueueNode }">
                <span v-if="node.data.kind === 'job'">{{ node.data.job.jobName }}</span>
                <span v-else>{{ node.data.summary.queryName }}</span>
              </template>
            </Column>
            <Column field="count" header="Count">
              <template #body="{ node }: { node: QueueNode }">
                <span v-if="node.data.kind === 'query'">{{ node.data.summary.totalCount }}</span>
              </template>
            </Column>
            <Column v-if="adminView" header="User">
              <template #body="{ node }: { node: QueueNode }">
                <span v-if="node.data.kind === 'job'">{{ node.data.job.userId }}</span>
              </template>
            </Column>
            <Column field="queuedAt" header="Queued/Started">
              <template #body="{ node }: { node: QueueNode }">
                <span v-if="node.data.kind === 'job'">{{ node.data.job.queueDate ? getDisplayDateTime(node.data.job.queueDate) : "-" }}</span>
                <span v-else>{{ node.data.summary.startTime ? getDisplayDateTime(node.data.summary.startTime) : "-" }}</span>
              </template>
            </Column>
            <Column field="stoppedAt" header="Finished">
              <template #body="{ node }: { node: QueueNode }">
                <span v-if="node.data.kind === 'job'">{{ node.data.job.finishDate ? getDisplayDateTime(node.data.job.finishDate) : "-" }}</span>
                <span v-else>{{ node.data.summary.endTime ? getDisplayDateTime(node.data.summary.endTime) : "-" }}</span>
              </template>
            </Column>
            <Column field="runTime" header="Run time">
              <template #body="{ node }: { node: QueueNode }">
                <span v-if="node.data.kind === 'job'">{{ node.data.job.finishDate ? getDisplayRunTime(node.data.job) : "-" }}</span>
                <span v-else>{{ getDisplayRunSeconds(node.data.summary) }}</span>
              </template>
            </Column>
            <Column field="status" header="Status">
              <template #body="{ node }: { node: QueueNode }">
                <Tag
                  v-if="node.data.kind === 'job'"
                  :severity="node.data.job.status ? getStatusSeverity(node.data.job.status) : '-'"
                  :value="node.data.job.status"
                />
              </template>
            </Column>
            <Column>
              <template #body="{ node }: { node: QueueNode }">
                <ActionButtons
                  v-if="node.data.kind === 'job'"
                  :job="node.data.job"
                  :resultSummary="getResultSummaries(node.data.job.id)"
                  @cancel-query="cancelJob"
                  @go-to-query="goToQuery"
                  @view-query-results="viewQueryResults"
                  @delete-query="deleteJob"
                  @requeue-query="requeueJob"
                />
                <div v-else class="flex items-center gap-1">
                  <Button
                    icon="fa-duotone fa-solid fa-magnifying-glass"
                    class="p-button-rounded p-button-text p-button-plain"
                    @click="goToQuery(node.data.summary.queryIri)"
                    v-tooltip.top="'View query'"
                  />
                  <Button
                    v-if="node.data.summary.queryType !== IMQType.INDICATOR"
                    icon="fa-duotone fa-solid fa-list"
                    class="p-button-rounded p-button-text p-button-plain"
                    @click="viewSummaryResults(node.data.jobId, node.data.summary)"
                    v-tooltip.left="'View results'"
                  />
                </div>
              </template>
            </Column>
          </TreeTable>
        </transition>
      </div>
    </div>
    <ArgumentDisplayDialog :arguments="currentArguments" :show-footer-buttons="false" v-model:showDialog="showArgumentDisplay" />
  </div>
</template>

<script setup lang="ts">
import { QUERY_REPORT_SUITES } from "#shared/queryReport";
import type { QueryReportSuite } from "#shared/queryReport";
import ActionButtons from "~/components/queryRunner/ActionButtons.vue";
import ArgumentDisplayDialog from "~/components/queryRunner/ArgumentDisplayDialog.vue";
import { runQueryReport } from "~/utils/queryReport";
import { JobStatus } from "~~/enums";
import type { Job, QueryResultSummary, QueueUpdate } from "~~/models";

import type { Ref } from "vue";
import { onMounted, ref } from "vue";

import { IMQType } from "@endeavour/vue-library/enums";
import type { Argument } from "@endeavour/vue-library/models";
import { useUserStore } from "@endeavour/vue-library/stores";

import type { MenuItem } from "primevue/menuitem";
import type { TreeTableExpandedKeys } from "primevue/treetable";
import type { Socket } from "socket.io-client";

definePageMeta({
  requiresAuth: true,
  requiresRole: ["EXECUTOR", "ADMIN"]
});

const userStore = useUserStore();
const confirm = useConfirm();
const toast = useToast();

// Created on demand: the library is only downloaded, and a connection only opened, when "auto" refresh is selected
let socket: Socket | undefined;
let disposed = false;

const jobs: Ref<Job[]> = ref([]);
const resultSummaries: Ref<{ jobId: number; resultsSummary: QueryResultSummary[]; error?: string }[]> = ref([]);
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
const reportMenu = ref();
const reportProgress: Ref<{ done: number; total: number } | undefined> = ref();
const reportMenuItems: MenuItem[] = (Object.keys(QUERY_REPORT_SUITES) as QueryReportSuite[]).map(suite => ({
  label: QUERY_REPORT_SUITES[suite].label,
  command: () => runReport(suite)
}));
const adminView = false; //TODO: determine admin view based on user role and preference

type QueueNodeData = { kind: "job"; job: Job } | { kind: "query"; jobId: number; summary: QueryResultSummary };
interface QueueNode {
  key: string;
  data: QueueNodeData;
  leaf: boolean;
  children: QueueNode[];
}

const expandedKeys: Ref<TreeTableExpandedKeys> = ref({});

// Children are only built for expanded nodes: a sub query shared by several queries appears under each of them, so building the whole
// tree up front could be far larger than what is ever looked at. Keys are paths, so a shared sub query gets a different key under each parent.
const nodes = computed(() => jobs.value.map(jobNode));

function jobNode(job: Job): QueueNode {
  const key = `job-${job.id}`;
  const summaries = getResultSummaries(job.id) ?? [];
  const summaryById = new Map(summaries.filter(summary => summary.queryResultId !== undefined).map(summary => [summary.queryResultId!, summary]));
  // An indicator's sub queries are the results linked to it, any other query's are the sub query results it recorded
  const subQueriesOf = (summary: QueryResultSummary) =>
    summary.queryType === IMQType.INDICATOR
      ? summaries.filter(sub => sub.queryResultId !== undefined && sub.indicatorResultId === summary.indicatorResultId)
      : (summary.subQueryResultIds ?? []).map(id => summaryById.get(id)).filter((sub): sub is QueryResultSummary => !!sub);
  // The job's own queries: one entry per query request, as the sub query results of one query can share its iri with another
  const topLevel = [...new Set(job.queryRequests.map(queryRequest => queryRequest.query?.iri))]
    .map(iri => summaries.find(summary => summary.queryIri === iri))
    .filter((summary): summary is QueryResultSummary => !!summary);
  return {
    key,
    data: { kind: "job", job },
    leaf: !topLevel.length,
    children: expandedKeys.value[key] ? topLevel.map(summary => queryNode(key, job.id, summary, subQueriesOf)) : []
  };
}

function queryNode(
  parentKey: string,
  jobId: number,
  summary: QueryResultSummary,
  subQueriesOf: (summary: QueryResultSummary) => QueryResultSummary[]
): QueueNode {
  const key = `${parentKey}/${summary.queryResultId ?? `indicator-${summary.indicatorResultId}`}`;
  const subQueries = subQueriesOf(summary);
  return {
    key,
    data: { kind: "query", jobId, summary },
    leaf: !subQueries.length,
    children: expandedKeys.value[key] ? subQueries.map(sub => queryNode(key, jobId, sub, subQueriesOf)) : []
  };
}

function getResultSummaries(jobId: number): QueryResultSummary[] | undefined {
  return resultSummaries.value.find(summary => Number(summary.jobId) === jobId)?.resultsSummary;
}

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
  try {
    const results = await $fetch<{
      totalCount: number;
      result: Job[];
    }>("/api/queue", {
      query: {
        userId: userStore.currentUser?.id,
        page: page.value,
        size: rows.value
      }
    });
    if (results) {
      const summaries = await loadResultSummaries(results.result);
      const sortedJobs = results.result.sort((a, b) => {
        if (!a.queueDate) return 1;
        if (!b.queueDate) return -1;
        return new Date(b.queueDate).getTime() - new Date(a.queueDate).getTime();
      });
      // Only replace what changed: reassigning identical data still re-renders the rows, which destroys any open results menu
      if (JSON.stringify(summaries) !== JSON.stringify(resultSummaries.value)) resultSummaries.value = summaries;
      totalCount.value = results.totalCount;
      if (JSON.stringify(sortedJobs) !== JSON.stringify(jobs.value)) jobs.value = sortedJobs;
    } else {
      totalCount.value = 0;
      jobs.value = [];
    }
  } finally {
    searchLoading.value = false;
  }
}

type ResultSummaries = { jobId: number; resultsSummary: QueryResultSummary[]; error?: string };

/**
 * One summaries entry per job. A completed job's results never change, so summaries already held are kept and only the
 * missing ones (or ones that failed last time) are requested. Jobs that are not completed have no summaries yet.
 */
async function loadResultSummaries(listedJobs: Job[]): Promise<ResultSummaries[]> {
  const held = new Map(resultSummaries.value.map(summary => [Number(summary.jobId), summary]));
  const isHeld = (job: Job) => {
    const summary = held.get(job.id);
    return job.status === JobStatus.COMPLETED && !!summary && !summary.error && summary.resultsSummary.length > 0;
  };

  const missing = listedJobs.filter(job => job.status === JobStatus.COMPLETED && !isHeld(job)).map(job => job.id);
  const fetched = missing.length ? await $fetch<ResultSummaries[]>("/api/queue/job/results/summaries", { query: { jobIds: missing.join(",") } }) : [];
  for (const summary of fetched) {
    if (summary.error) console.warn(`Failed to get result summaries for job ${summary.jobId}: ${summary.error}`);
  }
  const fetchedById = new Map(fetched.map(summary => [Number(summary.jobId), summary]));

  return listedJobs.map(job => fetchedById.get(job.id) ?? (isHeld(job) ? held.get(job.id)! : { jobId: job.id, resultsSummary: [] }));
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

async function connectWebSocket() {
  if (socket?.connected) return;
  if (!socket) {
    let io: typeof import("socket.io-client").io;
    try {
      ({ io } = await import("socket.io-client"));
    } catch (error) {
      console.error("Could not load the live update library:", error);
      return;
    }
    // The user may have left "auto" (or the page) while the library was loading
    if (!isAuto.value || disposed) return;
    socket ??= io({ autoConnect: false });
  }
  // off() first so repeated calls never register a handler twice
  socket.off("connect", onConnect).on("connect", onConnect);
  socket.off("disconnect", onDisconnect).on("disconnect", onDisconnect);
  socket.off("queueUpdate", onQueueUpdate).on("queueUpdate", onQueueUpdate);
  socket.connect();
}

function disconnectWebSocket() {
  if (socket) {
    socket.off("connect", onConnect);
    socket.off("disconnect", onDisconnect);
    socket.off("queueUpdate", onQueueUpdate);
    if (socket.connected) socket.disconnect();
  }
  websocketIsConnected.value = false;
  transport.value = "N/A";
}

async function onQueueUpdate(update?: QueueUpdate) {
  if (!isAuto.value) return;
  // A change to a job already on screen only needs that job reloaded. Anything else (a new job, no detail) reloads the list.
  if (update?.jobId !== undefined && jobs.value.some(job => job.id === update.jobId)) await refreshJob(update.jobId);
  else await refresh();
}

async function refreshJob(jobId: number) {
  try {
    const job = await $fetch<Job>(`/api/queue/job/${jobId}`);
    const index = jobs.value.findIndex(item => item.id === jobId);
    if (index === -1) return; // removed from the list while the request was in flight
    jobs.value.splice(index, 1, job);

    if (job.status === JobStatus.COMPLETED) {
      const resultsSummary = await $fetch<QueryResultSummary[]>(`/api/queue/job/results/${jobId}/summary`);
      const entry = { jobId, resultsSummary };
      const existing = resultSummaries.value.findIndex(summary => Number(summary.jobId) === jobId);
      if (existing === -1) resultSummaries.value.push(entry);
      else resultSummaries.value.splice(existing, 1, entry);
    }
  } catch (error) {
    // For example the job was deleted in another tab: fall back to reloading the list
    console.warn(`Could not refresh job ${jobId}, reloading the list:`, error);
    await refresh();
  }
}

function onConnect() {
  if (!socket) return;
  websocketIsConnected.value = true;
  transport.value = socket.io.engine.transport.name;
  socket.emit("joinRoom");
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
  await initSearch();
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

async function viewSummaryResults(jobId: number, summary: QueryResultSummary) {
  await navigateTo({ path: `/results/${jobId}/${summary.queryType}/${encodeURIComponent(summary.queryIri)}` });
}

async function viewArgumentDisplay(args: Argument[]) {
  currentArguments.value = args;
  showArgumentDisplay.value = true;
}

function runQuery() {
  navigateTo("/run");
}

/** Runs one of the gauge query suites as jobs, downloads the HTML report when they have all finished. */
async function runReport(suite: QueryReportSuite) {
  const { label } = QUERY_REPORT_SUITES[suite];
  reportProgress.value = { done: 0, total: 0 };
  try {
    const results = await runQueryReport(suite, (done, total) => (reportProgress.value = { done, total }));
    const failed = results.filter(r => r.status !== "COMPLETED").length;
    toast.add({
      severity: failed ? "warn" : "success",
      summary: `${label} report downloaded`,
      detail: `${results.length - failed}/${results.length} passed`,
      life: 10000
    });
  } catch (error) {
    console.error("Query report failed:", error);
    toast.add({ severity: "error", summary: `${label} report failed`, detail: String(error), life: 10000 });
  } finally {
    reportProgress.value = undefined;
    await refresh();
  }
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
    console.error("Job not found for re-queueing:", jobId);
    return;
  }

  await $fetch("/api/queue/job/add", {
    method: "post",
    body: {
      jobName: found.jobName,
      queryRequests: found.queryRequests
    }
  });

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
  const scrollArea = document.getElementsByClassName("p-treetable-scrollable-table")[0] as HTMLElement;
  scrollArea?.scrollIntoView({ block: "start", behavior: "smooth" });
}

function getDisplayDateTime(date: Date) {
  const d = new Date(date);
  return (
    d.getDate().toString().padStart(2, "0") +
    "/" +
    (d.getMonth() + 1).toString().padStart(2, "0") +
    "/" +
    d.getFullYear() +
    " " +
    d.getHours().toString().padStart(2, "0") +
    ":" +
    d.getMinutes().toString().padStart(2, "0") +
    ":" +
    d.getSeconds().toString().padStart(2, "0")
  );
}

function getDisplayRunSeconds(summary: QueryResultSummary) {
  if (!summary.startTime || !summary.endTime) return "-";
  const seconds = (new Date(summary.endTime).getTime() - new Date(summary.startTime).getTime()) / 1000;
  // start_time and end_time are stored to the second
  return `${Math.round(seconds)}s`;
}

function getDisplayRunTime(data: Job) {
  if (!data.runDate || !data.finishDate) return null;
  const runDate = new Date(data.runDate);
  const endDate = new Date(data.finishDate);
  const timeDiffSeconds = (endDate.getTime() - runDate.getTime()) / 1000;

  if (Math.floor(timeDiffSeconds / 60)) return Math.floor(timeDiffSeconds / 60) + "m " + Math.floor(timeDiffSeconds % 60) + "s";
  if (Math.floor(timeDiffSeconds % 60)) return Math.floor(timeDiffSeconds % 60) + "s";
  else return "<1s";
}

onBeforeUnmount(() => {
  disposed = true;
  stopPolling();
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  disconnectWebSocket();
});
</script>

<style scoped></style>
