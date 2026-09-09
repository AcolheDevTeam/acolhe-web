<script setup lang="ts">
import { Archive, Check } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { ActivityTemplateDetail, TemplateRequest } from '~/schemas/activity-template'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

// Detalhe e edição de um template. Editável só para a autora, não arquivado e
// sem versão mais nova; nos demais casos o builder abre em leitura.
definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const route = useRoute()
const templateId = computed(() => route.params.id as string)
const { data: template, status, error } = useTemplate(templateId)

const submitting = ref(false)
const initial = computed(() => (template.value ? templateToFormValues(template.value) : null))
const readonly = computed(() => !template.value?.editable)

// Por que a edição está bloqueada, na ordem em que a API decide.
const readonlyReason = computed(() => {
  const t = template.value
  if (!t || t.editable) return null
  if (t.isArchived) return 'Este template está arquivado. Ele não pode ser editado nem atribuído.'
  if (t.superseded) return `Esta é a versão ${t.version}, já substituída por uma mais nova. Edite a versão atual na biblioteca.`
  if (t.isGlobal) return 'Template da biblioteca Acolhe: somente leitura para todas as clínicas.'
  return 'Este template foi criado por outra pessoa da organização e só a autora pode editá-lo.'
})

const willCreateVersion = computed(() => (template.value?.assignmentCount ?? 0) > 0)
const submitLabel = computed(() =>
  willCreateVersion.value ? `Publicar v${(template.value?.version ?? 1) + 1}` : 'Salvar',
)

async function save(values: TemplateRequest) {
  if (!template.value) return
  submitting.value = true
  try {
    const saved = await $fetch<ActivityTemplateDetail>(`/api/templates/${template.value.id}`, { method: 'PUT', body: values })
    await refreshNuxtData('templates-list')
    if (saved.id !== template.value.id) {
      toast.success(`Versão ${saved.version} publicada. As atividades já atribuídas continuam na versão ${template.value.version}.`)
      await navigateTo(`/templates/${saved.id}`, { replace: true })
    } else {
      toast.success('Template salvo.')
      await refreshNuxtData(`template-${template.value.id}`)
    }
  } catch (error) {
    toast.error(templateApiErrorMessage(error, 'Não foi possível salvar o template agora.'))
  } finally {
    submitting.value = false
  }
}

async function onArchived() {
  await refreshNuxtData(`template-${templateId.value}`)
}
</script>

<template>
  <PageHeader>
    <template #title>
      <nav class="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
        <NuxtLink to="/templates" class="hidden hover:text-foreground sm:inline">Templates</NuxtLink>
        <span class="hidden sm:inline">/</span>
        <span class="truncate text-foreground">{{ template?.title ?? 'Template' }}</span>
        <Badge v-if="template" variant="outline" class="hidden font-normal tabular-nums sm:inline-flex">v{{ template.version }}</Badge>
      </nav>
    </template>
    <template #actions>
      <template v-if="template">
        <ArchiveTemplateDialog
          v-if="template.ownedByMe && !template.isArchived"
          :template="template"
          @archived="onArchived"
        >
          <Button variant="outline" size="sm" aria-label="Arquivar template">
            <Archive />
            <span class="hidden sm:inline">Arquivar</span>
          </Button>
        </ArchiveTemplateDialog>
        <template v-if="!readonly">
          <Button variant="ghost" size="sm" as-child class="hidden sm:inline-flex">
            <NuxtLink to="/templates">Descartar</NuxtLink>
          </Button>
          <Button type="submit" form="template-form" size="sm" :disabled="submitting">
            <Check />
            {{ submitLabel }}
          </Button>
        </template>
      </template>
    </template>
  </PageHeader>

  <div class="flex flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
    <template v-if="status === 'pending'">
      <Skeleton class="h-10 w-2/3" />
      <Skeleton class="h-24 w-full" />
      <Skeleton class="h-40 w-full" />
    </template>

    <p
      v-else-if="error || !template"
      class="rounded-lg border border-dashed px-4 py-16 text-center text-sm text-muted-foreground"
    >
      {{ apiErrorMessage(error, { 404: 'Template não encontrado. Ele pode ter sido removido ou pertencer a outra organização.' }) }}
    </p>

    <template v-else>
      <div
        v-if="readonlyReason"
        class="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm"
      >
        <Badge variant="secondary" class="font-normal">{{ template.isArchived ? 'Arquivado' : template.superseded ? 'Versão antiga' : templateOriginLabel(template) }}</Badge>
        <span class="text-muted-foreground">{{ readonlyReason }}</span>
      </div>
      <p v-else-if="willCreateVersion" class="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Este template já foi atribuído {{ template.assignmentCount === 1 ? '1 vez' : `${template.assignmentCount} vezes` }}.
        Ao salvar, uma nova versão é publicada e as atividades existentes continuam com a versão {{ template.version }}.
      </p>

      <TemplateForm
        v-if="initial"
        :key="template.id"
        :initial="initial"
        :readonly="readonly"
        @submit="save"
      />
    </template>
  </div>
</template>
