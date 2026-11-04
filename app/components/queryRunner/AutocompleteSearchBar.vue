<template>
  <div ref="root" class="imsb" @focusout="onFocusOut">
    <div class="imsb-row">
      <IconField class="imsb-field">
        <InputIcon class="fa-solid fa-magnifying-glass" />
        <InputText
          :id="id"
          ref="input"
          v-model="text"
          :aria-activedescendant="popupOpen ? activeId : undefined"
          :aria-busy="loading"
          :aria-controls="listboxId"
          :aria-expanded="popupOpen"
          :disabled="disabled"
          :invalid="!!error"
          :placeholder="speech.listening.value ? speech.interim.value || 'Listening…' : placeholder"
          aria-autocomplete="list"
          aria-label="Search"
          autocomplete="off"
          data-testid="search-input"
          fluid
          role="combobox"
          spellcheck="false"
          @focus="onFocus"
          @input="onInput"
          @keydown="onKeydown"
          @mouseenter="selected && text === displayName(selected) && hoverSummary($event.currentTarget as HTMLElement, selected)"
          @mouseleave="hoverSummary($event.currentTarget as HTMLElement, undefined)"
        />
        <span class="imsb-adornments">
          <span v-if="loading" aria-label="Searching" class="imsb-spinner" role="status"></span>
          <Button
            v-if="showClear"
            aria-label="Clear search"
            data-testid="clear-button"
            icon="fa-solid fa-xmark"
            rounded
            severity="secondary"
            size="small"
            text
            title="Clear"
            @click="clear"
            @mousedown.prevent
          />
          <Button
            v-if="enableVoiceSearch && speech.supported.value"
            :aria-label="speech.listening.value ? 'Stop voice search' : 'Voice search'"
            :aria-pressed="speech.listening.value"
            :class="{ listening: speech.listening.value }"
            :disabled="disabled"
            :severity="speech.listening.value ? 'danger' : 'secondary'"
            :title="speech.error.value ? `Voice search unavailable: ${speech.error.value}` : speech.listening.value ? 'Stop listening' : 'Voice search'"
            data-testid="voice-button"
            icon="fa-solid fa-microphone"
            rounded
            size="small"
            text
            @click="speech.toggle()"
          />
        </span>
      </IconField>

      <Button
        v-if="enableAdvancedSearch"
        :disabled="disabled"
        aria-label="Advanced search"
        data-testid="advanced-search-button"
        icon="fa-solid fa-list"
        title="Advanced search"
        @click="openAdvancedSearch()"
      />
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
        <small data-testid="results-count">Showing {{ entities.length ? 1 : 0 }}–{{ entities.length }} of {{ totalCount }} results</small>
        <button
          v-if="enableAdvancedSearch && totalCount > entities.length"
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
      :im-query="imQuery"
      :root-entities="rootEntities"
      :search-term="dialogTerm"
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
import { MIN_SEARCH_LENGTH, SEARCH_DEBOUNCE_MS, SEARCH_TIMEOUT_MS, SearchTimeoutError, displayName, searchEntities } from "~/helpers/autocompleteSearch";
import QueryService from "~/services/QueryService";

import { computed, nextTick, onBeforeUnmount, ref, shallowRef, useId, watch } from "vue";

import type { QueryRequest, SearchResponse, SearchResultSummary } from "@endeavour/vue-library/models";

const PAGE_SIZE = 10;

const props = withDefaults(
  defineProps<{
    imQuery?: QueryRequest;
    rootEntities?: string[];
    placeholder?: string;
    disabled?: boolean;
    enableVoiceSearch?: boolean;
    enableAdvancedSearch?: boolean;
    showSummaryOnHover?: boolean;
    id?: string;
  }>(),
  {
    rootEntities: () => [],
    placeholder: "Search by name or IRI",
    disabled: false,
    enableVoiceSearch: true,
    enableAdvancedSearch: true,
    showSummaryOnHover: true
  }
);

const emit = defineEmits<{ error: [error: Error] }>();

const selected = defineModel<SearchResultSummary | undefined>("selected");

const generatedId = useId();
const id = computed(() => props.id ?? generatedId);
const listboxId = computed(() => `${id.value}-listbox`);

const root = ref<HTMLDivElement>();
const input = ref<{ $el: HTMLInputElement }>();
const listbox = ref<HTMLUListElement>();
const summary = ref<InstanceType<typeof EntitySummaryPopover>>();

const text = ref(displayName(selected.value));
const results = shallowRef<SearchResponse | undefined>();
const loading = ref(false);
const error = ref<string | undefined>();
const popupOpen = ref(false);
const activeIndex = ref(-1);
const dialogOpen = ref(false);
const dialogTerm = ref("");

let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let controller: AbortController | undefined;

const speech = useSpeechRecognition(transcript => {
  text.value = transcript;
  search();
});

const entities = computed(() => results.value?.entities ?? []);
const totalCount = computed(() => results.value?.totalCount ?? entities.value.length);
const showClear = computed(() => !props.disabled && (text.value.length > 0 || !!selected.value));
const activeId = computed(() => (activeIndex.value >= 0 ? `${id.value}-option-${activeIndex.value}` : undefined));

watch(
  () => selected.value?.iri,
  () => (text.value = displayName(selected.value))
);

watch(activeIndex, index => {
  if (index >= 0) nextTick(() => listbox.value?.children[index]?.scrollIntoView({ block: "nearest" }));
});

onBeforeUnmount(cancelPending);

function cancelPending() {
  clearTimeout(debounceTimer);
  controller?.abort();
  loading.value = false;
}

function onInput() {
  error.value = undefined;
  clearTimeout(debounceTimer);
  if (text.value.trim().length < MIN_SEARCH_LENGTH) {
    cancelPending();
    closePopup();
    if (!text.value) selected.value = undefined;
    return;
  }
  debounceTimer = setTimeout(search, SEARCH_DEBOUNCE_MS);
}

async function search() {
  clearTimeout(debounceTimer);
  const term = text.value.trim();
  if (term.length < MIN_SEARCH_LENGTH) return;
  controller?.abort();
  const current = (controller = new AbortController());
  loading.value = true;
  error.value = undefined;
  popupOpen.value = true;
  activeIndex.value = -1;
  try {
    const response = await searchEntities(QueryService.queryIMSearch, props.imQuery, {
      text: term,
      pageSize: PAGE_SIZE,
      timeoutMs: SEARCH_TIMEOUT_MS,
      signal: current.signal
    });
    if (controller === current) results.value = response;
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
  text.value = displayName(entity);
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

function clear() {
  cancelPending();
  results.value = undefined;
  error.value = undefined;
  closePopup();
  setSelected(undefined);
  nextTick(() => input.value?.$el.focus());
}

function onKeydown(event: KeyboardEvent) {
  const count = entities.value.length;
  switch (event.key) {
    case "ArrowDown":
    case "ArrowUp": {
      event.preventDefault();
      if (!count) return;
      popupOpen.value = true;
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
  input.value?.$el.select();
  if (results.value && text.value.trim().length >= MIN_SEARCH_LENGTH && text.value !== displayName(selected.value)) popupOpen.value = true;
}

function openAdvancedSearch(withTerm = text.value) {
  cancelPending();
  closePopup();
  summary.value?.hide();
  dialogTerm.value = withTerm === displayName(selected.value) ? "" : withTerm;
  dialogOpen.value = true;
}

function onDialogSelect(entity: SearchResultSummary) {
  setSelected(entity);
  closeDialog();
}

function closeDialog() {
  dialogOpen.value = false;
  input.value?.$el.focus();
}

function hoverSummary(target: HTMLElement, entity: SearchResultSummary | undefined) {
  if (entity) summary.value?.show(target, entity);
  else summary.value?.hide();
}

defineExpose({ search, clear, text });
</script>

<style>
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
  max-width: 40rem;
}
.imsb-row {
  display: flex;
  gap: 0.5rem;
}
.imsb-field {
  flex: 1;
  min-width: 0;
}
.imsb-field :deep(input) {
  display: block;
  height: 100%;
  padding-right: 5rem;
}
.imsb-field :deep(.p-inputicon) {
  height: 1rem;
  margin-top: -0.5rem;
  line-height: 1rem;
}
.imsb-adornments {
  position: absolute;
  top: 50%;
  right: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.1rem;
  transform: translateY(-50%);
}
.listening {
  animation: imsb-pulse 1.2s ease-in-out infinite;
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
  color: var(--p-text-color);
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
