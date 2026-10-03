<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { toast } from 'vue-sonner'
import type { Session } from '~/types'
import { updateSessionNotesSchema } from '~/schemas/session'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const props = defineProps<{ session: Session }>()
const emit = defineEmits<{ saved: [session: Session], reload: [] }>()
const dirty = ref(false)
const conflict = ref(false)
const { handleSubmit, isSubmitting, resetForm } = useForm({ validationSchema: toTypedSchema(updateSessionNotesSchema) })
watch(() => [props.session.id, props.session.version], () => {
  resetForm({ values: { notes: props.session.notes ?? '', version: props.session.version ?? 1 } })
  conflict.value = false
  dirty.value = false
}, { immediate: true })
const onSubmit = handleSubmit(async (values) => {
  try {
    const saved = await $fetch<Session>(`/api/sessions/${props.session.id}/notes`, { method: 'PUT', body: values })
    resetForm({ values: { notes: saved.notes ?? '', version: saved.version ?? 1 } })
    conflict.value = false
    dirty.value = false
    emit('saved', saved)
    toast.success('Evolução salva.')
  } catch (error) {
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
</script>

<template>
  <form class="flex flex-col gap-3" @submit="onSubmit">
    <FormField v-slot="{ componentField }" name="notes">
      <FormItem>
        <FormLabel>Evolução da sessão (opcional)</FormLabel>
        <FormControl><Textarea rows="10" placeholder="Registro clínico…" @update:model-value="dirty = true" :disabled="session.locked || isSubmitting" v-bind="componentField" /></FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <p v-if="dirty" class="text-xs text-muted-foreground">Alterações ainda não salvas.</p>
    <p class="text-xs text-muted-foreground">{{ session.locked ? 'Este prontuário está bloqueado para edição.' : 'Você pode salvar sem texto e preencher depois. O status do atendimento é definido no agendamento.' }}</p>
    <div class="flex flex-wrap gap-2">
      <Button type="submit" :disabled="isSubmitting || session.locked || conflict">{{ isSubmitting ? 'Salvando…' : 'Salvar evolução' }}</Button>
      <Button v-if="conflict" type="button" variant="outline" @click="emit('reload')">Recarregar evolução</Button>
    </div>
  </form>
</template>
