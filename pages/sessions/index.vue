<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const { data: sessions } = useSessions()

// Agrupa por dia (rótulo pt-BR) preservando a ordem cronológica decrescente.
const grouped = computed(() => {
  const list = [...(sessions.value ?? [])].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )
  const map = new Map<string, typeof list>()
  for (const s of list) {
    const key = formatDate(s.occurredAt)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(s)
  }
  return [...map.entries()]
})
</script>

<template>
  <PageHeader title="Agenda">
    <template #actions>
      <NewSessionDialog>
        <Button size="sm">
          <Plus />
          Nova sessão
        </Button>
      </NewSessionDialog>
    </template>
  </PageHeader>

  <div class="px-4 py-6 md:px-8 md:py-8">
    <div v-if="grouped.length" class="flex flex-col gap-8">
      <section v-for="[day, rows] in grouped" :key="day" class="flex flex-col gap-3">
        <p class="label-mono">{{ day }}</p>
        <div class="flex flex-col gap-2">
          <SessionRow v-for="s in rows" :key="s.id" :session="s" />
        </div>
      </section>
    </div>
    <p v-else class="rounded-lg border border-dashed px-4 py-16 text-center text-sm text-muted-foreground">
      Nenhuma sessão agendada.
    </p>
  </div>
</template>
