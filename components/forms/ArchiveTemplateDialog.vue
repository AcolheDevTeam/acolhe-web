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
// biblioteca, atividades já atribuídas continuam válidas. Aceita o resumo da
// lista (sem `assignmentCount`) e o detalhe.
const { template } = defineProps<{
  template: Pick<ActivityTemplateDetail, 'id' | 'title'> & { assignmentCount?: number }
}>()
const emit = defineEmits<{ archived: [template: ActivityTemplateDetail] }>()

const open = ref(false)
const submitting = ref(false)

async function archive() {
  submitting.value = true
  try {
    const archived = await $fetch<ActivityTemplateDetail>(`/api/templates/${template.id}/archive`, { method: 'POST' })
    toast.success(`"${template.title}" foi arquivado.`)
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
    <DialogContent class="max-w-[440px] gap-3.5">
      <DialogHeader class="text-left">
        <DialogTitle class="text-xl leading-snug tracking-[-0.01em]">Arquivar “{{ template.title }}”?</DialogTitle>
        <DialogDescription class="text-[15px] leading-[1.55] text-secondary-foreground">
          O template sai da biblioteca e não pode mais ser enviado.
          <template v-if="template.assignmentCount">
            {{ template.assignmentCount === 1 ? 'A atividade já atribuída continua válida' : `As ${template.assignmentCount} atividades já atribuídas continuam válidas` }} para as pacientes.
          </template>
          <template v-else-if="template.assignmentCount === undefined">
            As pacientes que já receberam continuam respondendo normalmente.
          </template>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter class="mt-2 gap-2.5">
        <Button type="button" variant="outline" :disabled="submitting" @click="open = false">Cancelar</Button>
        <Button type="button" variant="destructive" :loading="submitting" @click="archive">Arquivar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
