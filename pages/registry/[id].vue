<script setup lang="ts">
import { categorySchema, type DocumentaryCategory } from '~/schemas/documentary'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })
const route = useRoute()
const identity = useDocumentaryIdentity()
const patientId = computed(() => String(route.params.id))
// Mesma chave do editor: a requisição é uma só e o nome vai para o caminho.
const { data } = await useDocumentaryPatient(patientId)
// "Abrir caderno" na lista manda a categoria escolhida (?categoria=planning).
const initialCategory = computed(() => {
  const parsed = categorySchema.safeParse(route.query.categoria)
  return parsed.success ? parsed.data : undefined
})
// Troca de categoria no caderno atualiza a URL: recarregar abre a mesma.
function keepCategory(categoria: DocumentaryCategory) {
  void navigateTo({ query: { ...route.query, categoria } }, { replace: true })
}
const crumbs = computed(() => [
  { label: 'Registro Documental', to: '/registry' },
  { label: data.value?.patient.fullName ?? 'Caderno' },
])
</script>
<template>
  <PageHeader>
    <template #title>
      <Breadcrumb :items="crumbs" current-tag="h1" />
    </template>
  </PageHeader>
  <div class="px-4 pb-14 pt-6 md:px-8 lg:px-12">
    <DocumentaryEditor
      :key="`${identity}:${patientId}`"
      :patient-id="patientId"
      :initial-category="initialCategory"
      @category-change="keepCategory"
      class="animate-rise [animation-delay:60ms]"
    />
  </div>
</template>
