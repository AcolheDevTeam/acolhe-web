<script setup lang="ts">
definePageMeta({ layout: 'patient', middleware: ['auth', 'patient-only'] })

// Protótipo: abas Pendentes/Enviadas. A API do portal só lista as pendentes
// hoje; "Enviadas" entra quando houver o endpoint (item 15 do mapa).
const { activities, pending, error } = usePatientPortal()
</script>

<template>
  <div class="flex flex-col gap-5">
    <PatientPageHeader eyebrow="Enviadas pela sua psicóloga" title="Atividades" />
    <PortalLoadState :pending="pending" :error="error">
      <section class="animate-rise flex flex-col gap-3 [animation-delay:60ms]" aria-labelledby="t-pendentes">
        <h2 id="t-pendentes" class="label-mono">Pendentes · {{ activities.data.value.length }}</h2>
        <PatientActivityList :activities="activities.data.value" />
        <p class="text-xs text-muted-foreground">Só você e sua psicóloga veem suas respostas.</p>
      </section>
    </PortalLoadState>
  </div>
</template>
