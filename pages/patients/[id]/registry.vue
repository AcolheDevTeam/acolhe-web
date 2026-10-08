<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'psychologist-only'] })
const route = useRoute()
const identity = useDocumentaryIdentity()
const patientId = computed(() => String(route.params.id))
const { data: patient } = usePatient(patientId)
</script>
<template>
  <PatientShell
    :patient="patient ?? null"
    :patient-id="patientId"
    active="registry"
    ><DocumentaryEditor
      :key="`${identity}:${patientId}`"
      :patient-id="patientId"
  /></PatientShell>
</template>
