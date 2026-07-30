<template>
  <DataTable :value="argumentList" :lazy="true" :loading="loading">
    <template #empty>None</template>
    <Column field="parameter" header="Parameter">
      <template #body="{ data }">{{ formatArgumentDisplayName(data) }} </template>
    </Column>
    <Column field="parameter" header="Raw Parameter"></Column>
    <Column v-if="includeIri" field="referenceIri.iri" header="Reference Iri"></Column>
    <Column field="valueData" header="Value">
      <template #body="{ data }">
        <div class="argument-selector-content">
          <div v-if="editArguments && data.parameter === '$organisationId'">
            <OrganisationSelect v-model="data.valueDataList" />
          </div>
          <div v-else-if="editArguments && data.parameter === '$patientId'">
            <PatientFilter v-model="data.valueDataList" />
          </div>
          <div v-else-if="editArguments && data.parameter === '$debugPatientId'" class="flex flex-col gap-2">
            <InputText type="text" v-model="data.valueData" placeholder="Enter patient id" data-testid="debug-patient-id-input" />
            <small class="text-color-secondary"> Run query against a single patient id and get a step-by-step report. </small>
          </div>
          <div v-else-if="editArguments && data.parameter === '$searchDate'" class="flex flex-col gap-2">
            <DatePicker v-model="data.valueData" dateFormat="yy-mm-dd" showIcon iconDisplay="input" updateModelType="string" data-testid="search-date-input" />
            <small class="text-color-secondary"> Run query on a specific date. </small>
          </div>
          <div v-else-if="editArguments && data.dataType && [XSD.STRING].includes(data.dataType?.iri)">
            <InputText type="text" v-model="data.valueData" data-testid="property-value-input" />
          </div>
          <div v-else-if="editArguments && data.dataType && [XSD.BOOLEAN].includes(data.dataType.iri)">
            <Select :options="booleanOptions" optionLabel="name" optionValue="value" v-model="data.valueData" />
          </div>
          <div v-else-if="editArguments && data.dataType && [IM.DATE, IM.DATE_TIME, IM.TIME].includes(data.dataType.iri)">
            <DatePicker
              v-model="data.valueData"
              :showTime="IM.DATE_TIME === data.dataType.iri"
              :timeOnly="IM.TIME === data.dataType.iri"
              dateFormat="yy/mm/dd"
              showIcon
              iconDisplay="input"
              updateModelType="string"
            />
          </div>
          <div v-else>{{ data.valueData ?? data.valueDataList }}</div>
        </div>
      </template>
    </Column>
  </DataTable>
  <div v-if="showFooterButtons" class="button-container">
    <Button label="Back" @click="resetArguments()" severity="secondary" />
    <Button label="Confirm" @click="confirmArguments" :loading="submitting" :disabled="!allArgumentsValid" />
  </div>
</template>

<script setup lang="ts">
import OrganisationSelect from "~/components/queryRunner/OrganisationSelect.vue";

import { watch } from "vue";

import type { Argument, ArgumentReference } from "@endeavour/vue-library";
import { IM, XSD } from "@endeavour/vue-library/enums";

import { cloneDeep } from "lodash-es";
import Column from "primevue/column";

import PatientFilter from "./PatientFilter.vue";

interface Props {
  arguments: ArgumentReference[] | undefined;
  runOnConfirm?: boolean;
  showFooterButtons: boolean;
  editArguments: boolean;
}

interface ArgumentSelection extends ArgumentReference {
  valueData?: any;
  valueDataList?: string[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  argumentsCompleted: [payload: Argument[], boolean];
  hideDialog: [payload: boolean];
}>();

const showDialog = defineModel<boolean>("showDialog");
const allArgumentsValid: ComputedRef<boolean> = computed(() =>
  argumentList.value!.every(as => {
    if (as.parameter === "$organisationId" || as.parameter === "$patientId") return as.valueDataList && as.valueDataList.length > 0;
    if (as.parameter === "$debugPatientId") return !as.valueData || /^\d+$/.test(as.valueData.toString().trim());
    if (as.parameter === "$searchDate") return true;
    return !!as.valueData;
  })
);
const loading = ref(false);
const includeIri = ref(false);
const argumentList = ref<ArgumentSelection[] | undefined>([]);
const submitting = ref(false);
const booleanOptions = ref([
  { name: "true", value: true },
  { name: "false", value: false }
]);

onMounted(() => {
  argumentList.value = cloneDeep(props.arguments);
  if (argumentList.value) {
    for (let arg of argumentList.value) {
      if (arg.referenceIri) {
        includeIri.value = true;
        break;
      }
      includeIri.value = false;
    }
  }
});

watch(
  () => cloneDeep(argumentList.value),
  newValue => {
    if (newValue) {
      confirmArguments();
    }
  }
);

function formatArgumentDisplayName(arg: Argument) {
  const result = arg
    .parameter!.replace("$", "")
    .replace(/([A-Z])/g, " $1")
    .toLowerCase();
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function resetArguments() {
  showDialog.value = false;
  argumentList.value = cloneDeep(props.arguments);
  emit("hideDialog", false);
}

function confirmArguments() {
  submitting.value = true;
  try {
    const completedArguments: Argument[] = [];
    for (const argSelect of argumentList.value ?? []) {
      if (!argSelect.parameter) continue;
      const newArg: Argument = { parameter: argSelect.parameter };
      if (argSelect.parameter === "$debugPatientId" || argSelect.parameter === "$searchDate") {
        const cleaned = argSelect.valueData?.toString().trim();
        if (cleaned) {
          newArg.valueData = cleaned;
          completedArguments.push(newArg);
        }
        continue;
      }
      if (["$organisationId", "$patientId"].includes(argSelect.parameter)) {
        const cleanedList = (argSelect.valueDataList ?? []).map(value => value?.toString().trim()).filter((value): value is string => !!value);
        const uniqueList = Array.from(new Set(cleanedList));
        if (uniqueList.length > 0) {
          newArg.valueDataList = uniqueList;
          completedArguments.push(newArg);
        }
        continue;
      }
      switch (argSelect.dataType?.iri) {
        case XSD.STRING:
        case XSD.BOOLEAN:
        case IM.DATE:
        case IM.DATE_TIME:
        case IM.TIME:
          if (argSelect.valueData !== undefined && argSelect.valueData !== null && argSelect.valueData !== "") {
            newArg.valueData = argSelect.valueData;
            newArg.dataType = argSelect.dataType;
            completedArguments.push(newArg);
          }
          break;
        default:
          if (argSelect.valueData !== undefined && argSelect.valueData !== null && argSelect.valueData !== "") {
            newArg.valueData = argSelect.valueData;
            if (argSelect.dataType) {
              newArg.dataType = argSelect.dataType;
            }
            completedArguments.push(newArg);
          }
          break;
      }
    }
    emit("argumentsCompleted", completedArguments, props.runOnConfirm ?? false);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.button-container {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin: 0.5rem;
}
</style>
