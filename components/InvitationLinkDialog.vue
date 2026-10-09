<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { ClinicInvitationResult } from '~/schemas/clinic'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Link de um convite reenviado: o anterior deixou de valer, então o novo
// precisa aparecer na tela mesmo quando o e-mail falha.
const props = defineProps<{ result: ClinicInvitationResult | null }>()
const emit = defineEmits<{ close: [] }>()

async function copy() {
  if (!props.result) return
  try {
    await navigator.clipboard.writeText(props.result.link)
    toast.success('Link do convite copiado.')
  }
  catch {
    toast.error('Não foi possível copiar automaticamente. Selecione o link exibido.')
  }
}
</script>

<template>
  <Dialog :open="result !== null" @update:open="(value) => { if (!value) emit('close') }">
    <DialogContent>
      <DialogHeader>
        <DialogTitle class="font-serif text-2xl font-normal">Convite reenviado</DialogTitle>
        <DialogDescription>O link anterior deixou de valer. {{ result ? deliveryMessage(result.deliveryStatus) : '' }}</DialogDescription>
      </DialogHeader>
      <p v-if="result" class="break-all rounded-md border bg-muted/40 p-3 font-mono text-xs">{{ result.link }}</p>
      <div class="flex gap-2">
        <Button variant="outline" @click="copy">Copiar link</Button>
        <Button @click="emit('close')">Concluir</Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
