<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { ActivityTemplateDetail } from '~/schemas/activity-template'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// Confirmação para arquivar um template. Explica o efeito real: sai da
// biblioteca, atividades já atribuídas continuam válidas.
const { template } = defineProps<{ template: ActivityTemplateDetail }>()
const emit = defineEmits<{ archived: [template: ActivityTemplateDetail] }>()

const open = ref(false)
const submitting = ref(false)

async function archive() {
  submitting.value = true
  try {
    const archived = await $fetch<ActivityTemplateDetail>(`/api/templates/${template.id}/archive`, { method: 'POST' })
    toast.success('Template arquivado.')
    open.value = false
    await refreshNuxtData('templates-list')
    emit('archived', archived)
  } catch (error) {
    toast.error(apiErrorMessage(error, {
      403: 'Só a autora pode arquivar este template.',
      404: 'Template não encontrado. Ele pode ter sido removido.',
      409: 'Este template já está arquivado.',
      default: 'Não foi possível arquivar o template agora.',
    }))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <slot />
    </DialogTrigger>
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="font-serif text-2xl font-normal">Arquivar template?</DialogTitle>
        <DialogDescription>
          "{{ template.title }}" sai da biblioteca e não poderá mais ser atribuído.
          <template v-if="template.assignmentCount > 0">
            As {{ template.assignmentCount === 1 ? 'atividade já atribuída continua' : `${template.assignmentCount} atividades já atribuídas continuam` }} válidas para as pacientes.
          </template>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button type="button" variant="outline" :disabled="submitting" @click="open = false">Cancelar</Button>
        <Button type="button" :disabled="submitting" @click="archive">Arquivar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
