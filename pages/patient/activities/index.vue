<script setup lang="ts">
definePageMeta({ layout: 'patient', middleware: ['auth', 'patient-only'] })

const { activities, pending, error } = usePatientPortal()
</script>

<template>
  <div class="flex flex-col gap-6">
    <PatientPageHeader eyebrow="Enviadas pela sua psicóloga" title="Atividades" />
    <PortalLoadState :pending="pending" :error="error">
      <section class="flex flex-col gap-3" aria-labelledby="t-pendentes">
        <h2 id="t-pendentes" class="label-mono">Pendentes · {{ activities.data.value.length }}</h2>
        <PatientActivityList :activities="activities.data.value" />
        <p class="text-xs text-muted-foreground">Só você e sua psicóloga veem suas respostas.</p>
      </section>
    </PortalLoadState>
  </div>
</template>
