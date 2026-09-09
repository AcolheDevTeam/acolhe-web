<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'psychologist-only'] })

// Fila de atividades do psicólogo — leitura pura, agrupada por situação.
// "Aguardando revisão" (respondidas) vem primeiro por ser o mais acionável,
// espelhando o breadcrumb "Atividades / Aguardando revisão" do design.
const { data: activities } = useActivities()

// Grupos em ordem de acionabilidade, com o rótulo de cada situação.
const groups = [
  { status: 'responded', label: 'Aguardando revisão' },
  { status: 'overdue', label: 'Atrasadas' },
  { status: 'assigned', label: 'Atribuídas' },
  { status: 'reviewed', label: 'Revisadas' },
] as const

const grouped = computed(() => {
  const list = activities.value ?? []
  return groups
    .map((g) => ({ ...g, rows: list.filter((a) => a.status === g.status) }))
    .filter((g) => g.rows.length > 0)
})
</script>

<template>
  <PageHeader title="Atividades" />

  <div class="px-4 py-6 md:px-8 md:py-8">
    <div v-if="grouped.length" class="flex flex-col gap-8">
      <section v-for="g in grouped" :key="g.status" class="flex flex-col gap-3">
        <p class="label-mono">{{ g.label }} · {{ g.rows.length }}</p>
        <div class="flex flex-col gap-2">
          <ActivityRow v-for="a in g.rows" :key="a.id" :activity="a" show-patient />
        </div>
      </section>
    </div>
    <p v-else class="rounded-lg border border-dashed px-4 py-16 text-center text-sm text-muted-foreground">
      Nenhuma atividade no momento.
    </p>
  </div>
</template>
