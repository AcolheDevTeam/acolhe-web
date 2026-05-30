<script setup lang="ts">
// Timeline unificada do paciente — leitura pura.
// Usado como <LazyPatientTimeline> para não hidratar à toa (spec §2.1).
const props = defineProps<{ patientId: string }>()

const { data: items, pending } = usePatientTimeline(() => props.patientId)

const kindLabel: Record<TimelineItem['kind'], string> = {
  session: 'Sessão',
  appointment: 'Agendamento',
  activity: 'Atividade',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <section class="mt-6">
    <h2 class="text-lg font-medium">Linha do tempo</h2>

    <p v-if="pending" class="mt-2 text-sm text-gray-500">Carregando…</p>

    <ol v-else-if="items?.length" class="mt-3 space-y-2">
      <li
        v-for="item in items"
        :key="item.itemId"
        class="flex items-center justify-between rounded border px-4 py-3"
      >
        <div class="flex items-center gap-3">
          <span class="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            {{ kindLabel[item.kind] }}
          </span>
          <span class="text-sm text-gray-700">{{ formatDate(item.occurredAt) }}</span>
        </div>
        <span class="text-sm text-gray-500">{{ item.status }}</span>
      </li>
    </ol>

    <p v-else class="mt-2 text-sm text-gray-500">Nenhum registro na linha do tempo.</p>
  </section>
</template>
