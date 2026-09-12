<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'psychologist-only'] })

// Fila de atividades do psicólogo — leitura pura, agrupada por situação.
// "Aguardando revisão" vem primeiro por ser o mais acionável, espelhando o
// breadcrumb "Atividades / Aguardando revisão" do design. O agrupamento
// traduz os status reais da API (pending, submitted…) em utils/activity-queue.ts.
const { data: activities } = useActivities()

const grouped = computed(() => groupActivityQueue(activities.value ?? []))
</script>

<template>
  <PageHeader title="Atividades" />

  <div class="px-4 py-6 md:px-8 md:py-8">
    <div v-if="grouped.length" class="flex flex-col gap-8">
      <section v-for="g in grouped" :key="g.key" class="flex flex-col gap-3">
        <p class="label-mono">{{ g.label }} · {{ g.rows.length }}</p>
        <div class="flex flex-col gap-2">
          <ActivityRow v-for="a in g.rows" :key="a.id" :activity="a" show-patient />
        </div>
      </section>
    </div>
    <div v-else class="flex flex-col items-center gap-1 rounded-lg border border-dashed px-4 py-16 text-center text-sm text-muted-foreground">
      <p>Nenhuma atividade atribuída.</p>
      <p>Para atribuir uma, abra a ficha da paciente e use "Atribuir atividade".</p>
    </div>
  </div>
</template>
