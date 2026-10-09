<script setup lang="ts">
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { User } from '~/types'

definePageMeta({ layout: 'auth' })

const schema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(8, 'Mínimo de 8 caracteres.'),
})

const { handleSubmit, errors, defineField, isSubmitting } = useForm({
  validationSchema: toTypedSchema(schema),
})

const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')
const loginError = ref('')
// Só muda os textos: psicóloga e paciente entram pelo mesmo endpoint.
const audience = ref<'psychologist' | 'patient'>('psychologist')
const audienceOptions = [
  { value: 'psychologist' as const, label: 'Sou psicóloga(o)' },
  { value: 'patient' as const, label: 'Sou paciente' },
]

const onSubmit = handleSubmit(async (values) => {
  loginError.value = ''
  try {
    const user = await $fetch<User>('/api/login', { method: 'POST', body: values })
    clearNuxtData()
    // E-mail pendente trava o painel: o próximo passo é confirmar (ACO-63).
    if (user.nextStep === 'verify_email') return await navigateTo('/verify-email')
    await navigateTo(homeFor(user))
  } catch (error) {
    // Só 401 significa credencial errada; qualquer outra falha recebe a causa real.
    loginError.value = apiErrorMessage(error, {
      401: 'E-mail ou senha inválidos.',
      403: 'Seu acesso não está ativo em nenhum espaço de trabalho. Fale com a clínica ou com o suporte do Acolhe.',
      default: 'Não foi possível entrar agora. Tente novamente em instantes.',
    })
  }
})
</script>

<template>
  <main class="flex min-h-dvh flex-wrap bg-background">
    <!-- Painel da marca -->
    <section class="relative flex min-h-[420px] flex-[1_1_520px] flex-col justify-between gap-6 overflow-hidden bg-secondary px-6 py-8 md:min-h-dvh md:px-14 md:py-12">
      <AppLogo class="animate-rise" animated :size="34" />
      <div class="flex min-h-0 flex-1 items-center justify-center">
        <img
          src="/images/login-ilustracao.jpg"
          alt="Ilustração de uma sessão de psicologia: paciente e psicóloga conversando em frente a uma ficha clínica"
          class="login-illus h-auto w-full max-w-[520px] mix-blend-multiply"
        >
      </div>
      <div class="animate-rise flex flex-col gap-4 [animation-delay:.15s]">
        <div aria-live="polite" class="min-h-[86px]">
          <h2 :key="audience" class="animate-fade max-w-[480px] text-[28px] font-semibold leading-[1.12] tracking-[-0.03em] text-brand md:text-[38px]">
            {{ audience === 'psychologist'
              ? 'Agenda, prontuário e atividades dos seus pacientes em um só lugar.'
              : 'Suas sessões, atividades e check-ins em um só lugar.' }}
          </h2>
        </div>
        <p class="font-mono text-xs tracking-[.06em] text-muted-foreground">CFP 01/2009 · LGPD · Lei 13.787/2018</p>
      </div>
    </section>

    <!-- Formulário -->
    <section class="flex flex-[1_1_480px] items-center justify-center px-6 py-14">
      <div class="flex w-full max-w-[400px] flex-col gap-7">
        <header class="animate-rise flex flex-col gap-2.5 [animation-delay:.1s]">
          <p class="label-mono text-xs">Acolhe</p>
          <h1 class="text-[34px] font-semibold leading-[1.15] tracking-[-0.025em]">Entrar na sua conta</h1>
        </header>

        <SegmentedControl v-model="audience" :options="audienceOptions" label="Tipo de acesso" size="lg" class="animate-rise [animation-delay:.18s]" />

        <form class="animate-rise flex flex-col gap-[18px] [animation-delay:.26s]" @submit="onSubmit">
          <InlineNotice v-if="audience === 'patient'" tone="positive">Use o e-mail em que você recebeu o convite.</InlineNotice>

          <div class="flex flex-col gap-2">
            <Label for="email">E-mail</Label>
            <Input
              id="email"
              v-model="email"
              v-bind="emailAttrs"
              type="email"
              class="h-12"
              placeholder="voce@exemplo.com"
              :aria-invalid="!!errors.email"
              autocomplete="email"
            />
            <p v-if="errors.email" class="text-xs text-destructive">{{ errors.email }}</p>
          </div>

          <div class="flex flex-col gap-2">
            <!-- "Esqueci a senha" volta quando a recuperação de senha existir na API. -->
            <Label for="password">Senha</Label>
            <PasswordInput
              id="password"
              v-model="password"
              v-bind="passwordAttrs"
              placeholder="Sua senha"
              :aria-invalid="!!errors.password"
              autocomplete="current-password"
            />
            <p v-if="errors.password" class="text-xs text-destructive">{{ errors.password }}</p>
          </div>

          <p v-if="loginError" class="text-sm text-destructive" role="alert">{{ loginError }}</p>

          <Button type="submit" size="xl" class="w-full rounded-xl text-[15px]" :loading="isSubmitting">
            {{ isSubmitting ? 'Entrando…' : 'Entrar' }}
          </Button>
        </form>

        <footer class="animate-rise border-t pt-5 text-sm leading-relaxed text-secondary-foreground [animation-delay:.34s]">
          <p v-if="audience === 'psychologist'" :key="audience" class="animate-fade">
            Ainda não usa o Acolhe?
            <NuxtLink to="/signup" class="font-medium text-primary underline-offset-[3px] hover:underline">Criar conta</NuxtLink>
          </p>
          <p v-else :key="audience" class="animate-fade">
            Ainda não tem senha? Ela é criada pelo
            <NuxtLink to="/invite" class="font-medium text-primary underline-offset-[3px] hover:underline">link do convite</NuxtLink>
            que você recebeu por e-mail.
          </p>
        </footer>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-illus {
  animation: illus-in 1.2s var(--ease-out) .3s backwards, illus-float 7s ease-in-out 1.6s infinite;
}
@keyframes illus-in {
  from { opacity: 0; transform: translateY(24px) scale(.97); }
  to { opacity: 1; transform: none; }
}
@keyframes illus-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
</style>
