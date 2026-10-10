<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { PASSWORD_MAX_BYTES, PASSWORD_MIN, passwordBytes, passwordTooLongMessage } from '~/schemas/password'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

// Troca de senha logada (ACO-98), usada em Ajustes › Segurança da psicóloga e
// nos Ajustes da paciente (ACO-102). A regra é a da API (igual à do cadastro).
// `stacked` empilha os campos (tela de celular da paciente).
const props = defineProps<{ stacked?: boolean }>()
const emit = defineEmits<{ changed: [] }>()

const current = ref('')
const next = ref('')
const confirm = ref('')
const changing = ref(false)
const done = ref(false)
const error = ref('')

const tooLong = computed(() => passwordBytes(next.value) > PASSWORD_MAX_BYTES)
const requirements = computed(() => [
  { label: `Pelo menos ${PASSWORD_MIN} caracteres`, ok: next.value.length >= PASSWORD_MIN },
  { label: 'As duas senhas iguais', ok: next.value.length > 0 && next.value === confirm.value },
])
const canChange = computed(() => current.value.length > 0 && !tooLong.value && requirements.value.every(r => r.ok))

watch([current, next, confirm], () => {
  done.value = false
  error.value = ''
})

async function changePassword() {
  if (!canChange.value || changing.value) return
  changing.value = true
  error.value = ''
  try {
    await $fetch('/api/me/password', { method: 'POST', body: { currentPassword: current.value, newPassword: next.value } })
    current.value = ''
    next.value = ''
    confirm.value = ''
    await nextTick()
    done.value = true
    emit('changed')
  } catch (err) {
    error.value = apiErrorMessage(err, {
      400: 'A nova senha precisa ter pelo menos 8 caracteres e no máximo 72 sem acento.',
      409: 'A nova senha precisa ser diferente da atual.',
      422: 'A senha atual não confere. Confira e tente de novo.',
      429: 'Muitas tentativas com a senha atual. Aguarde 15 minutos e tente de novo.',
      default: 'Não foi possível trocar a senha agora. Tente novamente em instantes.',
    })
  } finally {
    changing.value = false
  }
}
</script>

<template>
  <form class="flex flex-col gap-5" novalidate @submit.prevent="changePassword">
    <div :class="['flex flex-col gap-2', !props.stacked && 'sm:max-w-[calc(50%-8px)]']">
      <Label for="current-password">Senha atual</Label>
      <PasswordInput id="current-password" v-model="current" autocomplete="current-password" :disabled="changing" />
    </div>
    <div :class="['grid gap-4', !props.stacked && 'sm:grid-cols-2']">
      <div class="flex flex-col gap-2">
        <Label for="new-password">Nova senha</Label>
        <PasswordInput id="new-password" v-model="next" autocomplete="new-password" aria-describedby="password-requirements" :disabled="changing" />
      </div>
      <div class="flex flex-col gap-2">
        <Label for="confirm-password">Confirmar nova senha</Label>
        <PasswordInput id="confirm-password" v-model="confirm" autocomplete="new-password" :disabled="changing" />
      </div>
    </div>
    <ul id="password-requirements" class="flex flex-wrap gap-x-5 gap-y-2.5">
      <li v-for="item in requirements" :key="item.label" class="flex items-center gap-2.5 text-sm" :class="item.ok ? 'text-positive' : 'text-muted-foreground'">
        <span aria-hidden="true" class="flex size-5 items-center justify-center rounded-full transition-colors" :class="item.ok ? 'bg-primary text-primary-foreground' : 'border-[1.5px] border-input-hover'">
          <Check v-if="item.ok" class="size-3" :stroke-width="3" />
        </span>
        <span>{{ item.label }}</span>
        <span class="sr-only">{{ item.ok ? '(atendido)' : '(pendente)' }}</span>
      </li>
    </ul>
    <p v-if="tooLong" class="text-sm text-destructive">{{ passwordTooLongMessage }}</p>
    <p v-if="error" class="text-sm text-destructive" role="alert">{{ error }}</p>
    <div class="flex flex-wrap items-center gap-4" aria-live="polite">
      <Button type="submit" size="lg" :class="props.stacked && 'w-full'" :disabled="!canChange" :loading="changing">{{ changing ? 'Atualizando…' : 'Atualizar senha' }}</Button>
      <span v-if="done" class="animate-fade text-sm font-medium text-positive">Senha atualizada. As outras sessões foram encerradas.</span>
    </div>
  </form>
</template>
