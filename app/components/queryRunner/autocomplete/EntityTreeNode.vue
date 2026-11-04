<template>
  <li :aria-expanded="canExpand ? expanded : undefined" :aria-selected="selectedIri === node.iri" role="treeitem">
    <div :class="{ selected: selectedIri === node.iri }" :style="{ paddingLeft: `${depth * 1.1 + 0.25}rem` }" class="row">
      <button v-if="canExpand" :aria-label="`${expanded ? 'Collapse' : 'Expand'} ${node.name}`" class="toggle" tabindex="-1" type="button" @click="toggle">
        <svg :class="{ open: expanded }" aria-hidden="true" height="12" viewBox="0 0 16 16" width="12">
          <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" />
        </svg>
      </button>
      <span v-else class="toggle-spacer"></span>
      <button
        class="label"
        type="button"
        @click="emit('select', node)"
        @dblclick="folder && canExpand ? toggle() : emit('activate', node)"
        @keydown="onKeydown"
        @mouseenter="emit('hover', $event.currentTarget as HTMLElement, node)"
        @mouseleave="emit('hover', $event.currentTarget as HTMLElement, undefined)"
      >
        <IMFontAwesomeIcon :icon="typeIcon" :style="{ color: typeColour }" aria-hidden="true" class="icon" fixed-width />
        <span class="name">{{ node.name ?? node.iri }}</span>
      </button>
    </div>
    <ul v-if="expanded" role="group">
      <EntityTreeNode
        v-for="child in children"
        :key="child.iri"
        :depth="depth + 1"
        :node="child"
        :page-size="pageSize"
        :selected-iri="selectedIri"
        @activate="emit('activate', $event)"
        @hover="(target, n) => emit('hover', target, n)"
        @select="emit('select', $event)"
      />
      <li v-if="loading" :style="statusIndent" class="status"><span aria-hidden="true" class="imsb-spinner small"></span> Loading…</li>
      <li v-else-if="error" :style="statusIndent" class="status error">{{ error }} <button class="link" type="button" @click="loadMore">Retry</button></li>
      <li v-else-if="children.length < totalCount" :style="statusIndent" class="status">
        <button class="link" type="button" @click="loadMore">Load more ({{ totalCount - children.length }} remaining)</button>
      </li>
      <li v-else-if="children.length === 0" :style="statusIndent" class="status">Empty</li>
    </ul>
  </li>
</template>

<script lang="ts" setup>
import { isFolder } from "~/helpers/autocompleteSearch";
import EntityService from "~/services/EntityService";

import { computed, ref } from "vue";

import { IMFontAwesomeIcon } from "@endeavour/vue-library/components";
import { getColourFromType, getFAIconFromType } from "@endeavour/vue-library/helpers";
import type { ExtendedEntityReferenceNode, TTIriRef } from "@endeavour/vue-library/models";

defineOptions({ name: "EntityTreeNode" });

const props = withDefaults(
  defineProps<{
    node: ExtendedEntityReferenceNode;
    depth?: number;
    pageSize?: number;
    selectedIri?: string;
  }>(),
  { depth: 0, pageSize: 50 }
);

const emit = defineEmits<{
  select: [node: ExtendedEntityReferenceNode];
  activate: [node: ExtendedEntityReferenceNode];
  hover: [target: HTMLElement, node: ExtendedEntityReferenceNode | undefined];
}>();

const expanded = ref(false);
const loading = ref(false);
const error = ref<string | undefined>();
const children = ref<ExtendedEntityReferenceNode[]>([]);
const totalCount = ref(0);
let page = 0;

const folder = computed(() => isFolder(props.node.type));
// Same icon and colour per entity type as the IMDirectory NavTree
const typeIcon = computed(() => getFAIconFromType((props.node.type ?? []) as TTIriRef[]));
const typeColour = computed(() => getColourFromType((props.node.type ?? []) as TTIriRef[]));
const canExpand = computed(() => props.node.hasChildren !== false);
const statusIndent = computed(() => ({ paddingLeft: `${(props.depth + 1) * 1.1 + 1.5}rem` }));

async function loadMore() {
  loading.value = true;
  error.value = undefined;
  try {
    const response = await EntityService.getPagedChildren(props.node.iri, page + 1, props.pageSize);
    page++;
    children.value = [...children.value, ...((response?.result ?? []) as ExtendedEntityReferenceNode[])];
    totalCount.value = response?.totalCount ?? children.value.length;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to load children";
  } finally {
    loading.value = false;
  }
}

async function toggle() {
  expanded.value = !expanded.value;
  if (expanded.value && page === 0) await loadMore();
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowRight" && canExpand.value && !expanded.value) {
    event.preventDefault();
    toggle();
  } else if (event.key === "ArrowLeft" && expanded.value) {
    event.preventDefault();
    toggle();
  } else if (event.key === "Enter") {
    event.preventDefault();
    emit("activate", props.node);
  }
}
</script>

<style scoped>
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.row {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  border-radius: 4px;
}
.row:hover {
  background: var(--p-content-hover-background);
}
.row.selected {
  background: var(--p-highlight-background);
}
.toggle,
.toggle-spacer {
  flex: none;
  width: 1.2rem;
  height: 1.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: none;
  color: var(--p-text-muted-color);
  cursor: pointer;
}
.toggle svg {
  transition: transform 0.12s;
}
.toggle svg.open {
  transform: rotate(90deg);
}
.label {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.4rem;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: 4px;
}
.label:focus-visible {
  outline: 2px solid var(--p-primary-color);
  outline-offset: -2px;
}
.icon {
  flex: none;
}
.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.status {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0;
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
}
.status.error {
  color: var(--p-red-500);
}
.link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--p-primary-color);
  font: inherit;
  cursor: pointer;
  text-decoration: underline;
}
</style>
