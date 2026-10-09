<script setup lang="ts">
import { Archive } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { ActivityTemplateDetail, TemplateRequest } from '~/schemas/activity-template'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { InlineNotice } from '@/components/ui/inline-notice'
import { Skeleton } from '@/components/ui/skeleton'

// Detalhe e edição de um template (protótipo "Builder"). Editável só para a
// autora, não arquivado e sem versão mais nova; nos demais casos o builder abre
// em leitura.
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
      <div class="flex min-w-0 items-center gap-2 font-mono text-xs tracking-[0.06em] text-muted-foreground">
        <nav aria-label="Caminho">
          <NuxtLink to="/templates" class="underline-offset-[3px] hover:text-foreground hover:underline">Templates</NuxtLink>
        </nav>
        <span aria-hidden="true">/</span>
        <h1 class="truncate font-normal text-foreground">{{ template?.title ?? 'Template' }}</h1>
        <span v-if="template" class="shrink-0 tabular-nums">v{{ template.version }}</span>
      </div>
    </template>
    <template #actions>
      <template v-if="template">
        <ArchiveTemplateDialog
          v-if="template.ownedByMe && !template.isArchived"
          :template="template"
          @archived="onArchived"
        >
          <Button variant="outline" aria-label="Arquivar template">
            <Archive />
            <span class="hidden sm:inline">Arquivar</span>
          </Button>
        </ArchiveTemplateDialog>
        <template v-if="!readonly">
          <Button variant="ghost" as-child>
            <NuxtLink to="/templates">Descartar</NuxtLink>
          </Button>
          <Button type="submit" form="template-form" :loading="submitting">
            {{ submitLabel }}
          </Button>
        </template>
      </template>
    </template>
  </PageHeader>

  <div class="flex flex-col gap-6 px-4 pb-14 pt-6 md:px-8 lg:px-12">
    <template v-if="status === 'pending'">
      <Skeleton class="h-10 w-2/3" />
      <Skeleton class="h-24 w-full" />
      <Skeleton class="h-40 w-full" />
    </template>

    <EmptyState v-else-if="error || !template" compact>
      {{ apiErrorMessage(error, { 404: 'Template não encontrado. Ele pode ter sido removido ou pertencer a outra organização.' }) }}
    </EmptyState>

    <template v-else>
      <InlineNotice v-if="readonlyReason" tone="neutral" class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Badge :variant="template.isArchived ? 'warning' : 'outline'">
          {{ template.isArchived ? 'Arquivado' : template.superseded ? 'Versão antiga' : templateOriginLabel(template) }}
        </Badge>
        <span>{{ readonlyReason }}</span>
      </InlineNotice>
      <InlineNotice v-else-if="willCreateVersion" tone="neutral">
        Este template já foi atribuído {{ template.assignmentCount === 1 ? '1 vez' : `${template.assignmentCount} vezes` }}.
        Ao salvar, uma nova versão é publicada e as atividades existentes continuam com a versão {{ template.version }}.
      </InlineNotice>

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
