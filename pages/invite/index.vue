<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { invitationTokenSchema } from '~/schemas/onboarding'

// Entrada para quem recebeu o convite mas chegou sem o token na URL (CTA do login).
// Aceita o link completo ou só o token; nunca consulta e-mail, para não enumerar pacientes.
definePageMeta({ layout: 'auth' })

const value = ref('')
const error = ref('')

function extractToken(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed.includes('/invite/')) return trimmed
  return trimmed.split('/invite/').pop()?.split(/[?#]/)[0] ?? ''
}

function submit() {
  error.value = ''
  const parsed = invitationTokenSchema.safeParse({ token: extractToken(value.value) })
  if (!parsed.success) {
    error.value = 'Cole o link completo do convite ou o código que você recebeu.'
    return
  }
  return navigateTo(`/invite/${encodeURIComponent(parsed.data.token)}`)
}
</script>

<template>
  <main class="mx-auto flex min-h-dvh w-full max-w-xl items-center px-6 py-10">
    <Card class="w-full">
      <CardContent class="flex flex-col gap-7 p-6 sm:p-10">
        <AppLogo />
        <div>
          <p class="label-mono">Convite</p>
          <h1 class="mt-2 font-serif text-3xl">Entre pelo convite que você recebeu.</h1>
          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
            Cole o link que a sua psicóloga enviou, ou só o código que aparece no final dele.
            Não pedimos o seu e-mail nesta etapa.
          </p>
        </div>
        <form class="flex flex-col gap-3" @submit.prevent="submit">
          <Label for="invitation">Link ou código do convite</Label>
          <Input
            id="invitation"
            v-model="value"
            autocomplete="off"
            spellcheck="false"
            placeholder="https://…/invite/…"
            :aria-invalid="!!error"
          />
          <p v-if="error" class="text-sm text-destructive" role="alert">{{ error }}</p>
          <Button type="submit" class="mt-1">
            Continuar
            <ArrowRight class="size-4" />
          </Button>
        </form>
        <NuxtLink to="/login" class="text-center text-sm text-muted-foreground underline underline-offset-4">
          Voltar ao login
        </NuxtLink>
      </CardContent>
    </Card>
  </main>
</template>
