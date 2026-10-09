<script setup lang="ts">
// Ficha da paciente: rota-mãe das abas. Cabeçalho e abas ficam montados ao
// trocar de aba; só o conteúdo (<NuxtPage>) muda. As abas já visitadas ficam
// em keepalive, então voltar a uma delas mostra o que já estava carregado.
definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const route = useRoute()
const patientId = computed(() => String(route.params.id))
const { data: patient } = usePatient(patientId)

const clinicalAccess = computed(() => patientLinkActive(patient.value) && patient.value?.id === patientId.value)
providePatientFicha({ patientId, patient, clinicalAccess })

const TABS = ['sessions', 'activities', 'checkins', 'registry'] as const
const active = computed(() => {
  const tab = route.path.split('/')[3]
  return TABS.find(t => t === tab) ?? 'overview'
})
</script>

<template>
  <PatientShell :patient="patient ?? null" :patient-id="patientId" :active="active">
    <NuxtPage :keepalive="{ max: 5 }" />
  </PatientShell>
</template>
