<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import type { Departure } from '~/schemas/documentary'

// Clínicas de onde a psicóloga saiu: 30 dias para baixar os próprios cadernos
// do Registro Documental (ACO-96). Sem saídas no prazo, não mostra nada.
// Com showError, a falha ao carregar aparece com "Tentar novamente"; sem ele
// (telas onde o quadro é acessório), o quadro só não aparece.
// emptyText é para a página dedicada; nas outras telas, sem saídas, nada aparece.
const props = withDefaults(defineProps<{ framed?: boolean, showError?: boolean, emptyText?: string }>(), { framed: true, showError: false, emptyText: '' })
const { data, error, refresh } = await useFetch<Departure[]>('/api/documentary/departures', {
  key: 'documentary-departures',
  default: () => [],
})
const downloading = ref<string | null>(null)
// Calculado uma vez: Date.now() no render poderia divergir entre SSR e cliente.
const now = Date.now()

function daysLeft(until: string): number {
  return Math.max(0, Math.ceil((new Date(until).getTime() - now) / 86_400_000))
}

function filename(departure: Departure): string {
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
  const clinic = departure.organizationName
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `registro-documental-${clinic || 'clinica'}-${today}.zip`
}

async function download(departure: Departure) {
  downloading.value = departure.organizationId
  try {
    const zip = await $fetch<Blob>(`/api/documentary/departures/${departure.organizationId}/export`, {
      method: 'POST',
      responseType: 'blob',
    })
    const url = URL.createObjectURL(zip)
    const link = document.createElement('a')
    link.href = url
    link.download = filename(departure)
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  catch (error) {
    toast.error(apiErrorMessage(error, {
      404: 'O prazo para baixar estes cadernos acabou.',
      default: 'Não foi possível baixar os cadernos agora. Tente de novo.',
    }))
  }
  finally {
    downloading.value = null
  }
}
</script>

<template>
  <div v-if="error && props.showError" role="alert" class="space-y-3">
    <p class="text-sm text-destructive">Não foi possível carregar seus cadernos agora. O prazo continua valendo; tente de novo.</p>
    <Button variant="outline" @click="refresh()">Tentar novamente</Button>
  </div>
  <section v-else-if="data?.length" :class="props.framed ? 'rounded-lg border bg-card p-5' : ''" aria-labelledby="saidas-titulo">
    <h2 id="saidas-titulo" class="label-mono">Cadernos de clínicas anteriores</h2>
    <p class="mt-2 text-sm text-muted-foreground">
      Ninguém da clínica tem acesso aos seus cadernos. Baixe uma cópia completa, com o histórico, antes do fim do prazo.
      Depois disso, eles ficam lacrados.
    </p>
    <ul class="mt-4 divide-y rounded-lg border">
      <li
        v-for="departure in data"
        :key="departure.organizationId"
        class="flex flex-wrap items-center justify-between gap-3 p-4"
      >
        <div class="min-w-0">
          <p class="truncate font-medium">{{ departure.organizationName }}</p>
          <p class="text-sm text-muted-foreground">
            {{ departure.notebooks }} {{ departure.notebooks === 1 ? 'caderno' : 'cadernos' }}
            · até {{ formatDate(departure.exportUntil) }}
            ({{ daysLeft(departure.exportUntil) === 1 ? 'falta 1 dia' : `faltam ${daysLeft(departure.exportUntil)} dias` }})
          </p>
        </div>
        <Button
          variant="outline"
          :disabled="downloading !== null"
          :aria-busy="downloading === departure.organizationId"
          @click="download(departure)"
        >
          {{ downloading === departure.organizationId ? 'Preparando…' : 'Baixar cadernos' }}
        </Button>
      </li>
    </ul>
  </section>
  <p v-else-if="props.emptyText && !error" class="text-sm text-muted-foreground">{{ props.emptyText }}</p>
</template>
