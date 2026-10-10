<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { onBeforeRouteLeave } from 'vue-router'
import { toast } from 'vue-sonner'
import type { Session } from '~/types'
import { RECORD_SECTIONS, updateSessionRecordSchema, type UpdateSessionRecordInput } from '~/schemas/session'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { InlineNotice } from '@/components/ui/inline-notice'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

// Prontuário da sessão em quatro seções (ACO-101). Salvar é explícito
// ("Salvar rascunho"), como no resto do app; "Concluir sessão" grava e trava.
const props = defineProps<{ session: Session, title?: string }>()
const emit = defineEmits<{
  saved: [session: Session]
  reload: []
  // Estado para o SaveStatus do cabeçalho ("Salvando…", "Salvo · versão N").
  status: [state: 'idle' | 'dirty' | 'saving' | 'saved' | 'error']
}>()
const dirty = ref(false)
const conflict = ref(false)
const failed = ref(false)
const concluding = ref(false)
const { handleSubmit, isSubmitting, resetForm, values: formValues } = useForm({ validationSchema: toTypedSchema(updateSessionRecordSchema) })

function savedValues(session: Session): UpdateSessionRecordInput {
  return {
    demand: session.demand ?? '',
    evolution: session.evolution ?? '',
    conduct: session.conduct ?? '',
    referral: session.referral ?? '',
    version: session.version ?? 1,
  }
}
function resetToSaved() {
  resetForm({ values: savedValues(props.session) })
  dirty.value = false
  failed.value = false
}
watch(() => [props.session.id, props.session.version], () => {
  resetToSaved()
  conflict.value = false
}, { immediate: true })

const placeholders: Record<string, string> = {
  referral: 'Preencha só em caso de encaminhamento ou alta.',
}

function statusOf(error: unknown) {
  return apiErrorInfo(error).status
}
// Mensagens por status (A6): versão velha, sessão já concluída, tamanho, vínculo.
function recordErrorMessage(error: unknown, action: 'save' | 'conclude') {
  return apiErrorMessage(error, {
    400: 'Confira o tamanho dos campos: cada um aceita até 10.000 caracteres.',
    403: 'A edição exige vínculo ativo com a paciente.',
    404: 'Esta sessão não está disponível para você.',
    409: 'O prontuário foi alterado em outra aba ou dispositivo. Copie seu texto antes de recarregar.',
    423: 'Esta sessão já foi concluída e o prontuário não aceita mais edições.',
    default: action === 'conclude' ? 'Não foi possível concluir a sessão agora.' : 'Não foi possível salvar o prontuário agora.',
  })
}
function handleWriteError(error: unknown, action: 'save' | 'conclude') {
  failed.value = true
  const status = statusOf(error)
  conflict.value = status === 409
  toast.error(recordErrorMessage(error, action))
  // Concluída em outra aba: recarrega para mostrar o prontuário travado.
  if (status === 423) emit('reload')
}

async function write(values: UpdateSessionRecordInput, action: 'save' | 'conclude') {
  const url = action === 'conclude' ? `/api/sessions/${props.session.id}/conclude` : `/api/sessions/${props.session.id}/record`
  const saved = await $fetch<Session>(url, { method: action === 'conclude' ? 'POST' : 'PUT', body: values })
  conflict.value = false
  failed.value = false
  dirty.value = false
  emit('saved', saved)
  return saved
}

const onSubmit = handleSubmit(async (values) => {
  if (exitProtection.pending.value) return
  try {
    await write(values, 'save')
    toast.success('Prontuário salvo.')
  } catch (error) {
    handleWriteError(error, 'save')
  }
})

// Concluir: valida antes de abrir a confirmação; a escrita leva o texto atual.
const concludeOpen = ref(false)
const concludedVersion = ref<number | null>(null)
const askConclude = handleSubmit(() => {
  concludedVersion.value = null
  concludeOpen.value = true
})
const confirmConclude = handleSubmit(async (values) => {
  concluding.value = true
  try {
    const saved = await write(values, 'conclude')
    concludedVersion.value = saved.version ?? null
  } catch (error) {
    concludeOpen.value = false
    handleWriteError(error, 'conclude')
  } finally {
    concluding.value = false
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
const busy = computed(() => isSubmitting.value || concluding.value)
const unregisterExit = exitProtection.register({ saving: busy, confirm: confirmDiscard })
// Sair da página com texto não salvo pede confirmação (ACO-83), como no
// logout e no Registro Documental.
onBeforeRouteLeave(() => confirmDiscard())
function beforeUnload(event: BeforeUnloadEvent) {
  if (exitProtection.leaving.value || !dirty.value) return
  event.preventDefault()
  event.returnValue = ''
}
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
const saveState = computed(() => {
  if (busy.value) return 'saving'
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
  resetToSaved()
}
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnload)
  unregisterExit()
  decide(false)
})

const lockedLabel = computed(() => props.session.lockedAt ? formatDateTime(props.session.lockedAt) : '')
const disabled = computed(() => busy.value || exitProtection.pending.value)
const conclusionTitle = computed(() => props.title ? `Concluir a ${props.title.charAt(0).toLowerCase()}${props.title.slice(1)}?` : 'Concluir esta sessão?')
// Contador só perto do limite, para não poluir o formulário.
function nearLimit(key: string) {
  const length = [...String((formValues as Record<string, unknown>)[key] ?? '')].length
  return length > 9000 ? `${length.toLocaleString('pt-BR')} de 10.000 caracteres` : ''
}
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

        <template v-if="session.locked">
          <InlineNotice tone="neutral">
            Sessão concluída<template v-if="lockedLabel"> em {{ lockedLabel }}</template>. O prontuário não aceita mais edições.
          </InlineNotice>
          <ClinicalRecordSections
            :demand="session.demand"
            :evolution="session.evolution"
            :conduct="session.conduct"
            :referral="session.referral"
            :notes="session.notes"
          />
        </template>

        <template v-else>
          <!-- Registro anterior às seções: fica visível, só leitura. -->
          <section v-if="session.notes?.trim()" aria-labelledby="t-notes" class="flex flex-col gap-1.5 rounded-xl bg-secondary px-4 py-3">
            <h3 id="t-notes" class="label-mono">Anotações</h3>
            <p class="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{{ session.notes }}</p>
            <p class="text-xs text-muted-foreground">Texto registrado antes do prontuário em seções. Continua visível para a paciente e não é editado aqui.</p>
          </section>
          <FormField v-for="section in RECORD_SECTIONS" :key="section.key" v-slot="{ componentField }" :name="section.key">
            <FormItem class="flex flex-col gap-1.5 space-y-0">
              <FormLabel class="text-sm font-semibold">{{ section.label }}</FormLabel>
              <FormControl>
                <Textarea
                  :rows="section.rows"
                  class="min-h-[72px]"
                  :placeholder="placeholders[section.key]"
                  :disabled="disabled"
                  v-bind="componentField"
                  @update:model-value="onInput"
                />
              </FormControl>
              <p v-if="nearLimit(section.key)" class="font-mono text-xs text-muted-foreground">{{ nearLimit(section.key) }}</p>
              <FormMessage />
            </FormItem>
          </FormField>
          <p class="text-xs leading-relaxed text-muted-foreground">Todos os campos são opcionais. Salve o rascunho quando quiser; ao concluir, o prontuário fica fechado para edição.</p>
          <InlineNotice v-if="conflict" tone="warning">O prontuário foi alterado em outra aba ou dispositivo. Copie seu texto antes de recarregar.</InlineNotice>
        </template>
      </Card>
      <div v-if="$slots.aside" class="flex min-w-0 flex-[2_1_320px] flex-col gap-6">
        <slot name="aside" />
      </div>
    </div>
    <!-- No celular o rodapé fica preso embaixo para o salvar estar sempre ao alcance. -->
    <div
      v-if="!session.locked"
      class="sticky bottom-0 z-10 -mx-4 flex animate-rise flex-wrap justify-end gap-2.5 border-t bg-background px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] [animation-delay:.3s] md:static md:mx-0 md:px-0 md:pb-0 md:pt-2"
    >
      <Button
        type="button"
        variant="destructive-soft"
        class="mr-auto"
        :disabled="!dirty || disabled"
        @click="discardChanges"
      >
        Descartar alterações
      </Button>
      <Button v-if="conflict" type="button" variant="outline" @click="emit('reload')">Recarregar prontuário</Button>
      <Button type="submit" variant="outline" :loading="isSubmitting" :disabled="conflict || disabled">
        {{ isSubmitting ? 'Salvando…' : 'Salvar rascunho' }}
      </Button>
      <Button type="button" :disabled="conflict || disabled" @click="askConclude">Concluir sessão</Button>
    </div>
  </form>
  <UnsavedChangesDialog :open="confirmOpen" @decision="decide" />
  <ConcludeSessionDialog
    :open="concludeOpen"
    :title="conclusionTitle"
    :next-version="(session.version ?? 1) + (concludedVersion ? 0 : 1)"
    :concluded-version="concludedVersion"
    :patient-id="session.patientId"
    :pending="concluding"
    @confirm="confirmConclude"
    @close="concludeOpen = false"
  />
</template>
