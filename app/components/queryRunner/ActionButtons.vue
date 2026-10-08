<template>
  <div class="flex items-center gap-1">
    <Button
      icon="fa-duotone fa-solid fa-magnifying-glass"
      class="p-button-rounded p-button-text p-button-plain activity-row-button"
      @click="goToQuery"
      v-tooltip.top="'View query'"
      data-testid="view-query-button"
    />
    <Button
      v-if="job.status && [JobStatus.QUEUED, JobStatus.RUNNING].includes(job.status)"
      icon="fa-duotone fa-solid fa-ban"
      severity="danger"
      class="p-button-rounded p-button-text activity-row-button"
      @click="cancelQuery"
      v-tooltip.left="'Cancel query'"
      data-testid="cancel-query-button"
    />
    <Button
      v-if="job.status && [JobStatus.COMPLETED, JobStatus.CANCELLED, JobStatus.ERRORED].includes(job.status)"
      icon="fa-duotone fa-solid fa-repeat"
      severity="warn"
      class="p-button-rounded p-button-text activity-row-button"
      @click="requeueQuery"
      v-tooltip.left="'Requeue query'"
      data-testid="requeue-query-button"
    />
    <Button
      v-if="job.status && [JobStatus.ERRORED].includes(job.status)"
      icon="fa-duotone fa-solid fa-triangle-exclamation"
      class="p-button-rounded p-button-text activity-row-button"
      @click="showErrorDialog = true"
      v-tooltip.left="'Error details'"
      data-testid="show-error-button"
    />
    <Button
      v-if="job.status === JobStatus.COMPLETED"
      icon="fa-duotone fa-solid fa-list"
      class="p-button-rounded p-button-text p-button-plain activity-row-button"
      @click="openViewResultsMenuItems"
      v-tooltip.left="'View results'"
      data-testid="view-query-results-button"
    />
    <Menu ref="viewResultsMenu" id="view-results-menu" :model="viewResultsMenuItems" :popup="true" />

    <Button
      icon="fa-duotone fa-solid fa-trash"
      severity="danger"
      class="p-button-rounded p-button-text activity-row-button"
      @click="deleteQuery"
      v-tooltip.left="'Delete'"
      data-testid="delete-query-button"
    />
  </div>
  <Dialog v-model:visible="showErrorDialog" modal maximizable header="Error details">
    <div v-if="job.error.cause">
      <div>SQL Error: {{ job.error.cause.sqlMessage }}</div>
      <div>SQL Query:</div>
      <SQLViewer v-if="job.error.cause.sql" :sql="job.error.cause.sql" />
    </div>

    <div v-else>{{ job.error }}</div>
    <template #footer>
      <div class="im-dialog-footer">
        <div class="button-footer">
          <Button label="Close" @click="showErrorDialog = false" text />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { JobStatus } from "@@/enums";
import type { Job, QueryResultSummary } from "~~/models";

import { ref } from "vue";

import { isArrayHasLength } from "@endeavour/vue-library";

import type { MenuItem } from "primevue/menuitem";
import { useConfirm } from "primevue/useconfirm";

import SQLViewer from "./SQLViewer.vue";

interface Props {
  job: Job;
  resultSummary: QueryResultSummary[] | undefined;
}

const props = defineProps<Props>();

const emit = defineEmits({
  goToQuery: _payload => true,
  cancelQuery: _payload => true,
  viewQueryResults: _payload => true,
  deleteQuery: _payload => true,
  requeueQuery: _payload => true
});

const confirm = useConfirm();

const showErrorDialog = ref(false);
const viewResultsMenuItems: Ref<any[]> = ref([]);
const viewResultsMenu = ref();
const resultLoading = ref(false);

function openViewResultsMenuItems(event: MouseEvent): void {
  resultLoading.value = true;
  viewResultsMenuItems.value = [];
  for (const queryRequest of props.job.queryRequests) {
    const details = getResultDetails(queryRequest.query.iri);
    if (!details) {
      console.warn(`No result summary found for job ${props.job.id} query ${queryRequest.query.iri}`);
      continue;
    }
    const item: MenuItem = {
      label: "Results",
      items: [
        {
          label: `${details.primaryQueryResultsDetails.queryName} (${details.primaryQueryResultsDetails.totalCount})`,
          icon: "fa-duotone fa-solid fa-table-list",
          command: () => viewQueryResults(encodeURIComponent(queryRequest.query.iri), queryRequest.query.queryType)
        }
      ]
    };
    viewResultsMenuItems.value.push(item);
    viewResultsMenuItems.value.push({ separator: true });
    if (isArrayHasLength(details.subQueryResultsDetails)) {
      const subMenuItems: MenuItem = {
        label: "Sub queries",
        items: details.subQueryResultsDetails.map(subQuery => ({
          label: `    ${subQuery.queryName} (${subQuery.totalCount})`,
          icon: "fa-duotone fa-solid fa-table-list",
          command: () => viewQueryResults(encodeURIComponent(subQuery.queryIri), subQuery.queryType)
        }))
      };
      viewResultsMenuItems.value.push(subMenuItems);
    }
  }
  resultLoading.value = false;
  viewResultsMenu.value.toggle(event);
}

function goToQuery() {
  // emit("goToQuery", props.job.queryIri);
}

function cancelQuery() {
  confirm.require({
    message: "Are you sure you want to cancel query '" + props.job.jobName + "'?",
    header: "Confirm cancellation",
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "No",
      severity: "secondary",
      outlined: true
    },
    acceptProps: {
      label: "Yes"
    },
    accept: () => emit("cancelQuery", props.job.id),
    reject: () => confirm.close()
  });
}

function deleteQuery() {
  confirm.require({
    message: "Are you sure you want to delete query '" + props.job.jobName + "' from the queue?",
    header: "Confirm cancellation",
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "No",
      severity: "secondary",
      outlined: true
    },
    acceptProps: {
      label: "Yes"
    },
    accept: () => emit("deleteQuery", props.job.id),
    reject: () => confirm.close()
  });
}

async function viewQueryResults(queryIri: string, queryType: string) {
  await navigateTo({
    path: `/results/${props.job.id}/${queryType}/${queryIri}`
  });
}

function requeueQuery() {
  emit("requeueQuery", props.job.id);
}

function getResultDetails(queryIri: string):
  | {
      primaryQueryResultsDetails: QueryResultSummary;
      subQueryResultsDetails: QueryResultSummary[];
    }
  | undefined {
  const results = props.resultSummary;
  if (!results) return undefined;
  const details = results;
  const primaryQueryResultsDetails = details.find(d => d.queryIri === queryIri);
  if (!primaryQueryResultsDetails) return undefined;
  const subQueryIris = new Set(primaryQueryResultsDetails.subQueryIris ?? []);
  const subQueryResultsDetails = details.filter(d => subQueryIris.has(d.queryIri));
  return {
    primaryQueryResultsDetails: primaryQueryResultsDetails,
    subQueryResultsDetails: subQueryResultsDetails
  };
}

function showErrorDetails() {}
</script>

<style scoped>
.activity-row-button:hover {
  background-color: var(--p-text-color) !important;
  color: var(--p-content-background) !important;
  z-index: 999;
}
</style>
