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
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Undo2 } from 'lucide-vue-next'

// Prontuário da sessão em quatro seções (ACO-101). Salvar é explícito
// ("Salvar rascunho"), como no resto do app. "Concluir sessão" grava uma
// versão e marca a sessão como realizada; editar depois gera nova versão.
const props = defineProps<{ session: Session, title?: string }>()
const emit = defineEmits<{
  saved: [session: Session]
  reload: []
  // Estado para o SaveStatus do cabeçalho ("Salvando…", "Salvo · versão N").
  status: [state: 'idle' | 'dirty' | 'saving' | 'saved' | 'error']
}>()
const dirty = ref(false)
const conflict = ref(false)
// Prontuário travado por outro motivo que não a conclusão (423).
const blocked = ref(false)
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
  // Nunca apaga texto não salvo por baixo do usuário: com alterações
  // pendentes, a troca de versão só acontece por "Recarregar prontuário",
  // que pede confirmação antes.
  if (dirty.value) return
  resetToSaved()
  conflict.value = false
  blocked.value = false
}, { immediate: true })

const placeholders: Record<string, string> = {
  referral: 'Preencha só em caso de encaminhamento ou alta.',
}

function statusOf(error: unknown) {
  return apiErrorInfo(error).status
}
// A API diz qual campo falhou ("o campo Conduta passa do limite…"); o BFF
// repassa essa frase em data.message. Só ela é exibida, nunca outro texto técnico.
function fieldMessage(error: unknown): string | undefined {
  const technical = apiErrorInfo(error).technical
  if (!technical || !/^o campo .+/.test(technical)) return undefined
  return `${technical.charAt(0).toUpperCase()}${technical.slice(1)}.`
}
const CONFLICT_TEXT = 'O prontuário foi alterado em outra aba ou dispositivo. Seu texto continua aqui: copie o que precisar antes de recarregar.'
// Mensagens por status (A6): versão velha, consulta com falta, tamanho, vínculo.
function recordErrorMessage(error: unknown, action: 'save' | 'conclude') {
  return apiErrorMessage(error, {
    400: fieldMessage(error) ?? 'Alguns campos não foram aceitos. Cada um aceita até 10.000 caracteres.',
    403: 'A edição exige vínculo ativo com o(a) paciente.',
    404: 'Esta sessão não está disponível para você.',
    409: action === 'conclude' && apiErrorInfo(error).technical?.includes('falta ou cancelada')
      ? 'Esta sessão está ligada a uma consulta marcada como falta ou cancelada e não pode ser concluída.'
      : CONFLICT_TEXT,
    423: 'Este prontuário está bloqueado para edição.',
    default: action === 'conclude' ? 'Não foi possível concluir a sessão agora.' : 'Não foi possível salvar o prontuário agora.',
  })
}
function handleWriteError(error: unknown, action: 'save' | 'conclude') {
  failed.value = true
  const status = statusOf(error)
  const technical = apiErrorInfo(error).technical ?? ''
  // O texto digitado fica no formulário em qualquer erro.
  conflict.value = status === 409 && !technical.includes('falta ou cancelada')
  blocked.value = status === 423
  toast.error(recordErrorMessage(error, action))
}
// Recarregar descarta o texto não salvo: pede a mesma confirmação da saída.
async function reloadRecord() {
  if (!(await confirmDiscard())) return
  dirty.value = false
  emit('reload')
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

const concludedLabel = computed(() => props.session.concludedAt ? formatDateTime(props.session.concludedAt) : '')
const nextVersion = computed(() => (props.session.version ?? 1) + 1)
const disabled = computed(() => busy.value || exitProtection.pending.value)
const conclusionTitle = computed(() => props.title && props.title !== 'Sessão' ? `Concluir a ${props.title.charAt(0).toLowerCase()}${props.title.slice(1)}?` : 'Concluir esta sessão?')
// Contador só perto do limite, para não poluir o formulário. Fica ligado ao
// campo pelo aria-describedby do FormControl (FormDescription).
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
          <InlineNotice tone="neutral">Este prontuário está bloqueado para edição.</InlineNotice>
          <ClinicalRecordSections
            :demand="session.demand"
            :evolution="session.evolution"
            :conduct="session.conduct"
            :referral="session.referral"
            :notes="session.notes"
          />
        </template>

        <template v-else>
          <InlineNotice v-if="session.concluded" tone="positive">
            Sessão concluída<template v-if="concludedLabel"> em {{ concludedLabel }}</template>.
            Se você editar, as alterações são salvas como versão {{ nextVersion }}, e o histórico fica guardado.
          </InlineNotice>
          <!-- Registro anterior às seções: fica visível, só leitura. -->
          <section v-if="session.notes?.trim()" aria-labelledby="t-notes" class="flex flex-col gap-1.5 rounded-xl bg-secondary px-4 py-3">
            <h3 id="t-notes" class="label-mono">Anotações</h3>
            <p class="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{{ session.notes }}</p>
            <p class="text-xs text-muted-foreground">Texto registrado antes do prontuário em seções. Continua visível para o(a) paciente e não é editado aqui.</p>
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
              <FormDescription v-if="nearLimit(section.key)" class="font-mono text-xs">{{ nearLimit(section.key) }}</FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>
          <p v-if="!session.concluded" class="text-xs leading-relaxed text-muted-foreground">Todos os campos são opcionais. Salve o rascunho quando quiser e conclua a sessão quando terminar.</p>
          <InlineNotice v-if="conflict" tone="warning">{{ CONFLICT_TEXT }}</InlineNotice>
          <InlineNotice v-if="blocked" tone="warning">Este prontuário foi bloqueado para edição. Seu texto continua aqui: copie o que precisar antes de recarregar.</InlineNotice>
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
      <!-- No celular o descartar vira só ícone, para os três botões caberem numa linha. -->
      <Button
        type="button"
        variant="destructive-soft"
        class="mr-auto px-3 sm:px-4"
        :disabled="!dirty || disabled"
        @click="discardChanges"
      >
        <Undo2 class="sm:hidden" aria-hidden="true" />
        <span class="sr-only sm:not-sr-only">Descartar alterações</span>
      </Button>
      <Button v-if="conflict || blocked" type="button" variant="outline" @click="reloadRecord">Recarregar prontuário</Button>
      <template v-if="session.concluded">
        <Button type="submit" :loading="isSubmitting" :disabled="conflict || blocked || disabled">
          {{ isSubmitting ? 'Salvando…' : 'Salvar alterações' }}
        </Button>
      </template>
      <template v-else>
        <Button type="submit" variant="outline" :loading="isSubmitting" :disabled="conflict || blocked || disabled">
          {{ isSubmitting ? 'Salvando…' : 'Salvar rascunho' }}
        </Button>
        <Button type="button" :disabled="conflict || blocked || disabled" @click="askConclude">Concluir sessão</Button>
      </template>
    </div>
  </form>
  <UnsavedChangesDialog :open="confirmOpen" @decision="decide" />
  <ConcludeSessionDialog
    :open="concludeOpen"
    :title="conclusionTitle"
    :next-version="nextVersion"
    :concluded-version="concludedVersion"
    :patient-id="session.patientId"
    :pending="concluding"
    @confirm="confirmConclude"
    @close="concludeOpen = false"
  />
</template>
