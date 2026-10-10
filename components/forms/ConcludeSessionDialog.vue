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

// "Concluir sessão" (ACO-101, protótipo Sessao.dc.html): pede confirmação e,
// depois de concluir, mostra o estado final com os caminhos de saída.
const props = defineProps<{
  open: boolean
  title: string
  // Versão que o prontuário terá ao concluir.
  nextVersion: number
  // Preenchida quando a conclusão deu certo.
  concludedVersion?: number | null
  patientId: string
  pending?: boolean
}>()
const emit = defineEmits<{ confirm: [], close: [] }>()

// Ao trocar para "Sessão concluída", o foco vai para o título: o leitor de
// tela anuncia o novo estado sem depender de aria-live em conteúdo trocado.
const doneTitle = ref<{ $el?: HTMLElement } | null>(null)
watch(() => props.concludedVersion, async (version) => {
  if (!version) return
  await nextTick()
  doneTitle.value?.$el?.focus()
})
</script>

<template>
  <Dialog :open="props.open" @update:open="(value) => { if (!value && !props.pending) emit('close') }">
    <DialogContent>
      <template v-if="!props.concludedVersion">
        <DialogHeader>
          <DialogTitle>{{ props.title }}</DialogTitle>
          <DialogDescription>
            A sessão fica marcada como realizada e o prontuário é salvo como versão {{ props.nextVersion }}.
            Edições depois disso geram uma nova versão, e o histórico fica guardado.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" :disabled="props.pending" @click="emit('close')">Voltar</Button>
          <Button :loading="props.pending" @click="emit('confirm')">
            {{ props.pending ? 'Concluindo…' : 'Concluir' }}
          </Button>
        </DialogFooter>
      </template>
      <template v-else>
        <DialogHeader>
          <DialogTitle ref="doneTitle" tabindex="-1" class="outline-none">Sessão concluída</DialogTitle>
          <DialogDescription>Prontuário salvo na versão {{ props.concludedVersion }}.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" as-child>
            <NuxtLink :to="`/patients/${props.patientId}/sessions`">Ver ficha</NuxtLink>
          </Button>
          <Button as-child>
            <NuxtLink to="/agenda">Voltar para a agenda</NuxtLink>
          </Button>
        </DialogFooter>
      </template>
    </DialogContent>
  </Dialog>
</template>
