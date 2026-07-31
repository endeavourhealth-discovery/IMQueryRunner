<template>
  <div class="search-container" ref="autocompleteRoot">
    <IconField class="autocomplete-search" iconPosition="right">
      <!--
      <InputIcon v-if="!searchLoading && !listening" class="pi pi-microphone mic" :class="{ listening }" @click="toggleListen" />
-->
      <InputText
        id="autocomplete-search"
        ref="searchInput"
        :disabled="disabled"
        v-model="searchText"
        :placeholder="searchPlaceholder"
        data-testid="search-input"
        @input="debounceForSearch"
        @keydown.down="select"
        @keydown.enter="onEnter"
        @keydown.up="select"
        @focus="handleFocus"
        @blur="editing = false"
        @mouseover="selected?.iri != 'any'"
        :pt="{
          root: { autocomplete: allowBrowserAutocomplete ? 'on' : 'off' }
        }"
      />
      <i v-if="editing" class="fa fa-times-circle clear-icon" @mousedown.prevent="clearSearch()"></i>
    </IconField>
    <Button
      class="search-button px-2"
      :disabled="disabled"
      @click="advancedSearch"
      data-testid="autocomplete-search-button"
      icon="fa-solid fa-magnifying-glass"
      label="Advanced"
    />
    <Popover ref="resultsOP" :breakpoints="{ '960px': '75vw', '640px': '100vw' }" :style="{ width: '450px' }" appendTo="body">
      <div v-if="searchLoading" class="loading-container">
        <ProgressSpinner />
      </div>
      <div v-else class="results-container" :tabindex="0">
        <Listbox v-if="results?.entities" v-model="listBoxSelected" :options="results.entities">
          <template #option="slotProps">
            <div class="listbox-item" @mouseover="slotProps.option.iri != 'any'" @click="onListBoxOptionClick(slotProps.option)">
              <span>{{ slotProps.option.bestMatch ? slotProps.option.bestMatch : slotProps.option.name }}</span>
            </div>
          </template>
        </Listbox>
        <div v-else>No results</div>

        <div class="advanced-search-container">
          <small>
            Showing {{ results?.entities?.length ? 1 : 0 }}-{{ results?.entities?.length ? results.entities.length : 0 }} of
            {{ results?.count ? results.count : 0 }} results
          </small>
        </div>
      </div>
    </Popover>
  </div>
  <Dialog v-model:visible="showDialog" modal :closable="false">
    <Tree
      v-model:expandedKeys="expandedKeys"
      v-model:selectionKeys="selectedKeys"
      selectionMode="single"
      @nodeSelect="onNodeSelect"
      :loading="loading"
      loadingMode="icon"
      :value="entities"
      @nodeExpand="onNodeExpand"
      class="dialog w-full md:w-[30rem]"
    ></Tree>
    <template #footer>
      <Button class="m-1" label="Cancel" variant="outlined" @click="showDialog = false" />
      <Button class="m-1" label="Select" :disabled="!isQuery" @click="setSelectedQuery" autofocus />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { useAutocompleteRegistry } from "~/composables/useAutocompleteRegistry";
import EntityService from "~/services/EntityService";
import QueryService from "~/services/QueryService";

import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { IM, TextSearchStyle } from "@endeavour/vue-library/enums";
import { type QueryRequest, type SearchResponse, type SearchResultSummary, type TTIriRef } from "@endeavour/vue-library/models";

import { cloneDeep, debounce, isEqual } from "lodash-es";
import type { TreeNode } from "primevue/treenode";

const { registerAutocomplete, unregisterAutocomplete } = useAutocompleteRegistry();

interface Props {
  selected?: SearchResultSummary;
  disabled?: boolean;
  rootEntities?: string[];
  searchPlaceholder?: string;
  quickTypeFiltersAllowed?: string[];
  selectedQuickTypeFilter?: string;
  allowBrowserAutocomplete?: boolean;
  setupSearch?: () => Promise<QueryRequest>;
  setupRootEntities?: () => Promise<string[]>;
  validEntityQuery?: QueryRequest;
}

const props = withDefaults(defineProps<Props>(), {
  rootEntities: () => [] as string[],
  allowBrowserAutocomplete: false
});

const emit = defineEmits<{
  "update:selected": [payload: SearchResultSummary | undefined];
  openDialog: [];
}>();

const imQuery = defineModel<any>("imQuery");
const resultsOP = ref();
const searchText = ref("");
const results: Ref<SearchResponse | undefined> = ref();
const showDialog = ref(false);
const selectedLocal: Ref<SearchResultSummary | undefined> = ref();
const searchLoading: Ref<boolean> = ref(false);
const searchPlaceholder: Ref<string> = ref(props.searchPlaceholder ?? "Search");
const selectedIndex: Ref<number> = ref(-1);
const listBoxSelected: Ref<SearchResultSummary | undefined> = ref();
const selectedQuery: Ref<TreeNode | undefined> = ref();
const searchInput = ref<any>(null);
const entities = ref<any[]>([]);
const expandedKeys = ref({});
const selectedKeys = ref({});
const isQuery = ref(false);
const loading = ref(false);
let searchDebounce: any;
const editing = ref(false);
const autocompleteRoot = ref<HTMLElement | null>(null);

defineExpose({ searchText });
watch(
  () => cloneDeep(props.selected),
  (newValue, oldValue) => {
    if (!isEqual(newValue, oldValue)) {
      searchLoading.value = true;
      if (newValue && (newValue.name || newValue.bestMatch)) {
        searchText.value = newValue.bestMatch ? newValue.bestMatch : newValue.name!;
        selectedLocal.value = newValue;
      } else {
        searchText.value = "";
        selectedLocal.value = undefined;
      }
      searchLoading.value = false;
    }
  }
);

watch(
  selectedKeys,
  (newValue, oldValue) => {
    if (newValue !== oldValue) {
    }
  },
  { deep: true }
);

watch(
  selectedLocal,
  (newValue, oldValue) => {
    if (newValue?.iri !== oldValue?.iri) {
      if (newValue?.name) {
        searchText.value = newValue!.name ? newValue!.name : "";
      }
      emit("update:selected", newValue);
    }
  },
  { deep: true }
);

watch(searchText, newValue => {
  if (!newValue) {
    selectedLocal.value = undefined;
  }
});

onMounted(async () => {
  searchLoading.value = true;
  if (props.selected?.name) {
    searchText.value = props.selected.name;
    selectedLocal.value = props.selected;
  }
  if (autocompleteRoot.value) {
    registerAutocomplete({
      element: autocompleteRoot.value,
      reset: () => {
        searchText.value = props.selected && props.selected.name ? props.selected.name : "";
      }
    });
  }
  searchLoading.value = false;
  await getInitialTreeEntities();
});

onBeforeUnmount(() => {
  if (autocompleteRoot.value) {
    unregisterAutocomplete(autocompleteRoot.value);
  }
});

function handleGlobalFocus(event: FocusEvent) {
  const root = autocompleteRoot.value;
  if (!root) return;
  const target = event.target as Node;
  if (!root.contains(target)) {
    if (props.selected && props.selected.name) searchText.value = props.selected.name;
    else searchText.value = "";
  }
}
function clearSearch() {
  searchText.value = "";
  selectedLocal.value = undefined;
  nextTick(() => {
    searchInput.value.$el.focus();
  });
}
function handleFocus(event: FocusEvent) {
  if (!editing.value) {
    editing.value = true;
    (event.target as HTMLInputElement).select();
  }
}

async function advancedSearch() {
  showDialog.value = !showDialog.value;
}

async function getInitialTreeEntities() {
  loading.value = true;
  const retrievedEntities = await EntityService.getEntityChildren("http://endhealth.info/im#Q_Queries");
  for (const entity of retrievedEntities) {
    const type = entity.type as TTIriRef[];
    entities.value.push({
      key: entity.iri,
      label: entity.name,
      data: type[0]!.iri,
      icon: "fa-solid fa-folder",
      children: [],
      loading: false
    });
    if (entity.hasChildren) {
      const retrievedChildEntities = await EntityService.getEntityChildren(entity.iri);
      for (const childEntity of retrievedChildEntities) {
        let icon = "fa-magnifying-glass";
        if (childEntity.hasChildren) icon = "fa-folder";
        const childType = childEntity.type as TTIriRef[];
        const found = entities.value.find(e => e.key === entity.iri);
        found.children.push({
          key: childEntity.iri,
          label: childEntity.name,
          data: childType[0]!.iri,
          icon: "fa-solid " + icon,
          children: [],
          loading: false
        });
      }
    }
  }
  loading.value = false;
}

const onNodeExpand = async (node: any) => {
  for (const child in node.children) {
    if (node.children[child].children.length === 0 && node.children[child].icon === "fa-solid fa-folder") {
      node.children[child].loading = true;
      const retrievedEntities = await EntityService.getEntityChildren(node.children[child].key);
      let children = [];
      for (const entity of retrievedEntities) {
        let icon = "fa-magnifying-glass";
        if (entity.hasChildren) icon = "fa-folder";
        const type = entity.type as TTIriRef[];
        children.push({
          key: entity.iri,
          label: entity.name,
          data: type[0]!.iri,
          icon: "fa-solid " + icon,
          children: [],
          loading: false
        });
      }
      node.children[child].children = children;
      node.children[child].loading = false;
    }
  }
};

function onNodeSelect(node: TreeNode) {
  isQuery.value = node.data === IM.QUERY;
  selectedQuery.value = node;
}

function setSelectedQuery() {
  selectedLocal.value = {
    iri: selectedQuery.value?.key,
    scheme: { iri: "" } as TTIriRef,
    status: { iri: "" } as TTIriRef,
    type: [] as TTIriRef[],
    name: selectedQuery.value?.label
  } as SearchResultSummary;
  showDialog.value = false;
}

function debounceForSearch(event: Event): void {
  if (!searchText.value) {
    selectedLocal.value = undefined;
    editing.value = false;
  } else if (!searchLoading.value && searchText.value != props.selected?.name) {
    editing.value = true;
    if (searchDebounce) searchDebounce.cancel();
    searchDebounce = debounce(async () => {
      await doSearch(event);
    }, 600);
    searchDebounce();
  }
}

async function doSearch(event: any) {
  results.value = await search();
  showResultsOverlay(event);
}

async function onEnter(event: KeyboardEvent) {
  if (listBoxSelected.value) onListBoxOptionClick(listBoxSelected.value);
  else await doSearch(event);
}
function select(event: KeyboardEvent) {
  if (results.value?.entities && results.value?.entities.length)
    if (event.key === "ArrowDown") {
      if (selectedIndex.value < results.value!.entities!.length - 1) listBoxSelected.value = results.value?.entities?.[++selectedIndex.value];
      else {
        selectedIndex.value = 0;
        listBoxSelected.value = results.value?.entities?.[selectedIndex.value];
      }
    } else if (event.key === "ArrowUp") {
      if (selectedIndex.value > 0) listBoxSelected.value = results.value?.entities?.[--selectedIndex.value];
      else {
        selectedIndex.value = results.value!.entities!.length - 1;
        listBoxSelected.value = results.value?.entities?.[selectedIndex.value];
      }
    }
}

async function search() {
  if (searchText.value && searchText.value.length > 2) {
    let imQueryCopy: QueryRequest | undefined = undefined;
    if (imQuery.value) {
      imQueryCopy = cloneDeep(imQuery.value);
    }
    if (!imQueryCopy) {
      if (props.setupSearch) imQueryCopy = await props.setupSearch();
    }
    if (imQueryCopy) {
      searchLoading.value = true;
      imQueryCopy.textSearch = searchText.value;
      imQueryCopy.page = { pageNumber: 1, pageSize: 10 };
      imQueryCopy.textSearchStyle = TextSearchStyle.autocomplete;
      const response = await QueryService.queryIMSearch(imQueryCopy);
      searchLoading.value = false;
      return response;
    }
  }
}

function showResultsOverlay(event: any) {
  if (resultsOP.value) resultsOP.value.show(event, event.target);
}

function hideResultsOverlay() {
  if (resultsOP.value) resultsOP.value.hide();
}

function onListBoxOptionClick(selected: SearchResultSummary) {
  selectedLocal.value = selected;
  hideResultsOverlay();
  editing.value = false;
}
</script>

<style scoped>
.search-container {
  flex: 1 0 auto;
  padding: 0 0.2rem;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: 0.2rem;
  overflow: auto;
  width: 40%;
}

#autocomplete-search {
  font-size: 1rem;
  height: 2.25rem;
  flex: 1 1 auto;
  width: 100%;
}

.autocomplete-search {
  font-size: 1rem;
  height: 2.25rem;
  flex: 1 1 auto;
  width: 100%;
}

.results-container {
  display: flex;
  flex-flow: column nowrap;
  gap: 0.5rem;
}

.advanced-search-container {
  display: flex;
  flex-flow: row;
  align-items: baseline;
  justify-content: space-between;
}

.loading-container {
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
}

.listbox-item {
  width: 100%;
}
.listbox-item:focus {
  outline: none;
}

.clear-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  cursor: pointer;
  font-size: 1.1rem;
  z-index: 10;
  pointer-events: auto;
}

.clear-icon:hover {
  color: #555;
}

.search-button {
  height: 35px;
}

.dialog {
  height: 700px;
}
</style>
