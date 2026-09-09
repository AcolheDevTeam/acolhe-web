<script setup lang="ts">
import { CheckCircle2, ShieldCheck } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { z } from 'zod'
import { invitationSchema } from '~/schemas/onboarding'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({ layout: 'auth' })

type Invitation = z.infer<typeof invitationSchema>

const route = useRoute()
const token = computed(() => route.params.token as string)
const { data: invitation, status, error } = await useFetch<Invitation>(
  () => `/api/onboarding/invitations/${encodeURIComponent(token.value)}`,
  { key: () => `invitation-${token.value}` },
)

const selected = ref<string[]>([])
const password = ref('')
const passwordConfirmation = ref('')
const accepting = ref(false)
const declining = ref(false)
const completed = ref<'accepted' | 'declined'>()

watch(invitation, (value) => {
  if (!value) return
  selected.value = value.documents
    .filter(document => document.required)
    .map(document => document.id)
}, { immediate: true })

const canAccept = computed(() => {
  const required = invitation.value?.documents.filter(document => document.required) ?? []
  return required.every(document => selected.value.includes(document.id))
    && password.value.length >= 8
    && password.value === passwordConfirmation.value
})

function toggleDocument(id: string, checked: boolean) {
  selected.value = checked
    ? [...new Set([...selected.value, id])]
    : selected.value.filter(documentId => documentId !== id)
}

async function accept() {
  if (!canAccept.value) return
  accepting.value = true
  try {
    await $fetch(`/api/onboarding/invitations/${encodeURIComponent(token.value)}/accept`, {
      method: 'POST',
      body: { password: password.value, acceptedDocumentIds: selected.value },
    })
    completed.value = 'accepted'
  } catch (error) {
    toast.error(apiErrorMessage(error, {
      400: 'Confira a senha e os consentimentos marcados.',
      404: 'Este convite não foi encontrado. Peça um novo link à sua psicóloga.',
      410: 'Este convite expirou ou foi cancelado. Peça um novo link à sua psicóloga.',
      409: 'Este convite já foi utilizado ou já existe uma conta com este e-mail. Tente entrar pela tela de login.',
      default: 'Não foi possível concluir o aceite agora. Tente novamente em instantes.',
    }))
  } finally {
    accepting.value = false
  }
}

async function decline() {
  declining.value = true
  try {
    await $fetch(`/api/onboarding/invitations/${encodeURIComponent(token.value)}/decline`, {
      method: 'POST',
    })
    completed.value = 'declined'
  } catch (error) {
    toast.error(apiErrorMessage(error, {
      404: 'Este convite não foi encontrado.',
      410: 'Este convite já não estava mais disponível.',
      default: 'Não foi possível registrar a recusa agora.',
    }))
  } finally {
    declining.value = false
  }
}
</script>

<template>
  <main class="mx-auto flex min-h-dvh w-full max-w-2xl items-center px-6 py-10">
    <Card class="w-full">
      <CardContent class="p-6 sm:p-10">
        <div v-if="status === 'pending'" class="flex flex-col gap-4">
          <div class="h-5 w-28 animate-pulse rounded bg-muted" />
          <div class="h-8 w-64 animate-pulse rounded bg-muted" />
          <div class="h-32 animate-pulse rounded bg-muted" />
        </div>

        <div v-else-if="error" class="py-10 text-center">
          <p class="font-serif text-3xl">Convite indisponível</p>
          <p class="mt-2 text-sm text-muted-foreground">
            O link pode ter expirado, sido recusado ou já ter sido utilizado.
          </p>
        </div>

        <div v-else-if="completed" class="py-10 text-center">
          <CheckCircle2 class="mx-auto size-10 text-foreground" />
          <p class="mt-4 font-serif text-3xl">
            {{ completed === 'accepted' ? 'Conta criada' : 'Recusa registrada' }}
          </p>
          <p class="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {{ completed === 'accepted'
              ? 'Seu vínculo foi ativado. Você já pode entrar no Acolhe com o e-mail do convite.'
              : 'O vínculo foi encerrado e nenhum fluxo clínico foi liberado.' }}
          </p>
          <Button v-if="completed === 'accepted'" class="mt-6" as-child>
            <NuxtLink to="/login">Entrar</NuxtLink>
          </Button>
        </div>

        <div v-else-if="invitation" class="flex flex-col gap-7">
          <header class="flex flex-col gap-4">
            <AppLogo />
            <div>
              <p class="label-mono">Você foi convidada por</p>
              <p class="mt-1 font-medium">{{ invitation.psychologistName }}</p>
              <p class="text-xs text-muted-foreground">Psicóloga · CRP {{ invitation.psychologistCrp }}</p>
            </div>
            <div>
              <h1 class="font-serif text-3xl">Olá, {{ invitation.patientName.split(' ')[0] }}.</h1>
              <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
                Antes de criar sua conta, leia com calma como seus dados serão tratados.
                Você pode revogar o consentimento a qualquer momento.
              </p>
            </div>
          </header>

          <section class="rounded-xl border bg-muted/30 p-5">
            <div class="mb-4 flex items-center gap-2">
              <ShieldCheck class="size-4" />
              <p class="label-mono">Consentimento · LGPD Art. 11</p>
            </div>
            <div class="flex flex-col gap-4">
              <div
                v-for="document in invitation.documents"
                :key="document.id"
                class="flex items-start gap-3"
              >
                <Checkbox
                  :id="`consent-${document.id}`"
                  class="mt-1"
                  :model-value="selected.includes(document.id)"
                  :aria-describedby="`consent-${document.id}-description`"
                  @update:model-value="(checked) => toggleDocument(document.id, checked === true)"
                />
                <label :for="`consent-${document.id}`" class="cursor-pointer">
                  <span class="text-sm font-medium">
                    {{ document.title }}
                    <span v-if="document.required" class="text-xs text-muted-foreground">· obrigatório</span>
                  </span>
                  <span
                    :id="`consent-${document.id}-description`"
                    class="mt-0.5 block text-sm leading-relaxed text-muted-foreground"
                  >
                    {{ document.content }}
                  </span>
                </label>
              </div>
            </div>
          </section>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="flex flex-col gap-1.5">
              <Label for="password">Crie uma senha</Label>
              <Input id="password" v-model="password" type="password" autocomplete="new-password" />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label for="password-confirmation">Confirme a senha</Label>
              <Input
                id="password-confirmation"
                v-model="passwordConfirmation"
                type="password"
                autocomplete="new-password"
              />
            </div>
          </div>

          <p class="text-xs leading-relaxed text-muted-foreground">
            Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade
            (versão 0.3, 12·05·2026). Seu consentimento fica registrado com data, IP e
            versão exata do documento.
          </p>

          <div class="flex flex-col gap-2">
            <Button :disabled="!canAccept || accepting || declining" @click="accept">
              {{ accepting ? 'Criando conta…' : 'Aceitar e criar minha conta' }}
            </Button>
            <Button
              variant="ghost"
              :disabled="accepting || declining"
              @click="decline"
            >
              {{ declining ? 'Registrando…' : 'Recusar e encerrar' }}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </main>
</template>
