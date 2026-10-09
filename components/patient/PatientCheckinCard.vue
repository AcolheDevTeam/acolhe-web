<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { useNow } from '@vueuse/core'
import type { PatientCheckin } from '~/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

// Check-in do dia: registra ou edita o de hoje (um por dia, até o fim do dia
// no horário de Brasília). Emite `saved` para a página atualizar os dados.
const props = defineProps<{ checkins: PatientCheckin[] }>()
const emit = defineEmits<{ saved: [], conflict: [] }>()

const now = useNow({ interval: 60000 })
const mood = ref(0)
const note = ref('')
const submitting = ref(false)
const errorMessage = ref('')
const editing = ref(false)
const today = computed(() => props.checkins.find(item => item.day === checkinDay(now.value)))

watch(() => today.value?.id, (id, previousId) => {
  editing.value = false
  if (previousId && !id) {
    mood.value = 0
    note.value = ''
    errorMessage.value = 'Um novo dia começou. O registro anterior está no histórico.'
  }
})

function edit() {
  if (!today.value) return
  mood.value = today.value.mood
  note.value = today.value.note ?? ''
  errorMessage.value = ''
  editing.value = true
}

async function submit() {
  if (!mood.value) return
  submitting.value = true
  errorMessage.value = ''
  try {
    const current = today.value
    await $fetch(current ? `/api/patient/check-ins/${current.id}` : '/api/patient/check-ins', {
      method: current ? 'PUT' : 'POST', body: { mood: mood.value, note: note.value },
    })
    editing.value = false
    mood.value = 0
    note.value = ''
    emit('saved')
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, {
      400: 'Escolha uma nota de 1 a 5 e, se quiser, uma observação curta.',
      403: 'Seu vínculo com a psicóloga não está ativo no momento, então não é possível registrar check-ins.',
      404: 'Este check-in não está mais disponível. Atualize a página.',
      409: editing.value
        ? 'O dia virou e este check-in não pode mais ser editado. Ele continua no seu histórico.'
        : 'Você já registrou o check-in de hoje. Atualize a página para editá-lo.',
      default: 'Não foi possível salvar o check-in agora. Tente novamente.',
    })
    emit('conflict')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="flex flex-col gap-4 rounded-2xl border bg-card p-5" aria-labelledby="t-checkin">
    <div class="flex flex-col gap-1">
      <h2 id="t-checkin" class="text-lg font-semibold tracking-[-0.01em]">Como você está?</h2>
      <p class="text-sm text-muted-foreground">Um registro rápido para você observar seu próprio ritmo.</p>
    </div>
    <template v-if="today && !editing">
      <InlineNotice><span class="flex items-center gap-2"><Check class="size-4" />Check-in de hoje registrado.</span></InlineNotice>
      <p class="text-4xl font-semibold tabular-nums">{{ today.mood }}<span class="text-lg font-normal text-muted-foreground"> / 5</span></p>
      <p v-if="today.note" class="whitespace-pre-wrap break-words text-sm">{{ today.note }}</p>
      <p v-else class="text-sm text-muted-foreground">Sem observação.</p>
      <Button variant="outline" class="self-start" @click="edit">Editar check-in de hoje</Button>
    </template>
    <template v-else>
      <p class="text-xs text-muted-foreground">Um registro por dia. Você pode editar até o fim do dia, no horário de Brasília.</p>
      <div class="flex gap-2" role="radiogroup" aria-label="Humor de hoje">
        <Button v-for="value in 5" :key="value" type="button" :variant="mood === value ? 'default' : 'outline'" class="size-11 rounded-full p-0" :aria-checked="mood === value" role="radio" :disabled="submitting" @click="mood = value">{{ value }}</Button>
      </div>
      <Textarea v-model="note" rows="3" :disabled="submitting" maxlength="1000" placeholder="Quer deixar uma nota? (opcional)" aria-label="Nota do check-in" />
      <div class="flex flex-wrap gap-2">
        <Button :disabled="!mood" :loading="submitting" @click="submit"><Check v-if="!submitting" class="size-4" />{{ submitting ? 'Salvando…' : editing ? 'Salvar alterações' : 'Salvar check-in' }}</Button>
        <Button v-if="editing" variant="ghost" :disabled="submitting" @click="editing = false">Cancelar edição</Button>
      </div>
    </template>
    <p v-if="errorMessage" class="text-sm text-destructive" role="alert">{{ errorMessage }}</p>
  </section>
</template>
