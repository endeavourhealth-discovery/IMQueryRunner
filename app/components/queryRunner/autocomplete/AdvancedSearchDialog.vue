<template>
  <Dialog :style="{ width: 'min(1100px, 92vw)' }" :visible="true" header="Advanced search" modal @update:visible="emit('close')">
    <div class="flex h-[60vh] gap-4">
      <Tree
        v-model:selection-keys="selectionKeys"
        :loading="rootsLoading"
        :value="roots"
        class="w-2/5 overflow-auto"
        loading-mode="icon"
        selection-mode="single"
        @node-expand="expand"
        @node-select="onNodeSelect"
      >
        <template #default="{ node }">
          <span
            :class="{ 'font-bold': node.loadMorePage }"
            @dblclick="confirm(node.data)"
            @mouseenter="node.data && summary?.showOverlayTreeNode($event, node.data)"
            @mouseleave="summary?.hideOverlay()"
          >
            <IMFontAwesomeIcon v-if="node.data" :icon="getFAIconFromType(node.data.type)" :style="{ color: getColourFromType(node.data.type) }" fixed-width />
            {{ node.label }}
          </span>
        </template>
      </Tree>
      <div class="flex min-w-0 flex-1 flex-col gap-2">
        <form class="flex gap-2" @submit.prevent="runSearch(1)">
          <InputText v-model="term" aria-label="Search term" class="flex-1" placeholder="Search by name or IRI" />
          <Button :disabled="term.trim().length < MIN_SEARCH_LENGTH" :loading="searching" label="Search" type="submit" />
        </form>
        <Listbox
          v-model="candidate"
          :empty-message="error ?? (results ? 'No results' : `Enter at least ${MIN_SEARCH_LENGTH} characters to search, or browse the hierarchy`)"
          :option-label="displayName"
          :options="results?.entities ?? []"
          class="min-h-0 flex-1"
          data-key="iri"
          scroll-height="100%"
        >
          <template #option="{ option }">
            <div
              class="flex w-full justify-between gap-4"
              @dblclick="confirm(option)"
              @mouseenter="summary?.showOverlayTreeNode($event, option)"
              @mouseleave="summary?.hideOverlay()"
            >
              <span>{{ displayName(option) }}</span>
              <span class="text-sm whitespace-nowrap text-[var(--p-text-muted-color)]">{{ option.scheme?.name }}</span>
            </div>
          </template>
        </Listbox>
        <Paginator
          v-if="(results?.totalCount ?? 0) > PAGE_SIZE"
          :first="(page - 1) * PAGE_SIZE"
          :rows="PAGE_SIZE"
          :total-records="results?.totalCount"
          @page="runSearch($event.page + 1)"
        />
      </div>
    </div>
    <template #footer>
      <span class="flex-1 truncate">
        <template v-if="candidate"
          >Selected: <strong>{{ displayName(candidate) }}</strong
          ><em v-if="isFolder(candidate)"> (folders cannot be selected)</em></template
        >
        <template v-else>Nothing selected</template>
      </span>
      <Button label="Cancel" severity="secondary" @click="emit('close')" />
      <Button :disabled="!candidate || isFolder(candidate)" label="Select" @click="confirm(candidate)" />
    </template>
    <OverlaySummary ref="summary" />
  </Dialog>
</template>

<script lang="ts" setup>
import { MIN_SEARCH_LENGTH, SEARCH_TIMEOUT_MS, SearchTimeoutError, displayName, isAbortError, searchEntities } from "~/helpers/autocompleteSearch";
import EntityService from "~/services/EntityService";
import QueryService from "~/services/QueryService";

import { computed, onMounted, ref } from "vue";

import { IMFontAwesomeIcon, OverlaySummary } from "@endeavour/vue-library/components";
import { IM } from "@endeavour/vue-library/enums";
import { getColourFromType, getFAIconFromType } from "@endeavour/vue-library/helpers";
import type { ExtendedEntityReferenceNode, QueryRequest, SearchResponse, SearchResultSummary } from "@endeavour/vue-library/models";

import type { TreeNode } from "primevue/treenode";

const PAGE_SIZE = 20;
const TREE_PAGE_SIZE = 50;

const props = defineProps<{
  rootEntities: string[];
  imQuery?: QueryRequest;
  searchTerm?: string;
  selected?: SearchResultSummary;
}>();

const emit = defineEmits<{
  select: [entity: SearchResultSummary];
  close: [];
}>();

const rootHolders = ref<TreeNode[]>(props.rootEntities.map(iri => ({ key: iri, children: [] })));
const roots = computed(() => rootHolders.value.flatMap(holder => holder.children ?? []));
const rootsLoading = ref(false);
const selectionKeys = ref<Record<string, boolean>>({});
const term = ref(props.searchTerm ?? "");
const results = ref<SearchResponse | undefined>();
const searching = ref(false);
const error = ref<string | undefined>();
const page = ref(1);
const candidate = ref<SearchResultSummary | undefined>(props.selected);
const summary = ref<InstanceType<typeof OverlaySummary>>();
let controller: AbortController | undefined;

onMounted(async () => {
  rootsLoading.value = true;
  await Promise.all(rootHolders.value.map(holder => loadChildren(holder, 1)));
  rootsLoading.value = false;
  if (term.value.trim().length >= MIN_SEARCH_LENGTH) runSearch(1);
});

function isFolder(entity: SearchResultSummary) {
  return entity.type?.some(t => t.iri === IM.FOLDER) ?? false;
}

async function loadChildren(parent: TreeNode, pageNumber: number) {
  const response = await EntityService.getPagedChildren(parent.key, pageNumber, TREE_PAGE_SIZE);
  const children = (parent.children ?? []).filter(child => !child.loadMorePage);
  for (const entity of response.result as ExtendedEntityReferenceNode[]) {
    children.push({ key: entity.iri, label: entity.name, data: entity, leaf: !entity.hasChildren, children: [] });
  }
  if (children.length < response.totalCount) {
    children.push({
      key: `${parent.key}-more`,
      label: `Load more (${response.totalCount - children.length} remaining)`,
      leaf: true,
      loadMorePage: pageNumber + 1,
      parent
    });
  }
  parent.children = children;
}

async function expand(node: TreeNode) {
  if (node.children?.length) return;
  node.loading = true;
  await loadChildren(node, 1);
  node.loading = false;
}

async function onNodeSelect(node: TreeNode) {
  if (node.loadMorePage) {
    selectionKeys.value = {};
    await loadChildren(node.parent, node.loadMorePage);
  } else candidate.value = node.data;
}

async function runSearch(pageNumber: number) {
  if (term.value.trim().length < MIN_SEARCH_LENGTH) return;
  controller?.abort();
  const current = (controller = new AbortController());
  searching.value = true;
  error.value = undefined;
  page.value = pageNumber;
  try {
    results.value = await searchEntities(QueryService.queryIMSearch, props.imQuery, {
      text: term.value.trim(),
      pageNumber,
      pageSize: PAGE_SIZE,
      timeoutMs: SEARCH_TIMEOUT_MS,
      signal: current.signal
    });
  } catch (e) {
    if (isAbortError(e) && controller !== current) return;
    results.value = undefined;
    error.value = e instanceof SearchTimeoutError ? e.message : "Search failed. Please try again.";
  } finally {
    if (controller === current) searching.value = false;
  }
}

function confirm(entity: SearchResultSummary | undefined) {
  if (!entity || isFolder(entity)) return;
  summary.value?.hideOverlay();
  emit("select", entity);
}
</script>
