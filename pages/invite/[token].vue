<script setup lang="ts">
import { CheckCircle2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PatientInvitation } from '~/types'

type InvitationDocument = {
  id: string
  title: string
  content: string
  required: boolean
}
type InvitationPage = PatientInvitation & { documents: InvitationDocument[] }

definePageMeta({ layout: 'auth' })

const route = useRoute()
const token = computed(() => route.params.token as string)
const { data: invitation, status, error } = await useFetch<InvitationPage>(
  () => `/api/invites/${encodeURIComponent(token.value)}`,
  {
    server: false,
    key: 'invitation-status',
    getCachedData: () => undefined,
  },
)
const password = ref('')
const confirmation = ref('')
const acceptedDocuments = ref<Record<string, boolean>>({})
const accepting = ref(false)
const completed = ref(false)
const acceptError = ref('')
const acceptedDocumentIds = computed(() => Object.entries(acceptedDocuments.value).filter(([, accepted]) => accepted).map(([id]) => id))
const canAccept = computed(() => {
  const requiredAccepted = invitation.value?.documents.every(document => !document.required || acceptedDocuments.value[document.id])
  return Boolean(requiredAccepted) && password.value.length >= 8 && password.value === confirmation.value
})

async function accept() {
  if (!canAccept.value) return
  accepting.value = true
  acceptError.value = ''
  try {
    await $fetch(`/api/onboarding/invitations/${encodeURIComponent(token.value)}/accept`, {
      method: 'POST',
      body: { password: password.value, acceptedDocumentIds: acceptedDocumentIds.value },
    })
    completed.value = true
  } catch {
    acceptError.value = 'Não foi possível concluir. O convite pode ter expirado ou já ter sido utilizado.'
  } finally {
    accepting.value = false
  }
}
</script>

<template>
  <main class="mx-auto flex min-h-dvh w-full max-w-xl items-center px-6 py-10">
    <Card class="w-full">
      <CardContent class="p-6 sm:p-10">
        <div v-if="status === 'pending'" class="flex flex-col gap-4" aria-busy="true">
          <div class="h-5 w-28 animate-pulse rounded bg-muted" /><div class="h-8 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div v-else-if="error || !invitation || invitation.status !== 'pending'" class="py-8 text-center">
          <p class="font-serif text-3xl">Convite indisponível</p>
          <p class="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Este convite está {{ invitation?.status === 'expired' ? 'expirado' : invitation?.status === 'accepted' ? 'aceito' : 'indisponível' }}. Peça ao consultório um novo link.
          </p>
          <Button class="mt-6" variant="outline" as-child><NuxtLink to="/invite">Colar outro convite</NuxtLink></Button>
        </div>
        <div v-else-if="completed" class="py-8 text-center">
          <CheckCircle2 class="mx-auto size-10" /><p class="mt-4 font-serif text-3xl">Conta criada</p>
          <p class="mt-2 text-sm text-muted-foreground">Seu vínculo foi ativado. Entre com o e-mail usado no convite.</p>
          <Button class="mt-6" as-child><NuxtLink to="/login">Entrar</NuxtLink></Button>
        </div>
        <form v-else class="flex flex-col gap-6" @submit.prevent="accept">
           <div><p class="label-mono">Convite</p><h1 class="mt-2 font-serif text-3xl">Crie sua senha de acesso.</h1><p class="mt-2 text-sm text-muted-foreground">Leia as orientações do consultório e confirme para continuar.</p></div>
           <section class="flex flex-col gap-4" aria-labelledby="consent-heading">
             <h2 id="consent-heading" class="font-medium">Documentos e consentimentos</h2>
             <label v-for="document in invitation.documents" :key="document.id" class="flex items-start gap-3 text-sm">
               <input v-model="acceptedDocuments[document.id]" type="checkbox" class="mt-1 rounded border-input">
               <span><span class="font-medium">{{ document.title }}</span><span v-if="document.required" class="text-muted-foreground"> (obrigatório)</span><span class="mt-1 block text-muted-foreground">{{ document.content }}</span></span>
             </label>
           </section>
          <div class="flex flex-col gap-1.5"><Label for="password">Senha</Label><Input id="password" v-model="password" type="password" autocomplete="new-password" /></div>
          <div class="flex flex-col gap-1.5"><Label for="confirmation">Confirme a senha</Label><Input id="confirmation" v-model="confirmation" type="password" autocomplete="new-password" /></div>
          <p v-if="acceptError" class="text-sm text-destructive" role="alert">{{ acceptError }}</p>
          <Button type="submit" :disabled="!canAccept || accepting">{{ accepting ? 'Criando conta…' : 'Aceitar e criar conta' }}</Button>
          <p class="text-center text-xs text-muted-foreground">Válido até {{ formatDateTime(invitation.expiresAt) }}.</p>
        </form>
      </CardContent>
    </Card>
  </main>
</template>
