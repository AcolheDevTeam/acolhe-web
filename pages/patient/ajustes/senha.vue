<script setup lang="ts">
// Trocar senha da paciente (ACO-102): o mesmo formulário e a mesma rota da
// psicóloga (POST /me/password, ACO-98). As outras sessões são encerradas.
definePageMeta({ layout: 'patient', middleware: ['auth', 'patient-only'] })
useHead({ title: 'Trocar senha · Ajustes · Acolhe' })
</script>

<template>
  <div class="flex flex-col gap-6">
    <PatientPageHeader title="Trocar senha" back="/patient/ajustes" back-label="Voltar aos ajustes" />
    <section class="animate-rise rounded-2xl border bg-card p-5 [animation-delay:60ms]" aria-label="Trocar senha">
      <ChangePasswordForm stacked />
    </section>
  </div>
</template>
