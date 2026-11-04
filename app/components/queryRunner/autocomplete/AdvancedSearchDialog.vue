<template>
  <dialog ref="dialog" aria-labelledby="imsb-dialog-title" class="imsb-dialog" @cancel="summary?.hide()" @close="emit('close')">
    <header>
      <h2 id="imsb-dialog-title">{{ title }}</h2>
      <button aria-label="Close" class="icon-button" type="button" @click="emit('close')">
        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.75" /></svg>
      </button>
    </header>

    <div class="body">
      <section aria-label="Hierarchy" class="tree-pane">
        <h3>Browse</h3>
        <p v-if="rootsLoading" class="status"><span aria-hidden="true" class="imsb-spinner"></span> Loading hierarchy…</p>
        <p v-else-if="rootsError" class="status error">{{ rootsError }} <button class="link" type="button" @click="loadRoots">Retry</button></p>
        <ul v-else aria-label="Entity hierarchy" role="tree">
          <EntityTreeNode
            v-for="root in roots"
            :key="root.iri"
            :node="root"
            :selected-iri="candidate?.iri"
            @activate="confirm(nodeToSummary($event))"
            @hover="hover"
            @select="candidate = nodeToSummary($event)"
          />
        </ul>
      </section>

      <section aria-label="Search results" class="results-pane">
        <form class="search-row" @submit.prevent="runSearch(1)">
          <input v-model="term" aria-label="Search term" autocomplete="off" placeholder="Search by name or IRI" type="search" />
          <button :disabled="term.trim().length < minSearchLength" class="button" type="submit">Search</button>
        </form>

        <div :aria-busy="resultsLoading" class="results">
          <p v-if="resultsLoading" class="status"><span aria-hidden="true" class="imsb-spinner"></span> Searching…</p>
          <p v-else-if="resultsError" class="status error" role="alert">{{ resultsError }}</p>
          <p v-else-if="!results" class="status">Enter at least {{ minSearchLength }} characters to search, or browse the hierarchy.</p>
          <p v-else-if="!results.entities?.length" class="status">No results</p>
          <ul v-else aria-label="Results" role="listbox">
            <li
              v-for="entity in results.entities"
              :key="entity.iri"
              :aria-selected="candidate?.iri === entity.iri"
              :class="{ selected: candidate?.iri === entity.iri }"
              role="option"
              tabindex="0"
              @click="candidate = entity"
              @dblclick="confirm(entity)"
              @keydown.enter="confirm(entity)"
              @mouseenter="hover($event.currentTarget as HTMLElement, entity)"
              @mouseleave="hover($event.currentTarget as HTMLElement, undefined)"
            >
              <span class="name">{{ displayName(entity) }}</span>
              <span class="meta">{{ [entity.code, entity.scheme?.name].filter(Boolean).join(" · ") }}</span>
            </li>
          </ul>
        </div>

        <nav v-if="results?.totalCount" aria-label="Result pages" class="pager">
          <span>
            Showing {{ (pageNumber - 1) * pageSize + 1 }}–{{ (pageNumber - 1) * pageSize + (results.entities?.length ?? 0) }} of {{ results.totalCount }}
          </span>
          <span class="pager-buttons">
            <button :disabled="pageNumber <= 1 || resultsLoading" class="button" type="button" @click="runSearch(pageNumber - 1)">Previous</button>
            <span>Page {{ pageNumber }} of {{ totalPages }}</span>
            <button :disabled="pageNumber >= totalPages || resultsLoading" class="button" type="button" @click="runSearch(pageNumber + 1)">Next</button>
          </span>
        </nav>
      </section>
    </div>

    <footer>
      <span :title="candidate?.iri" class="current">
        <template v-if="candidate">
          Selected: <strong>{{ displayName(candidate) }}</strong>
          <em v-if="candidateIsFolder && !allowFolderSelection"> (folders cannot be selected)</em>
        </template>
        <template v-else>Nothing selected</template>
      </span>
      <button class="button" type="button" @click="emit('close')">Cancel</button>
      <button :disabled="!canSelect" class="button primary" type="button" @click="confirm()">Select</button>
    </footer>

    <EntitySummaryPopover ref="summary" />
  </dialog>
</template>

<script lang="ts" setup>
import EntitySummaryPopover from "~/components/queryRunner/autocomplete/EntitySummaryPopover.vue";
import EntityTreeNode from "~/components/queryRunner/autocomplete/EntityTreeNode.vue";
import { IM_INFORMATION_MODEL, displayName, isAbortError, isFolder, searchEntities } from "~/helpers/autocompleteSearch";
import EntityService from "~/services/EntityService";
import QueryService from "~/services/QueryService";

import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import type { ExtendedEntityReferenceNode, QueryRequest, SearchResponse, SearchResultSummary } from "@endeavour/vue-library/models";

const props = withDefaults(
  defineProps<{
    title?: string;
    rootEntities?: string[];
    imQuery?: QueryRequest;
    searchTerm?: string;
    selected?: SearchResultSummary;
    pageSize?: number;
    searchTimeoutMs?: number;
    minSearchLength?: number;
    allowFolderSelection?: boolean;
  }>(),
  {
    title: "Advanced search",
    rootEntities: () => [],
    searchTerm: "",
    pageSize: 20,
    searchTimeoutMs: 10000,
    minSearchLength: 3,
    allowFolderSelection: false
  }
);

const emit = defineEmits<{
  select: [entity: SearchResultSummary];
  close: [];
}>();

const dialog = ref<HTMLDialogElement>();
const summary = ref<InstanceType<typeof EntitySummaryPopover>>();
const term = ref(props.searchTerm);
const roots = ref<ExtendedEntityReferenceNode[]>([]);
const rootsLoading = ref(false);
const rootsError = ref<string | undefined>();
const results = ref<SearchResponse | undefined>();
const resultsLoading = ref(false);
const resultsError = ref<string | undefined>();
const pageNumber = ref(1);
const candidate = ref<SearchResultSummary | undefined>(props.selected);
let controller: AbortController | undefined;

const totalPages = computed(() => Math.max(1, Math.ceil((results.value?.totalCount ?? 0) / props.pageSize)));
const candidateIsFolder = computed(() => isFolder(candidate.value?.type));
const canSelect = computed(() => !!candidate.value && (props.allowFolderSelection || !candidateIsFolder.value));

onMounted(() => {
  dialog.value?.showModal();
  loadRoots();
  if (term.value.trim().length >= props.minSearchLength) runSearch(1);
});

onBeforeUnmount(() => controller?.abort());

async function loadRoots() {
  rootsLoading.value = true;
  rootsError.value = undefined;
  try {
    roots.value = props.rootEntities.length
      ? await EntityService.getAsEntityReferenceNodes(props.rootEntities)
      : (((await EntityService.getPagedChildren(IM_INFORMATION_MODEL, 1, 100)).result ?? []) as ExtendedEntityReferenceNode[]);
  } catch (e) {
    rootsError.value = e instanceof Error ? e.message : "Failed to load hierarchy";
  } finally {
    rootsLoading.value = false;
  }
}

async function runSearch(page: number) {
  const text = term.value.trim();
  if (text.length < props.minSearchLength) {
    results.value = undefined;
    return;
  }
  controller?.abort();
  const current = (controller = new AbortController());
  resultsLoading.value = true;
  resultsError.value = undefined;
  pageNumber.value = page;
  try {
    results.value = await searchEntities(QueryService.queryIMSearch, props.imQuery, {
      text,
      pageNumber: page,
      pageSize: props.pageSize,
      timeoutMs: props.searchTimeoutMs,
      signal: current.signal
    });
  } catch (e) {
    if (isAbortError(e) && controller !== current) return;
    results.value = undefined;
    resultsError.value = e instanceof Error && e.name === "SearchTimeoutError" ? e.message : "Search failed. Please try again.";
  } finally {
    if (controller === current) resultsLoading.value = false;
  }
}

function nodeToSummary(node: ExtendedEntityReferenceNode): SearchResultSummary {
  return { iri: node.iri, name: node.name, description: node.description, type: node.type, status: node.status, scheme: node.scheme } as SearchResultSummary;
}

function confirm(entity = candidate.value) {
  if (!entity) return;
  if (isFolder(entity.type) && !props.allowFolderSelection) return;
  summary.value?.hide();
  emit("select", entity);
}

function hover(target: HTMLElement, entity: SearchResultSummary | ExtendedEntityReferenceNode | undefined) {
  if (entity) summary.value?.show(target, entity as SearchResultSummary);
  else summary.value?.hide();
}
</script>

<style scoped>
.imsb-dialog {
  width: min(1100px, 92vw);
  height: min(780px, 88vh);
  max-width: none;
  max-height: none;
  margin: auto;
  padding: 0;
  border: 1px solid var(--imsb-border);
  border-radius: var(--imsb-radius-lg);
  background: var(--imsb-surface);
  color: var(--imsb-text);
  box-shadow: var(--imsb-shadow-lg);
  font: inherit;
  font-size: var(--imsb-font-size);
  line-height: 1.45;
}
.imsb-dialog[open] {
  display: flex;
  flex-direction: column;
}
.imsb-dialog::backdrop {
  background: rgb(15 23 42 / 0.45);
}
header,
footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--imsb-border);
}
footer {
  border-bottom: 0;
  border-top: 1px solid var(--imsb-border);
}
h2 {
  flex: 1;
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
}
h3 {
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--imsb-text-muted);
}
.body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(220px, 2fr) 3fr;
}
.tree-pane,
.results-pane {
  min-height: 0;
  overflow: auto;
  padding: 0.75rem 1rem;
}
.tree-pane {
  border-right: 1px solid var(--imsb-border);
}
.results-pane {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.tree-pane > ul,
.results ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.search-row {
  display: flex;
  gap: 0.5rem;
}
.search-row input {
  flex: 1;
  min-width: 0;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--imsb-border);
  border-radius: var(--imsb-radius);
  background: var(--imsb-input-bg);
  color: inherit;
  font: inherit;
}
.search-row input:focus {
  outline: none;
  border-color: var(--imsb-accent);
  box-shadow: 0 0 0 3px var(--imsb-focus-ring);
}
.results {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
.results li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.45rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}
.results li:hover {
  background: var(--imsb-hover);
}
.results li.selected {
  background: var(--imsb-selected);
}
.results li:focus-visible {
  outline: 2px solid var(--imsb-accent);
  outline-offset: -2px;
}
.meta {
  flex: none;
  max-width: 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8125rem;
  color: var(--imsb-text-muted);
}
.pager {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--imsb-text-muted);
}
.pager-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.current {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
}
.status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0;
  color: var(--imsb-text-muted);
}
.status.error {
  color: var(--imsb-danger);
}
.button {
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--imsb-border);
  border-radius: var(--imsb-radius);
  background: var(--imsb-surface);
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.button.primary {
  background: var(--imsb-accent);
  border-color: var(--imsb-accent);
  color: var(--imsb-accent-contrast);
}
.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.icon-button {
  display: inline-flex;
  padding: 0.25rem;
  border: 0;
  border-radius: 4px;
  background: none;
  color: inherit;
  cursor: pointer;
}
.icon-button:hover {
  background: var(--imsb-hover);
}
.link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--imsb-accent);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}
</style>
