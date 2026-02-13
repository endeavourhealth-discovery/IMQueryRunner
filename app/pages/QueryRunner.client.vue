<template>
  <div class="flex-auto overflow-auto">
    <div class="h-[calc(100% - 3.5rem)] overflow-auto">
      <div
        class="flex h-full flex-auto flex-col flex-nowrap overflow-auto bg-(--p-content-background)"
      >
        <div class="flex gap-2 m-2">
          <Button
            class="flex"
            severity="secondary"
            icon="fa-solid fa-arrows-rotate"
            label="Refresh"
            @click="refresh"
          />
          <Button
            class="flex"
            icon="fa-solid fa-magnifying-glass"
            label="Run a query"
            @click="runQuery"
          />
        </div>
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
          <!-- <Column field="dbid" header="ID"></Column> -->
          <!-- <Column field="queryRequest.query.iri" header="Iri"></Column> -->
          <Column field="jobName" header="Job name"></Column>
          <Column>
            <template #body="{ data }: { data: Job }">
              <Button
                :disabled="!data.queryRequest.argument"
                label="View arguments"
                @click="viewArgumentDisplay(data.queryRequest.argument)"
                v-tooltip.top="'No arguments available'"
              />
            </template>
          </Column>
          <Column v-if="adminView" field="userId" header="User"></Column>
          <Column field="queuedAt" header="Queued">
            <template #body="{ data }: { data: Job }">
              <span>{{
                data.queueDate ? getDisplayDateTime(data.queueDate) : "-"
              }}</span>
            </template>
          </Column>
          <Column field="stoppedAt" header="Finished">
            <template #body="{ data }: { data: Job }">
              <span>{{
                data.finishDate ? getDisplayDateTime(data.finishDate) : "-"
              }}</span>
            </template>
          </Column>
          <Column field="status" header="Status">
            <template #body="{ data }: { data: Job }">
              <Tag
                :severity="data.status ? getStatusSeverity(data.status) : '-'"
                :value="data.status"
              />
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
      </div>
    </div>
    <ArgumentDisplayDialog
      :arguments="currentArguments"
      :show-footer-buttons="false"
      v-model:showDialog="showArgumentDisplay"
    />
  </div>
</template>

<script setup lang="ts">
import type { Job } from "~~/models";
import { JobStatus } from "~~/enums";
import { onMounted, ref } from "vue";
import type { Ref } from "vue";
import type { Argument } from "~~/models/AutoGen";
import ActionButtons from "~/components/queryRunner/ActionButtons.vue";
import { io } from "socket.io-client";
import ArgumentDisplayDialog from "~/components/queryRunner/ArgumentDisplayDialog.vue";
import { useUserStore } from "~/plugins/end-sec-ui";

definePageMeta({
  requiresAuth: true,
  requiresRole: ["EXECUTOR", "ADMIN"],
});

const { user } = useUserStore();
const confirm = useConfirm();

const socket = io({
  extraHeaders: {
    authorization: `bearer ${user?.id}`,
  },
});

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
onMounted(async () => {
  loading.value = true;
  loading.value = false;
  socket.emit("joinRoom", "test-room", user?.userName);
  socket.on("message", function (data) {
    alert(data);
  });
  socket.emit("hello");
  await initSearch();
});

async function initSearch() {
  searchLoading.value = true;
  const results = await useFetch<{
    totalCount: number;
    result: Job[];
  }>("/api/queue", {
    query: {
      userId: user?.id,
      page: page.value,
      size: rows.value,
    },
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

async function refresh() {
  searchLoading.value = true;
  const foundJobs = await $fetch<{ totalCount: number; result: Job[] }>(
    "/api/queue",
    {
      query: {
        userId: user?.id,
        page: page.value + 1,
        size: rows.value,
      },
    },
  );
  if (foundJobs) {
    totalCount.value = foundJobs.totalCount;
    jobs.value = foundJobs.result;
  } else {
    totalCount.value = 0;
    jobs.value = [];
  }

  searchLoading.value = false;
}

function getStatusSeverity(
  status: JobStatus,
): "secondary" | "success" | "info" | "warn" | "danger" | "contrast" {
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
  await $fetch(`/api/queue/job/cancel/${jobId}`);
  await refresh();
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
      const encoded = `${config.public.imDirectoryUrl!}#/directory/folder/${encodeURIComponent(
        queryIri,
      )}`;
      await navigateTo(encoded, { external: true });
    },
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
    method: "delete",
  });
  await refresh();
}

async function requeueJob(jobId: string) {
  const found = getById(jobId);
  if (found)
    await $fetch("/api/queue/job/add", {
      method: "post",
      body: found.queryRequest,
    });
  await refresh();
}

function getById(jobId: string): Job | undefined {
  return jobs.value.find((item) => item.dbid === jobId);
}

async function onPage(event: any) {
  page.value = event.page;
  rows.value = event.rows;
  await refresh();
  scrollToTop();
}

function scrollToTop() {
  const scrollArea = document.getElementsByClassName(
    "p-datatable-scrollable-table",
  )[0] as HTMLElement;
  scrollArea?.scrollIntoView({ block: "start", behavior: "smooth" });
}

function getDisplayDateTime(date: string) {
  const d = new Date(date);
  return (
    d.getUTCDate() +
    "/" +
    (d.getUTCMonth() + 1) +
    "/" +
    d.getUTCFullYear() +
    " " +
    d.getUTCHours() +
    ":" +
    d.getUTCMinutes() +
    ":" +
    d.getUTCMilliseconds()
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
  jobs.value = value;
});
</script>

<style scoped></style>
