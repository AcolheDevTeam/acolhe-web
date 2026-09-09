<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({ layout: 'auth' })

const value = ref('')
const error = ref('')

function submit() {
  error.value = ''
  const raw = value.value.trim()
  const token = raw.includes('/invite/') ? raw.split('/invite/').pop()?.split(/[?#]/)[0] : raw
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    error.value = 'Cole um link de convite válido ou o token recebido.'
    return
  }
  return navigateTo(`/invite/${encodeURIComponent(token)}`)
}
</script>

<template>
  <main class="mx-auto flex min-h-dvh w-full max-w-xl items-center px-6 py-10">
    <Card class="w-full">
      <CardContent class="flex flex-col gap-6 p-6 sm:p-10">
        <AppLogo />
        <div>
          <p class="label-mono">Convite</p>
          <h1 class="mt-2 font-serif text-3xl">Entre pelo convite recebido.</h1>
          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
            Cole o link ou somente o token. Não precisamos do seu e-mail para localizar o convite.
          </p>
        </div>
        <form class="flex flex-col gap-3" @submit.prevent="submit">
          <Label for="invitation">Link ou token</Label>
          <Input id="invitation" v-model="value" autocomplete="off" spellcheck="false" placeholder="https://.../invite/..." />
          <p v-if="error" class="text-sm text-destructive" role="alert">{{ error }}</p>
          <Button type="submit">Continuar <ArrowRight /></Button>
        </form>
        <NuxtLink to="/login" class="text-center text-sm text-muted-foreground underline underline-offset-4">Voltar ao login</NuxtLink>
      </CardContent>
    </Card>
  </main>
</template>
