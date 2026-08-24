<template>
  <div class="flex flex-col gap-2">
    <label for="patientIds" class="font-medium">Patient IDs</label>
    <AutoComplete
      inputId="patientIds"
      :modelValue="patientIds"
      @update:modelValue="onUpdateModelValue"
      :suggestions="[]"
      multiple
      :typeahead="false"
      :dropdown="false"
      placeholder="Enter one or more patient IDs"
      class="w-full"
    />

    <small class="text-color-secondary"> Run query against a specific set of patients. Enter multiple patient IDs and press Enter after each one. </small>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

import AutoComplete from "primevue/autocomplete";

const toast = useToast();

const props = defineProps<{
  modelValue: string[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string[]): void;
}>();
const patientIds = ref<string[]>([]);

watch(
  () => props.modelValue,
  val => {
    patientIds.value = val;
  }
);

function validate(value: string): boolean {
  const valResult = /^\d+$/.test(value);
  if (!valResult) {
    toast.add({
      severity: "warn",
      summary: "Invalid Patient ID",
      detail: `Patient ID "${value}" is invalid. Please enter a valid numeric patient ID.`,
      life: 5000
    });
    console.warn(`Patient ID "${value}" is invalid.`);
  }
  return valResult;
}

function onUpdateModelValue(value: string[]) {
  patientIds.value = value.filter(id => validate(id));
  emit("update:modelValue", patientIds.value);
}
</script>

<style scoped></style>
