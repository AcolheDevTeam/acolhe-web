<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { ActivityTemplateDetail, TemplateRequest } from '~/schemas/activity-template'
import { Button } from '@/components/ui/button'

// Novo template (protótipo "Builder", "Publicar v1"). Salvar já publica: não há
// rascunho nesta versão.
definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const submitting = ref(false)
const initial = emptyTemplateForm()
const form = ref<{ markSaved: () => void } | null>(null)

async function create(values: TemplateRequest) {
  submitting.value = true
  try {
    const created = await $fetch<ActivityTemplateDetail>('/api/templates', { method: 'POST', body: values })
    form.value?.markSaved()
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
      <div class="flex min-w-0 items-center gap-2 font-mono text-xs tracking-[0.06em] text-muted-foreground">
        <nav aria-label="Caminho">
          <NuxtLink to="/templates" class="underline-offset-[3px] hover:text-foreground hover:underline">Templates</NuxtLink>
        </nav>
        <span aria-hidden="true">/</span>
        <h1 class="truncate font-normal text-foreground">Novo template</h1>
      </div>
    </template>
    <template #actions>
      <Button variant="ghost" as-child>
        <NuxtLink to="/templates">Descartar</NuxtLink>
      </Button>
      <Button type="submit" form="template-form" :loading="submitting">
        Publicar v1
      </Button>
    </template>
  </PageHeader>

  <div class="px-4 pb-14 pt-6 md:px-8 lg:px-12">
    <TemplateForm ref="form" :initial="initial" :saving="submitting" presets @submit="create" />
  </div>
</template>
