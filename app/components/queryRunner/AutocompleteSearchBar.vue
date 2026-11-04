<template>
  <div ref="root" :class="{ disabled }" class="imsb" @focusout="onFocusOut">
    <div class="imsb-row">
      <div :class="{ 'has-error': !!error }" class="imsb-field">
        <svg aria-hidden="true" class="imsb-lead" height="16" viewBox="0 0 16 16" width="16">
          <circle cx="7" cy="7" fill="none" r="4.5" stroke="currentColor" stroke-width="1.5" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" />
        </svg>
        <input
          :id="id"
          ref="input"
          v-model="text"
          :aria-activedescendant="popupOpen ? activeId : undefined"
          :aria-busy="loading"
          :aria-controls="listboxId"
          :aria-expanded="popupOpen"
          :aria-label="label"
          :autocomplete="allowBrowserAutocomplete ? 'on' : 'off'"
          :disabled="disabled"
          :placeholder="speech.listening.value ? speech.interim.value || 'Listening…' : effectivePlaceholder"
          aria-autocomplete="list"
          data-testid="search-input"
          role="combobox"
          spellcheck="false"
          type="text"
          @focus="onFocus"
          @input="onInput"
          @keydown="onKeydown"
          @mouseenter="selected && text === displayName(selected) && hoverSummary($event.currentTarget as HTMLElement, selected)"
          @mouseleave="hoverSummary($event.currentTarget as HTMLElement, undefined)"
        />
        <span class="imsb-adornments">
          <span v-if="loading" aria-label="Searching" class="imsb-spinner" role="status"></span>
          <button
            v-if="showClear"
            aria-label="Clear search"
            class="imsb-icon"
            data-testid="clear-button"
            title="Clear"
            type="button"
            @click="clear"
            @mousedown.prevent
          >
            <svg aria-hidden="true" height="14" viewBox="0 0 16 16" width="14"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.75" /></svg>
          </button>
          <button
            v-if="enableVoiceSearch && speech.supported.value"
            :aria-label="speech.listening.value ? 'Stop voice search' : 'Voice search'"
            :aria-pressed="speech.listening.value"
            :class="{ listening: speech.listening.value }"
            :disabled="disabled"
            :title="speech.error.value ? `Voice search unavailable: ${speech.error.value}` : speech.listening.value ? 'Stop listening' : 'Voice search'"
            class="imsb-icon"
            data-testid="voice-button"
            type="button"
            @click="speech.toggle()"
          >
            <svg aria-hidden="true" height="15" viewBox="0 0 16 16" width="15">
              <rect fill="none" height="8" rx="2.5" stroke="currentColor" stroke-width="1.4" width="5" x="5.5" y="1.5" />
              <path d="M3 7.5a5 5 0 0010 0M8 12.5V15" fill="none" stroke="currentColor" stroke-width="1.4" />
            </svg>
          </button>
        </span>
      </div>

      <button
        v-if="enableAdvancedSearch"
        :class="{ text: buttonStyle === 'text' }"
        :disabled="disabled"
        :title="buttonStyle === 'icon' ? 'Advanced search' : undefined"
        aria-label="Advanced search"
        class="imsb-advanced"
        data-testid="advanced-search-button"
        type="button"
        @click="openAdvancedSearch()"
      >
        <svg aria-hidden="true" height="15" viewBox="0 0 16 16" width="15">
          <path d="M2 3.5h12M2 8h8M2 12.5h5" stroke="currentColor" stroke-width="1.5" />
          <circle cx="12" cy="11" fill="none" r="2.25" stroke="currentColor" stroke-width="1.4" />
          <path d="M13.6 12.6L15 14" stroke="currentColor" stroke-width="1.4" />
        </svg>
        <span v-if="buttonStyle === 'text'">Advanced search</span>
      </button>
    </div>

    <div v-if="popupOpen" class="imsb-popup" data-testid="results-popup">
      <div v-if="loading && !results" class="imsb-message"><span aria-hidden="true" class="imsb-spinner"></span> Searching…</div>
      <div v-else-if="error" class="imsb-message error" role="alert">
        {{ error }}
        <button class="imsb-link" type="button" @click="search" @mousedown.prevent>Retry</button>
      </div>
      <div v-else-if="!entities.length" class="imsb-message" role="status">No results</div>

      <ul :id="listboxId" ref="listbox" :class="{ stale: loading }" :hidden="!entities.length || !!error" aria-label="Search results" role="listbox">
        <li
          v-for="(entity, i) in entities"
          :id="`${id}-option-${i}`"
          :key="entity.iri"
          :aria-selected="i === activeIndex"
          :class="{ active: i === activeIndex, current: entity.iri === selected?.iri }"
          role="option"
          @click="choose(entity)"
          @mousedown.prevent
          @mouseenter="hoverSummary($event.currentTarget as HTMLElement, entity)"
          @mouseleave="hoverSummary($event.currentTarget as HTMLElement, undefined)"
          @mousemove="activeIndex = i"
        >
          <span class="imsb-name">{{ displayName(entity) }}</span>
          <span v-if="entity.code || entity.scheme?.name" class="imsb-meta">{{ [entity.code, entity.scheme?.name].filter(Boolean).join(" · ") }}</span>
        </li>
      </ul>

      <div v-if="!error && results" class="imsb-footer">
        <small data-testid="results-count"
          >Showing {{ entities.length ? 1 : 0 }}–{{ entities.length }} of {{ results.totalCount ?? entities.length }} results</small
        >
        <button
          v-if="enableAdvancedSearch && (results.totalCount ?? 0) > entities.length"
          class="imsb-link"
          type="button"
          @click="openAdvancedSearch(text)"
          @mousedown.prevent
        >
          View all
        </button>
      </div>
    </div>

    <EntitySummaryPopover v-if="showSummaryOnHover" ref="summary" />

    <AdvancedSearchDialog
      v-if="dialogOpen"
      :allow-folder-selection="allowFolderSelection"
      :im-query="dialogQuery"
      :min-search-length="minSearchLength"
      :root-entities="dialogRoots"
      :search-term="dialogTerm"
      :search-timeout-ms="searchTimeoutMs"
      :selected="selected"
      @close="closeDialog"
      @select="onDialogSelect"
    />
  </div>
</template>

<script lang="ts" setup>
import AdvancedSearchDialog from "~/components/queryRunner/autocomplete/AdvancedSearchDialog.vue";
import EntitySummaryPopover from "~/components/queryRunner/autocomplete/EntitySummaryPopover.vue";
import { useSpeechRecognition } from "~/composables/useSpeechRecognition";
import { SearchTimeoutError, displayName, searchEntities } from "~/helpers/autocompleteSearch";
import QueryService from "~/services/QueryService";

import { computed, nextTick, onBeforeUnmount, ref, shallowRef, toRaw, useId, watch } from "vue";

import type { QueryRequest, SearchResponse, SearchResultSummary } from "@endeavour/vue-library/models";

interface Props {
  /** Base query (type/scheme/isA filters etc.). Text, paging and search style are applied on top. */
  imQuery?: QueryRequest;
  /** Lazily builds the base query when imQuery is not supplied. */
  setupSearch?: () => QueryRequest | Promise<QueryRequest>;
  /** Root IRIs of the advanced search tree. */
  rootEntities?: string[];
  setupRootEntities?: () => string[] | Promise<string[]>;
  placeholder?: string;
  disabled?: boolean;
  minSearchLength?: number;
  debounceMs?: number;
  pageSize?: number;
  searchTimeoutMs?: number;
  allowBrowserAutocomplete?: boolean;
  enableVoiceSearch?: boolean;
  enableAdvancedSearch?: boolean;
  showSummaryOnHover?: boolean;
  /** "icon" shows icon buttons with tooltips; "text" shows labelled buttons. */
  buttonStyle?: "icon" | "text";
  /** Whether folders can be chosen from the advanced search tree. */
  allowFolderSelection?: boolean;
  id?: string;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  rootEntities: () => [],
  disabled: false,
  minSearchLength: 3,
  debounceMs: 600,
  pageSize: 10,
  searchTimeoutMs: 10000,
  allowBrowserAutocomplete: false,
  enableVoiceSearch: true,
  enableAdvancedSearch: true,
  showSummaryOnHover: true,
  buttonStyle: "icon",
  allowFolderSelection: false,
  label: "Search"
});

const emit = defineEmits<{
  select: [entity: SearchResultSummary | undefined];
  error: [error: Error];
}>();

const selected = defineModel<SearchResultSummary | undefined>("selected");

const generatedId = useId();
const id = computed(() => props.id ?? `imsb-${generatedId.replace(/[^\w-]/g, "")}`);
const listboxId = computed(() => `${id.value}-listbox`);
const effectivePlaceholder = computed(() => props.placeholder ?? "Search by name or IRI");

const root = ref<HTMLDivElement>();
const input = ref<HTMLInputElement>();
const listbox = ref<HTMLUListElement>();
const summary = ref<InstanceType<typeof EntitySummaryPopover>>();

const text = ref(displayName(selected.value));
const results = shallowRef<SearchResponse | undefined>();
const loading = ref(false);
const error = ref<string | undefined>();
const popupOpen = ref(false);
const activeIndex = ref(-1);
const dialogOpen = ref(false);
const dialogRoots = ref<string[]>([]);
const dialogQuery = shallowRef<QueryRequest | undefined>();
const dialogTerm = ref("");

let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let controller: AbortController | undefined;
let resolvedQuery: QueryRequest | undefined;
let syncedIri = selected.value?.iri;

const speech = useSpeechRecognition(transcript => {
  text.value = transcript;
  search();
});

const entities = computed(() => results.value?.entities ?? []);
const showClear = computed(() => !props.disabled && (text.value.length > 0 || !!selected.value));
const activeId = computed(() => (activeIndex.value >= 0 ? `${id.value}-option-${activeIndex.value}` : undefined));

watch(
  () => selected.value?.iri,
  iri => {
    if (iri !== syncedIri) {
      syncedIri = iri;
      text.value = displayName(selected.value);
    }
  }
);

watch(activeIndex, index => {
  if (index >= 0) nextTick(() => listbox.value?.querySelector(`#${CSS.escape(`${id.value}-option-${index}`)}`)?.scrollIntoView({ block: "nearest" }));
});

onBeforeUnmount(() => {
  clearTimeout(debounceTimer);
  controller?.abort();
});

async function getBaseQuery(): Promise<QueryRequest | undefined> {
  if (props.imQuery) return toRaw(props.imQuery);
  if (!resolvedQuery && props.setupSearch) resolvedQuery = await props.setupSearch();
  return resolvedQuery;
}

function cancelPending() {
  clearTimeout(debounceTimer);
  controller?.abort();
  loading.value = false;
}

function onInput() {
  error.value = undefined;
  clearTimeout(debounceTimer);
  if (!text.value) {
    cancelPending();
    closePopup();
    if (selected.value) setSelected(undefined);
    return;
  }
  if (text.value.trim().length < props.minSearchLength) {
    cancelPending();
    closePopup();
    return;
  }
  debounceTimer = setTimeout(search, props.debounceMs);
}

async function search() {
  clearTimeout(debounceTimer);
  const term = text.value.trim();
  if (term.length < props.minSearchLength) return;
  controller?.abort();
  const current = (controller = new AbortController());
  loading.value = true;
  error.value = undefined;
  popupOpen.value = true;
  activeIndex.value = -1;
  try {
    const base = await getBaseQuery();
    const response = await searchEntities(QueryService.queryIMSearch, base, {
      text: term,
      pageSize: props.pageSize,
      timeoutMs: props.searchTimeoutMs,
      signal: current.signal
    });
    if (controller !== current) return;
    results.value = response;
  } catch (e) {
    if (controller !== current) return;
    results.value = undefined;
    error.value = e instanceof SearchTimeoutError ? e.message : "Search failed. Please try again.";
    emit("error", e instanceof Error ? e : new Error(String(e)));
  } finally {
    if (controller === current) loading.value = false;
  }
}

function setSelected(entity: SearchResultSummary | undefined) {
  selected.value = entity;
  syncedIri = entity?.iri;
  text.value = displayName(entity);
  emit("select", entity);
}

function choose(entity: SearchResultSummary) {
  setSelected(entity);
  closePopup();
  summary.value?.hide();
}

function closePopup() {
  popupOpen.value = false;
  activeIndex.value = -1;
}

/** Clears the text and selection. */
function clear() {
  cancelPending();
  results.value = undefined;
  error.value = undefined;
  closePopup();
  setSelected(undefined);
  nextTick(() => input.value?.focus());
}

function onKeydown(event: KeyboardEvent) {
  const count = entities.value.length;
  switch (event.key) {
    case "ArrowDown":
    case "ArrowUp": {
      event.preventDefault();
      if (!popupOpen.value && count) popupOpen.value = true;
      if (!count) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      activeIndex.value = activeIndex.value < 0 && step < 0 ? count - 1 : (activeIndex.value + step + count) % count;
      break;
    }
    case "Home":
    case "End":
      if (popupOpen.value && count) {
        event.preventDefault();
        activeIndex.value = event.key === "Home" ? 0 : count - 1;
      }
      break;
    case "Enter": {
      event.preventDefault();
      const active = entities.value[activeIndex.value];
      if (popupOpen.value && active) choose(active);
      else search();
      break;
    }
    case "Escape":
      if (popupOpen.value) {
        event.preventDefault();
        cancelPending();
        closePopup();
      }
      break;
    case "Tab":
      closePopup();
      break;
  }
}

function onFocusOut(event: FocusEvent) {
  if (dialogOpen.value) return;
  const next = event.relatedTarget as Node | null;
  if (next && root.value?.contains(next)) return;
  closePopup();
  summary.value?.hide();
  if (text.value !== displayName(selected.value)) {
    cancelPending();
    text.value = displayName(selected.value);
  }
}

function onFocus() {
  input.value?.select();
  if (results.value && text.value.trim().length >= props.minSearchLength && text.value !== displayName(selected.value)) popupOpen.value = true;
}

async function openAdvancedSearch(withTerm = text.value) {
  cancelPending();
  closePopup();
  summary.value?.hide();
  dialogRoots.value = props.rootEntities.length ? props.rootEntities : ((await props.setupRootEntities?.()) ?? []);
  dialogQuery.value = await getBaseQuery();
  dialogTerm.value = withTerm === displayName(selected.value) ? "" : withTerm;
  dialogOpen.value = true;
}

function onDialogSelect(entity: SearchResultSummary) {
  dialogOpen.value = false;
  setSelected(entity);
  input.value?.focus();
}

function closeDialog() {
  dialogOpen.value = false;
  input.value?.focus();
}

function hoverSummary(target: HTMLElement, entity: SearchResultSummary | undefined) {
  if (!props.showSummaryOnHover || !summary.value) return;
  if (entity) summary.value.show(target, entity);
  else summary.value.hide();
}

defineExpose({ search, clear, text });
</script>

<style>
/* Global so the dialog, popover and tree nodes can use it too */
.imsb-spinner {
  display: inline-block;
  flex: none;
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--p-content-border-color);
  border-top-color: var(--p-primary-color);
  border-radius: 50%;
  animation: imsb-spin 0.7s linear infinite;
}
.imsb-spinner.small {
  width: 0.8rem;
  height: 0.8rem;
}
@keyframes imsb-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .imsb-spinner {
    animation-duration: 2s;
  }
}
</style>

<style scoped>
.imsb {
  position: relative;
  width: 100%;
  /* Fluid on narrow screens, capped on wide ones */
  max-width: 40rem;
  font-size: 1rem;
  line-height: 1.45;
  color: var(--p-text-color);
}
.imsb-row {
  display: flex;
  align-items: stretch;
  gap: 0.4rem;
}
.imsb-field {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  height: 2.5rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 6px;
  background: var(--p-form-field-background);
  transition:
    border-color 0.12s,
    box-shadow 0.12s;
}
.imsb-field:focus-within {
  border-color: var(--p-primary-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--p-primary-color) 25%, transparent);
}
.imsb-field.has-error {
  border-color: var(--p-red-500);
}
.imsb-lead {
  flex: none;
  margin-left: 0.6rem;
  color: var(--p-text-muted-color);
}
input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0 0.5rem;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font: inherit;
}
input::placeholder {
  color: var(--p-text-muted-color);
  opacity: 0.85;
}
.imsb-adornments {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  padding-right: 0.4rem;
}
.imsb-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: none;
  color: var(--p-text-muted-color);
  cursor: pointer;
}
.imsb-icon:hover:not(:disabled) {
  background: var(--p-content-hover-background);
  color: var(--p-text-color);
}
.imsb-icon.listening {
  color: var(--p-red-500);
  animation: imsb-pulse 1.2s ease-in-out infinite;
}
.imsb-advanced {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-width: 2.5rem;
  padding: 0 0.6rem;
  border: 1px solid var(--p-primary-color);
  border-radius: 6px;
  background: var(--p-primary-color);
  color: var(--p-primary-contrast-color);
  font: inherit;
  cursor: pointer;
}
.imsb-advanced:hover:not(:disabled) {
  filter: brightness(1.08);
}
button:focus-visible {
  outline: 2px solid var(--p-primary-color);
  outline-offset: 2px;
}
button:disabled,
.disabled input {
  cursor: not-allowed;
  opacity: 0.55;
}
.imsb-popup {
  position: absolute;
  z-index: 1000;
  top: calc(100% + 4px);
  left: 0;
  width: min(100%, 34rem);
  min-width: min(20rem, 100%);
  border: 1px solid var(--p-content-border-color);
  border-radius: 6px;
  background: var(--p-content-background);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.14);
  overflow: hidden;
}
ul {
  max-height: 18rem;
  margin: 0;
  padding: 0.25rem;
  overflow-y: auto;
  list-style: none;
}
ul.stale {
  opacity: 0.6;
}
li {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
}
li.active {
  background: var(--p-highlight-background);
  box-shadow: inset 3px 0 0 var(--p-primary-color);
}
li.current {
  font-weight: 600;
}
.imsb-name {
  min-width: 0;
  overflow-wrap: anywhere;
}
.imsb-meta {
  flex: none;
  max-width: 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
}
.imsb-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  color: var(--p-text-muted-color);
}
.imsb-message.error {
  color: var(--p-red-500);
}
.imsb-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.75rem;
  border-top: 1px solid var(--p-content-border-color);
  color: var(--p-text-muted-color);
}
.imsb-link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--p-primary-color);
  font: inherit;
  font-size: 0.8rem;
  text-decoration: underline;
  cursor: pointer;
}
@keyframes imsb-pulse {
  50% {
    opacity: 0.45;
  }
}
</style>
