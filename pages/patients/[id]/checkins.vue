<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useNow } from '@vueuse/core'
definePageMeta({ middleware: ['auth', 'psychologist-only'] })
const { patientId, patient, clinicalAccess: canLoad } = usePatientFicha()
// Sem vínculo ativo nada é pedido à API (mesma regra da visão geral).
const { data: checkins, error, status, refresh } = usePatientCheckins(patientId, canLoad)
// Sem vínculo ativo a API devolve lista vazia; dizer o motivo em vez de "nenhum check-in".
const inactiveMessage = computed(() => patient.value && patient.value.relationshipStatus !== 'active'
  ? 'O vínculo com esta paciente não está ativo. Os check-ins aparecem enquanto o vínculo estiver ativo.'
  : undefined)

// ACO-103: só o que a paciente registrou. Sentimentos contados nos mesmos 35
// dias da grade, sem interpretação.
const PERIOD_DAYS = 35
const now = useNow({ interval: 60000 })
const recent = computed(() => {
  const from = checkinDay(new Date(now.value.getTime() - (PERIOD_DAYS - 1) * 86_400_000))
  return (checkins.value ?? []).filter(item => item.day >= from)
})
const feelings = computed(() => feelingCounts(recent.value))
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="label-mono">Check-ins · {{ checkins?.length ?? 0 }} registros</p>
    <p class="text-sm text-muted-foreground">Registros da paciente entre as sessões. Ela pode editar apenas o check-in do mesmo dia.</p>
    <div v-if="error" class="flex flex-col items-start gap-3 text-sm">
      <p>{{ apiErrorMessage(error, { 403: 'Seu vínculo precisa estar ativo para consultar os check-ins.', default: 'Não foi possível carregar os check-ins desta paciente.' }) }}</p>
      <Button variant="outline" @click="refresh()">Tentar novamente</Button>
    </div>
    <p v-else-if="status === 'pending' || (canLoad && status === 'idle')" class="text-sm text-muted-foreground">Carregando check-ins…</p>
    <template v-else>
      <Card v-if="checkins?.length" class="flex flex-col gap-5 p-6">
        <section class="flex flex-col gap-3.5" aria-labelledby="t-checkins-35">
          <h2 id="t-checkins-35" class="text-base font-semibold">Check-ins dos últimos {{ PERIOD_DAYS }} dias</h2>
          <CheckinDayGrid :checkins="checkins" :days="PERIOD_DAYS" :label="`Humor dos últimos ${PERIOD_DAYS} dias`" />
        </section>
        <section class="flex flex-col gap-3 border-t pt-5" aria-labelledby="t-medias-35">
          <h2 id="t-medias-35" class="label-mono">Médias do período</h2>
          <CheckinAverages :checkins="checkins" :days="PERIOD_DAYS" />
        </section>
        <section v-if="feelings.length" class="flex flex-col gap-3 border-t pt-5" aria-labelledby="t-sentimentos-35">
          <h2 id="t-sentimentos-35" class="label-mono">Sentimentos marcados no período</h2>
          <ul class="flex flex-wrap gap-2">
            <li v-for="feeling in feelings" :key="feeling.value" class="rounded-full border border-border bg-card px-3 py-1 text-[13px] text-secondary-foreground">
              {{ feeling.label }} <span class="font-mono tabular-nums text-muted-foreground">· {{ feeling.count }} {{ feeling.count === 1 ? 'dia' : 'dias' }}</span>
            </li>
          </ul>
        </section>
      </Card>
      <section class="flex flex-col gap-3" aria-labelledby="t-registros">
        <h2 id="t-registros" class="label-mono">Registros</h2>
        <Card class="p-6"><CheckinHistory :items="checkins ?? []" :empty-message="inactiveMessage" /></Card>
      </section>
    </template>
  </div>
</template>
