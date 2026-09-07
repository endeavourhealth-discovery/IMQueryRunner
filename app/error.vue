<template>
  <div id="error-container" class="flex w-full flex-[1_0_auto] flex-col flex-nowrap justify-center items-center">
    <IMFontAwesomeIcon icon="fa-solid fa-bolt-lightning" size="10x" />
    <IMFontAwesomeIcon icon="fa-solid fa-robot" class="error-icon" size="10x" />
    <h1 class="error-code">{{ code }}</h1>
    <h2 class="error-header">{{ header }}</h2>
    <p class="error-text">
      <span>{{ message }}</span>
      <br v-if="requiredAccess.length" />
      <span v-if="requiredAccess.length">
        Missing:
        <div v-for="access of requiredAccess">
          <Tag :value="access" severity="warn" :rounded="true" />
        </div>
        permissions required to access this resource.
      </span>
      <br v-if="secondaryMessage" />
      <span v-if="secondaryMessage">{{ secondaryMessage }}</span>
      <br v-if="showConsoleMessage" />
      <span v-if="showConsoleMessage">Please check the console for details on this error.</span>
    </p>
    <div v-if="showReportBug">
      <Button label="Report bug" @click="routeToBugReport" />
    </div>
    <div class="button-container">
      <Button label="Back" @click="goBack" icon="fa-solid fa-arrow-left" />
      <Button label="Home" @click="goHome" icon="fa-solid fa-home" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ErrorCode } from "~~/enums";

import { IMFontAwesomeIcon } from "@endeavour/vue-library/components";
import { isArrayHasLength, isArrayOf, isObjectHasKeys } from "@endeavour/vue-library/helpers";

import { isString } from "lodash-es";
import { useRouter } from "vue-router";

const router = useRouter();
const error = useError();

const code = ref();
const header = ref("");
const message = ref("");
const secondaryMessage = ref("");
const showConsoleMessage = ref(true);
const requiredAccess: Ref<string[]> = ref([]);
const showReportBug = ref(false);

onMounted(() => {
  setErrorCode();
  setErrorCodeHeader();
  setErrorMessage();
  setRequiredAccess();
  setSecondaryMessage();
  setShowConsoleMessage();
  setShowReportBug();
});

function setErrorCode() {
  code.value = error.value?.status ?? 500;
}

function setErrorCodeHeader() {
  switch (error.value?.statusText) {
    case ErrorCode.AuthorisationError:
      header.value = "Access Denied / Forbidden";
      break;
    case ErrorCode.InternalServerError:
      header.value = "Internal Server Error";
      break;
    case ErrorCode.InvalidRequestError:
      header.value = "Bad Request";
      break;
    case ErrorCode.MissingDataError:
      header.value = "Missing Data";
      break;
    case ErrorCode.RabbitMQConsumerError:
      header.value = "Query Queue Error";
      break;
    default:
      header.value = "Unexpected error";
  }
}

function setErrorMessage() {
  switch (error.value?.statusText) {
    case ErrorCode.AuthorisationError:
      message.value = "The page or resource you were trying to reach is forbidden.";
      break;
    case ErrorCode.InternalServerError:
      message.value = "The server has encountered an unexpected error";
      break;
    case ErrorCode.InvalidRequestError:
      message.value = "The server has received an invalid request.";
      break;
    case ErrorCode.MissingDataError:
      message.value = "The data requested was not found in the database";
      break;
    case ErrorCode.RabbitMQConsumerError:
      message.value = "An unexpected error has occurred while processing the query.";
      break;
    default:
      message.value = "An unexpected error has occurred.";
  }
}

function setRequiredAccess() {
  const data = error.value?.data;
  if (data && isObjectHasKeys(data, ["requiredRole"]) && isArrayOf(data.requiredRole, isString) && isArrayHasLength(data.requiredRole)) {
    requiredAccess.value = data.requiredRole;
  }
}

function setSecondaryMessage() {
  switch (error.value?.statusText) {
    case ErrorCode.AuthorisationError:
      if (!requiredAccess.value.length) secondaryMessage.value = "Please contact an admin to request access to this resource";
      break;
    default:
      secondaryMessage.value = "";
  }
}

function setShowConsoleMessage() {
  switch (error.value?.statusText) {
    case ErrorCode.AuthorisationError:
      showConsoleMessage.value = false;
      break;
    default:
      showConsoleMessage.value = true;
  }
}

function setShowReportBug() {
  switch (error.value?.statusText) {
    case ErrorCode.AuthorisationError:
      showReportBug.value = false;
      break;
    default:
      showReportBug.value = true;
  }
}

function routeToBugReport() {
  clearError({ redirect: "/BugReport" });
}

async function goBack() {
  clearError();
  router.go(-1);
}

async function goHome() {
  clearError({ redirect: "/" });
}
</script>

<style scoped>
.error-icon {
  color: var(--p-red-500);
}

.error-code {
  color: var(--p-text-color);
  font-size: 6rem;
  margin: 1.5rem 0 0.5rem 0;
}

.error-header {
  color: var(--p-text-color);
  margin: 0.5rem;
}

.button-container {
  display: flex;
  flex-flow: row;
  gap: 1rem;
}
</style>
