<template>
  <div class="flex w-full max-w-[40rem] gap-2">
    <AutoComplete
      v-model="value"
      :delay="SEARCH_DEBOUNCE_MS"
      :empty-search-message="error ?? 'No results'"
      :input-id="id"
      :min-length="MIN_SEARCH_LENGTH"
      :option-label="displayName"
      :placeholder="placeholder"
      :suggestions="results?.entities ?? []"
      class="min-w-0 flex-1"
      fluid
      show-clear
      @blur="onBlur"
      @clear="selected = undefined"
      @complete="search($event.query)"
      @option-select="selected = $event.value"
    >
      <template #option="{ option }">
        <div class="flex w-full justify-between gap-4" @mouseenter="summary?.showOverlayTreeNode($event, option)" @mouseleave="summary?.hideOverlay()">
          <span>{{ displayName(option) }}</span>
          <span class="text-sm whitespace-nowrap text-[var(--p-text-muted-color)]">{{ option.scheme?.name }}</span>
        </div>
      </template>
      <template #footer>
        <div v-if="results?.entities?.length" class="flex items-center justify-between px-3 py-2 text-sm text-[var(--p-text-muted-color)]">
          <span>Showing {{ results.entities.length }} of {{ results.totalCount }} results</span>
          <Button v-if="(results.totalCount ?? 0) > results.entities.length" label="View all" link size="small" @click="openDialog(term)" />
        </div>
      </template>
    </AutoComplete>
    <Button aria-label="Advanced search" data-testid="advanced-search-button" icon="fa-solid fa-list" title="Advanced search" @click="openDialog()" />
    <OverlaySummary ref="summary" />
    <AdvancedSearchDialog
      v-if="dialogOpen"
      :im-query="imQuery"
      :root-entities="rootEntities"
      :search-term="dialogTerm"
      :selected="selected"
      @close="dialogOpen = false"
      @select="onDialogSelect"
    />
  </div>
</template>

<script lang="ts" setup>
import AdvancedSearchDialog from "~/components/queryRunner/autocomplete/AdvancedSearchDialog.vue";
import {
  MIN_SEARCH_LENGTH,
  SEARCH_DEBOUNCE_MS,
  SEARCH_TIMEOUT_MS,
  SearchTimeoutError,
  displayName,
  isAbortError,
  searchEntities
} from "~/helpers/autocompleteSearch";
import QueryService from "~/services/QueryService";

import { ref, shallowRef, watch } from "vue";

import { OverlaySummary } from "@endeavour/vue-library/components";
import type { QueryRequest, SearchResponse, SearchResultSummary } from "@endeavour/vue-library/models";

const props = withDefaults(
  defineProps<{
    imQuery?: QueryRequest;
    rootEntities: string[];
    placeholder?: string;
    id?: string;
  }>(),
  { placeholder: "Search by name or IRI" }
);

const selected = defineModel<SearchResultSummary | undefined>("selected");

const value = ref<SearchResultSummary | string | undefined>(selected.value);
const term = ref("");
const results = shallowRef<SearchResponse | undefined>();
const error = ref<string | undefined>();
const summary = ref<InstanceType<typeof OverlaySummary>>();
const dialogOpen = ref(false);
const dialogTerm = ref("");
let controller: AbortController | undefined;

watch(selected, entity => (value.value = entity));

async function search(query: string) {
  term.value = query;
  error.value = undefined;
  controller?.abort();
  const current = (controller = new AbortController());
  try {
    results.value = await searchEntities(QueryService.queryIMSearch, props.imQuery, { text: query, timeoutMs: SEARCH_TIMEOUT_MS, signal: current.signal });
  } catch (e) {
    if (isAbortError(e) && controller !== current) return;
    results.value = { entities: [] } as SearchResponse;
    error.value = e instanceof SearchTimeoutError ? e.message : "Search failed. Please try again.";
  }
}

function onBlur() {
  if (value.value === "") selected.value = undefined;
  else if (typeof value.value === "string") value.value = selected.value;
}

function openDialog(withTerm = "") {
  summary.value?.hideOverlay();
  dialogTerm.value = withTerm;
  dialogOpen.value = true;
}

function onDialogSelect(entity: SearchResultSummary) {
  selected.value = entity;
  dialogOpen.value = false;
}
</script>
