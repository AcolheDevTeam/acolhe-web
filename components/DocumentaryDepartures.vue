<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import type { Departure } from '~/schemas/documentary'

// Clínicas de onde a psicóloga saiu: 30 dias para baixar os próprios cadernos
// do Registro Documental (ACO-96). Sem saídas no prazo, não mostra nada.
const props = withDefaults(defineProps<{ framed?: boolean }>(), { framed: true })
const { data } = await useFetch<Departure[]>('/api/documentary/departures', {
  key: 'documentary-departures',
  default: () => [],
})
const downloading = ref<string | null>(null)

function daysLeft(until: string): number {
  return Math.max(0, Math.ceil((new Date(until).getTime() - Date.now()) / 86_400_000))
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
    link.download = `registro-documental-${new Date().toISOString().slice(0, 10)}.zip`
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
  <section v-if="data?.length" :class="props.framed ? 'rounded-lg border bg-card p-5' : ''" aria-labelledby="saidas-titulo">
    <p id="saidas-titulo" class="label-mono">Cadernos de clínicas anteriores</p>
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
          @click="download(departure)"
        >
          {{ downloading === departure.organizationId ? 'Preparando…' : 'Baixar cadernos' }}
        </Button>
      </li>
    </ul>
  </section>
</template>
