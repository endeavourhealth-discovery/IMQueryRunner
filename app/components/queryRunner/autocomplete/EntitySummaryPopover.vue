<template>
  <div
    v-if="visible"
    :class="{ above: position.placeAbove }"
    :style="{ top: `${position.top}px`, left: `${position.left}px` }"
    class="imsb-summary"
    data-testid="entity-summary"
    role="tooltip"
  >
    <div v-if="loading" class="imsb-summary-loading"><span aria-hidden="true" class="imsb-spinner"></span> Loading summary…</div>
    <div v-else-if="failed" class="imsb-summary-loading">Summary unavailable</div>
    <dl v-else-if="summary">
      <template v-for="field in fields" :key="field">
        <dt>{{ labels[field] }}</dt>
        <dd :class="{ muted: !valueOf(field, summary), mono: field === 'iri' }">{{ valueOf(field, summary) || "N/A" }}</dd>
      </template>
    </dl>
  </div>
</template>

<script lang="ts">
import type { SearchResultSummary } from "@endeavour/vue-library/models";

const summaryCache = new Map<string, Promise<SearchResultSummary>>();
</script>

<script lang="ts" setup>
import EntityService from "~/services/EntityService";

import { onBeforeUnmount, ref } from "vue";

type SummaryField = "name" | "iri" | "code" | "status" | "scheme" | "type" | "description";

const props = withDefaults(
  defineProps<{
    delay?: number;
    fields?: SummaryField[];
  }>(),
  { delay: 500, fields: () => ["name", "iri", "code", "status", "scheme", "type", "description"] }
);

const labels: Record<SummaryField, string> = {
  name: "Name",
  iri: "IRI",
  code: "Code",
  status: "Status",
  scheme: "Scheme",
  type: "Type",
  description: "Description"
};

const visible = ref(false);
const loading = ref(false);
const failed = ref(false);
const summary = ref<SearchResultSummary | undefined>();
const position = ref({ top: 0, left: 0, placeAbove: false });
let timer: ReturnType<typeof setTimeout> | undefined;
let token = 0;

onBeforeUnmount(() => clearTimeout(timer));

function valueOf(field: SummaryField, s: SearchResultSummary): string | undefined {
  switch (field) {
    case "status":
    case "scheme":
      return s[field]?.name ?? s[field]?.iri;
    case "type":
      return s.type?.map(t => t.name ?? t.iri).join(", ");
    default:
      return s[field] as string | undefined;
  }
}

function place(target: HTMLElement) {
  const rect = target.getBoundingClientRect();
  const placeAbove = rect.bottom + 220 > window.innerHeight && rect.top > 220;
  position.value = {
    top: placeAbove ? rect.top - 6 : rect.bottom + 6,
    left: Math.max(8, Math.min(rect.left, window.innerWidth - 420)),
    placeAbove
  };
}

function loadSummary(iri: string): Promise<SearchResultSummary> {
  let pending = summaryCache.get(iri);
  if (!pending) {
    pending = EntityService.getEntitySummary(iri);
    summaryCache.set(iri, pending);
    pending.catch(() => summaryCache.delete(iri));
  }
  return pending;
}

function show(target: HTMLElement, entity: string | SearchResultSummary | undefined) {
  hide();
  const iri = typeof entity === "string" ? entity : entity?.iri;
  if (!entity || !iri || iri === "any") return;
  const provided = typeof entity === "string" ? undefined : entity;
  const current = ++token;
  timer = setTimeout(async () => {
    if (!target.isConnected) return;
    place(target);
    visible.value = true;
    failed.value = false;
    if (provided?.status && provided.description !== undefined) {
      summary.value = provided;
      return;
    }
    loading.value = true;
    try {
      const result = await loadSummary(iri);
      if (current === token) summary.value = { ...provided, ...result } as SearchResultSummary;
    } catch {
      if (current === token) failed.value = true;
    } finally {
      if (current === token) loading.value = false;
    }
  }, props.delay);
}

function hide() {
  clearTimeout(timer);
  token++;
  visible.value = false;
  loading.value = false;
  summary.value = undefined;
}

defineExpose({ show, hide });
</script>

<style scoped>
.imsb-summary {
  position: fixed;
  z-index: 1100;
  width: min(400px, calc(100vw - 16px));
  max-height: 50vh;
  overflow: auto;
  padding: 0.75rem 0.875rem;
  background: var(--imsb-surface);
  color: var(--imsb-text);
  border: 1px solid var(--imsb-border);
  border-radius: var(--imsb-radius);
  box-shadow: var(--imsb-shadow);
  font-size: 0.8125rem;
  line-height: 1.45;
  pointer-events: none;
}
.imsb-summary.above {
  transform: translateY(-100%);
}
dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.25rem 0.75rem;
  margin: 0;
}
dt {
  font-weight: 600;
  color: var(--imsb-text-muted);
}
dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.75rem;
}
.muted {
  color: var(--imsb-text-muted);
}
.imsb-summary-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--imsb-text-muted);
}
</style>
