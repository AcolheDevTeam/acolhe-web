<script setup lang="ts">
// Confirmação de ação sem volta (regra A2: nunca `confirm()` do browser).
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

withDefaults(defineProps<{
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
}>(), { cancelLabel: 'Voltar', destructive: false })
const emit = defineEmits<{ decision: [confirmed: boolean] }>()
</script>

<template>
  <Dialog :open="open" @update:open="(value) => { if (!value) emit('decision', false) }">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="emit('decision', false)">{{ cancelLabel }}</Button>
        <Button :variant="destructive ? 'destructive' : 'default'" @click="emit('decision', true)">{{ confirmLabel }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
