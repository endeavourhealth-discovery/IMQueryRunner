<template>
  <MultiSelect
    v-model="internalValue"
    :options="organisations"
    optionLabel="label"
    optionValue="id"
    placeholder="Select organisations"
    filter
    :loading="loading"
    class="w-full"
    @update:modelValue="emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string | string[] | undefined;
  multiple?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string | string[]): void;
}>();

const internalValue = ref(props.modelValue);
const organisations = ref<{ id: string; odsCode: string; name: string; label: string }[]>([]);
const loading = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    organisations.value = await $fetch<{ id: string; odsCode: string; name: string; label: string }[]>("/api/organisation");
  } finally {
    loading.value = false;
  }
});

watch(
  () => props.modelValue,
  val => {
    internalValue.value = val;
  }
);
</script>
