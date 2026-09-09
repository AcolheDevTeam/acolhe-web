<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { ActivityTemplateDetail, TemplateRequest } from '~/schemas/activity-template'
import { Button } from '@/components/ui/button'

// Novo template (tela 12 do design, "Publicar v1"). Salvar já publica: não há
// rascunho nesta versão.
definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const submitting = ref(false)
const initial = emptyTemplateForm()

async function create(values: TemplateRequest) {
  submitting.value = true
  try {
    const created = await $fetch<ActivityTemplateDetail>('/api/templates', { method: 'POST', body: values })
    toast.success('Template publicado. Já pode ser atribuído às pacientes.')
    await refreshNuxtData('templates-list')
    await navigateTo(`/templates/${created.id}`)
  } catch (error) {
    toast.error(templateApiErrorMessage(error, 'Não foi possível publicar o template agora.'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <PageHeader>
    <template #title>
      <nav class="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
        <NuxtLink to="/templates" class="hidden hover:text-foreground sm:inline">Templates</NuxtLink>
        <span class="hidden sm:inline">/</span>
        <span class="truncate text-foreground">Novo template</span>
      </nav>
    </template>
    <template #actions>
      <Button variant="ghost" size="sm" as-child>
        <NuxtLink to="/templates">Descartar</NuxtLink>
      </Button>
      <Button type="submit" form="template-form" size="sm" :disabled="submitting">
        <Check />
        Publicar v1
      </Button>
    </template>
  </PageHeader>

  <div class="px-4 py-6 md:px-8 md:py-8">
    <TemplateForm :initial="initial" @submit="create" />
  </div>
</template>
