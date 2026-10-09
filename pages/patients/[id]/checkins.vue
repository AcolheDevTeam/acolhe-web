<script setup lang="ts">
import type { PatientCheckin } from '~/types'
import { Button } from '@/components/ui/button'
definePageMeta({ middleware: ['auth', 'psychologist-only'] })
const route = useRoute()
const patientId = computed(() => route.params.id as string)
const { data: patient } = usePatient(patientId)
const { data: checkins, error, status, refresh } = useFetch<PatientCheckin[]>(() => `/api/patients/${patientId.value}/checkins`, {
  key: () => `patient-checkins-${patientId.value}`, default: () => [],
})
// Sem vínculo ativo a API devolve lista vazia; dizer o motivo em vez de "nenhum check-in".
const inactiveMessage = computed(() => patient.value && patient.value.relationshipStatus !== 'active'
  ? 'O vínculo com esta paciente não está ativo. Os check-ins aparecem enquanto o vínculo estiver ativo.'
  : undefined)
</script>

<template>
  <PatientShell :patient="patient ?? null" :patient-id="patientId" active="checkins">
    <div class="flex flex-col gap-4">
      <p class="label-mono">Check-ins · {{ checkins?.length ?? 0 }} registros</p>
      <p class="text-sm text-muted-foreground">Registros da paciente entre as sessões. Ela pode editar apenas o check-in do mesmo dia.</p>
      <div v-if="error" class="flex flex-col items-start gap-3 text-sm">
        <p>{{ apiErrorMessage(error, { 403: 'Seu vínculo precisa estar ativo para consultar os check-ins.', default: 'Não foi possível carregar os check-ins desta paciente.' }) }}</p>
        <Button variant="outline" @click="refresh()">Tentar novamente</Button>
      </div>
      <p v-else-if="status === 'pending'" class="text-sm text-muted-foreground">Carregando check-ins…</p>
      <div v-else class="rounded-xl border bg-card p-5"><CheckinHistory :items="checkins ?? []" :empty-message="inactiveMessage" /></div>
    </div>
  </PatientShell>
</template>
