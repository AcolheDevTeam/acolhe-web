<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'psychologist-only'] })
const identity = useDocumentaryIdentity()
const { patientId } = usePatientFicha()
</script>
<template>
  <DocumentaryEditor
    :key="`${identity}:${patientId}`"
    :patient-id="patientId"
  />
</template>
