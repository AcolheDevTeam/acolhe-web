<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { InvitationPreview } from '~/schemas/workspace-invitation'

// Convite para a equipe de uma clínica (ACO-62). Página pública: o token do
// link é a credencial. O design v0.3 não tem esta tela; segue o padrão do
// cadastro e da confirmação de e-mail.
definePageMeta({ layout: 'auth' })
const route = useRoute()
const token = computed(() => String(route.params.token))
const { data: preview, error, status, refresh } = await useFetch<InvitationPreview>(() => `/api/workspace-invitations/${token.value}`, {
  key: () => `workspace-invitation-${token.value}`,
})
const roles = computed(() => (preview.value?.roles ?? []).map(role => workspaceRoleLabel(role as never)).join(', '))
const validity = computed(() => preview.value ? formatDateTime(preview.value.expiresAt) : '')
</script>

<template>
  <main class="flex min-h-dvh items-center justify-center p-6">
    <Card class="w-full max-w-md">
      <CardHeader class="gap-5">
        <div class="flex items-center justify-between gap-4">
          <AppLogo />
          <NuxtLink to="/login" class="text-sm text-muted-foreground underline underline-offset-4">Entrar</NuxtLink>
        </div>
        <div>
          <p class="label-mono">Convite</p>
          <template v-if="preview">
            <CardTitle class="display-serif mt-2 text-3xl">{{ preview.organizationName }}</CardTitle>
            <CardDescription class="mt-2">
              Você foi convidada para atuar como <span class="font-medium text-foreground">{{ roles }}</span>
              com o e-mail <span class="font-medium text-foreground">{{ preview.email }}</span>.
              O convite vale até {{ validity }}.
            </CardDescription>
          </template>
          <CardTitle v-else class="display-serif mt-2 text-3xl">Convite da equipe</CardTitle>
        </div>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <p v-if="status === 'pending'" class="text-sm text-muted-foreground" role="status">Carregando o convite…</p>
        <div v-else-if="error" class="flex flex-col gap-3" role="alert">
          <p class="text-sm text-destructive">{{ invitationErrorMessage(error) }}</p>
          <Button v-if="!error.statusCode || error.statusCode >= 500" variant="outline" class="self-start" @click="refresh()">Tentar novamente</Button>
        </div>
        <template v-else-if="preview">
          <p class="text-sm text-muted-foreground">
            {{ preview.accountExists ? 'Este e-mail já tem conta no Acolhe. Confirme com a sua senha.' : 'Crie sua conta para aceitar.' }}
          </p>
          <InvitationAcceptForm :token="token" :preview="preview" />
        </template>
      </CardContent>
    </Card>
  </main>
</template>
