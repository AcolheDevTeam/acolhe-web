<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
defineProps<{ open: boolean }>()
const emit = defineEmits<{ decision: [discard: boolean] }>()
</script>
<template>
  <Dialog
    :open="open"
    @update:open="
      (value) => {
        if (!value) emit('decision', false)
      }
    "
  >
    <DialogContent
      ><DialogHeader
        ><DialogTitle>Descartar alterações não salvas?</DialogTitle
        ><DialogDescription
          >O texto digitado existe apenas nesta página. Ao continuar, as
          alterações não salvas serão descartadas.</DialogDescription
        ></DialogHeader
      ><DialogFooter
        ><Button variant="outline" @click="emit('decision', false)"
          >Continuar editando</Button
        ><Button @click="emit('decision', true)"
          >Descartar e continuar</Button
        ></DialogFooter
      ></DialogContent
    >
  </Dialog>
</template>
