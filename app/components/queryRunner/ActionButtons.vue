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
    <div>{{ job.error }}</div>
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
import type { Job } from "~~/models";

import { ref } from "vue";

import { useConfirm } from "primevue/useconfirm";

interface Props {
  job: Job;
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

function openViewResultsMenuItems(event: MouseEvent): void {
  for (const queryRequest of props.job.queryRequests) {
    const item = {
      label: `View results for "${queryRequest.query.iri}"`,
      icon: "fa-duotone fa-solid fa-table-list",
      command: () => viewQueryResults(encodeURIComponent(queryRequest.query.iri), queryRequest.query.queryType),
      visible: false
    };
    item.visible = true;
    viewResultsMenuItems.value.push(item);
  }

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

function showErrorDetails() {}
</script>

<style scoped>
.activity-row-button:hover {
  background-color: var(--p-text-color) !important;
  color: var(--p-content-background) !important;
  z-index: 999;
}
</style>
