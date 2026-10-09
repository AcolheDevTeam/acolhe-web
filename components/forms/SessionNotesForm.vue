<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { onBeforeRouteLeave } from 'vue-router'
import { toast } from 'vue-sonner'
import type { Session } from '~/types'
import { updateSessionNotesSchema } from '~/schemas/session'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { InlineNotice } from '@/components/ui/inline-notice'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const props = defineProps<{ session: Session }>()
const emit = defineEmits<{
  saved: [session: Session]
  reload: []
  // Estado para o SaveStatus do cabeçalho ("Salvando…", "Salvo · versão N").
  status: [state: 'idle' | 'dirty' | 'saving' | 'saved' | 'error']
}>()
const dirty = ref(false)
const conflict = ref(false)
const failed = ref(false)
const { handleSubmit, isSubmitting, resetForm } = useForm({ validationSchema: toTypedSchema(updateSessionNotesSchema) })
watch(() => [props.session.id, props.session.version], () => {
  resetForm({ values: { notes: props.session.notes ?? '', version: props.session.version ?? 1 } })
  conflict.value = false
  failed.value = false
  dirty.value = false
}, { immediate: true })
const onSubmit = handleSubmit(async (values) => {
  if (exitProtection.pending.value) return
  try {
    const saved = await $fetch<Session>(`/api/sessions/${props.session.id}/notes`, { method: 'PUT', body: values })
    resetForm({ values: { notes: saved.notes ?? '', version: saved.version ?? 1 } })
    conflict.value = false
    failed.value = false
    dirty.value = false
    emit('saved', saved)
    toast.success('Evolução salva.')
  } catch (error) {
    failed.value = true
    conflict.value = (error as { statusCode?: number, status?: number }).statusCode === 409 || (error as { status?: number }).status === 409
    toast.error(apiErrorMessage(error, {
      400: 'Confira o tamanho do texto da evolução.',
      403: 'A edição exige vínculo ativo e um prontuário desbloqueado.',
      404: 'Esta sessão não está disponível para você.',
      409: 'A evolução foi alterada em outra aba. Copie seu texto antes de recarregar.',
      default: 'Não foi possível salvar a evolução agora.',
    }))
  }
})
const exitProtection = useNuxtApp().$protectedLogout
const confirmOpen = ref(false)
let resolveConfirmation: ((discard: boolean) => void) | undefined
function decide(discard: boolean) {
  confirmOpen.value = false
  resolveConfirmation?.(discard)
  resolveConfirmation = undefined
}
function confirmDiscard(): Promise<boolean> {
  if (!dirty.value) return Promise.resolve(true)
  if (resolveConfirmation) return Promise.resolve(false)
  confirmOpen.value = true
  return new Promise<boolean>(resolve => { resolveConfirmation = resolve })
}
const unregisterExit = exitProtection.register({ saving: isSubmitting, confirm: confirmDiscard })
// Sair da página com evolução não salva também pede confirmação (ACO-83),
// como no logout e no Registro Documental.
onBeforeRouteLeave(() => confirmDiscard())
function beforeUnload(event: BeforeUnloadEvent) {
  if (exitProtection.leaving.value || !dirty.value) return
  event.preventDefault()
  event.returnValue = ''
}
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
// Não há autosave: o estado reflete só a ação "Salvar evolução".
const saveState = computed(() => {
  if (isSubmitting.value) return 'saving'
  if (failed.value) return 'error'
  if (dirty.value) return 'dirty'
  return props.session.version ? 'saved' : 'idle'
})
watch(saveState, state => emit('status', state), { immediate: true })
function onInput() {
  dirty.value = true
  failed.value = false
}
// "Descartar alterações" volta ao texto salvo, com a mesma confirmação da saída.
async function discardChanges() {
  if (!(await confirmDiscard())) return
  resetForm({ values: { notes: props.session.notes ?? '', version: props.session.version ?? 1 } })
  dirty.value = false
  failed.value = false
}
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnload)
  unregisterExit()
  decide(false)
})
</script>

<template>
  <form class="flex flex-col gap-6" @submit="onSubmit">
    <div class="flex flex-wrap items-start gap-6">
      <Card
        role="region"
        aria-labelledby="t-pront"
        class="flex min-w-0 flex-[3_1_480px] animate-rise flex-col gap-[18px] p-6 [animation-delay:.15s]"
      >
        <h2 id="t-pront" class="label-mono">Prontuário</h2>
        <InlineNotice v-if="session.locked" tone="neutral">Este prontuário está bloqueado para edição.</InlineNotice>
        <FormField v-slot="{ componentField }" name="notes">
          <FormItem class="flex flex-col gap-1.5 space-y-0">
            <FormLabel class="text-sm font-semibold">Evolução da sessão (opcional)</FormLabel>
            <FormControl><Textarea rows="10" placeholder="Registro clínico…" @update:model-value="onInput" :disabled="session.locked || isSubmitting || exitProtection.pending.value" v-bind="componentField" /></FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <p v-if="!session.locked" class="text-xs leading-relaxed text-muted-foreground">Você pode salvar sem texto e preencher depois. O status do atendimento é definido no agendamento.</p>
        <InlineNotice v-if="conflict" tone="warning">A evolução foi alterada em outra aba. Copie seu texto antes de recarregar.</InlineNotice>
      </Card>
      <div v-if="$slots.aside" class="flex min-w-0 flex-[2_1_320px] flex-col gap-6">
        <slot name="aside" />
      </div>
    </div>
    <!-- No celular o rodapé fica preso embaixo para o salvar estar sempre ao alcance. -->
    <div class="sticky bottom-0 z-10 -mx-4 flex animate-rise flex-wrap justify-end gap-2.5 border-t bg-background px-4 py-3 [animation-delay:.3s] md:static md:mx-0 md:px-0 md:pb-0 md:pt-2">
      <Button
        v-if="!session.locked"
        type="button"
        variant="destructive-soft"
        class="mr-auto"
        :disabled="!dirty || isSubmitting || exitProtection.pending.value"
        @click="discardChanges"
      >
        Descartar alterações
      </Button>
      <Button v-if="conflict" type="button" variant="outline" @click="emit('reload')">Recarregar evolução</Button>
      <Button type="submit" :loading="isSubmitting" :disabled="session.locked || conflict || exitProtection.pending.value">{{ isSubmitting ? 'Salvando…' : 'Salvar evolução' }}</Button>
    </div>
  </form>
  <UnsavedChangesDialog :open="confirmOpen" @decision="decide" />
</template>
