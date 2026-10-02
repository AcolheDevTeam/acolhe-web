<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'psychologist-only'] })
const route = useRoute()
const identity = useDocumentaryIdentity()
</script>
<template>
  <PageHeader title="Registro Documental" />
  <div class="px-4 py-6 md:px-8 md:py-8">
    <NuxtLink
      to="/registry"
      class="text-sm text-muted-foreground hover:text-foreground"
      >Voltar aos cadernos</NuxtLink
    ><DocumentaryEditor
      :key="`${identity}:${route.params.id}`"
      :patient-id="String(route.params.id)"
      class="mt-6"
    />
  </div>
</template>
