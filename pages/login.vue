<script setup lang="ts">
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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

const onSubmit = handleSubmit(async (values) => {
  loginError.value = ''
  try {
    const user = await $fetch<User>('/api/login', { method: 'POST', body: values })
    await navigateTo(user.role === 'patient' ? '/patient' : '/dashboard')
  } catch (error) {
    // Só 401 significa credencial errada; qualquer outra falha recebe a causa real.
    loginError.value = apiErrorMessage(error, {
      401: 'E-mail ou senha inválidos.',
      default: 'Não foi possível entrar agora. Tente novamente em instantes.',
    })
  }
})
</script>

<template>
  <main class="flex min-h-dvh items-center justify-center p-6">
    <div class="grid w-full max-w-5xl overflow-hidden rounded-xl border bg-card shadow-sm md:grid-cols-2">
      <!-- Coluna editorial -->
      <section class="flex flex-col justify-between gap-16 bg-muted/40 p-10">
        <AppLogo />
        <div class="flex flex-col gap-6">
          <p class="label-mono">Para psicólogos</p>
          <h1 class="display-serif text-4xl leading-[1.1]">
            Um espaço silencioso para a clínica continuar entre as sessões.
          </h1>
          <p class="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Agenda, prontuário, atividades terapêuticas e acompanhamento estruturado —
            sem IA, sem ruído, em conformidade com a LGPD e com a Resolução CFP 01/2009.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-4 font-mono text-[0.625rem] uppercase tracking-wider text-muted-foreground">
          <span>LGPD</span>
          <span>CFP 01/2009</span>
          <span>Lei 13.787/2018</span>
          <span class="ml-auto">v0.3 · beta privado</span>
        </div>
      </section>

      <!-- Coluna do formulário -->
      <section class="flex flex-col justify-center gap-6 p-10">
        <div class="flex flex-col gap-2">
          <p class="label-mono">Entrar</p>
          <h2 class="display-serif text-3xl">Bem-vinda de volta.</h2>
        </div>

        <form class="flex flex-col gap-4" @submit="onSubmit">
          <div class="flex flex-col gap-1.5">
            <Label for="email">E-mail</Label>
            <Input
              id="email"
              v-model="email"
              v-bind="emailAttrs"
              type="email"
              placeholder="voce@consultorio.com"
              :aria-invalid="!!errors.email"
              autocomplete="email"
            />
            <p v-if="errors.email" class="text-xs text-destructive">{{ errors.email }}</p>
          </div>

          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <Label for="password">Senha</Label>
              <NuxtLink to="/forgot" class="text-xs text-muted-foreground underline-offset-4 hover:underline">
                Esqueci
              </NuxtLink>
            </div>
            <Input
              id="password"
              v-model="password"
              v-bind="passwordAttrs"
              type="password"
              :aria-invalid="!!errors.password"
              autocomplete="current-password"
            />
            <p v-if="errors.password" class="text-xs text-destructive">{{ errors.password }}</p>
          </div>

          <p v-if="loginError" class="text-sm text-destructive">{{ loginError }}</p>

          <Button type="submit" class="w-full" :disabled="isSubmitting">
            Entrar com 2FA
          </Button>
        </form>

        <div class="flex items-center gap-3">
          <Separator class="flex-1" />
          <span class="label-mono">ou</span>
          <Separator class="flex-1" />
        </div>

        <div class="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
          <p>
            É paciente?
            <NuxtLink to="/invite" class="font-medium text-foreground underline underline-offset-4">
              Entrar pelo convite recebido
            </NuxtLink>
          </p>
          <p>
            Ainda não tem conta?
            <NuxtLink to="/signup" class="font-medium text-foreground underline underline-offset-4">
              Cadastrar como psicólogo
            </NuxtLink>
          </p>
        </div>
      </section>
    </div>
  </main>
</template>
