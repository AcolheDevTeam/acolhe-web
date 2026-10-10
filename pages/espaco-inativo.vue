<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Vínculo do workspace atual suspenso/encerrado, ou organização inativa (ADR 0002
// da API). A API recusa os dados; aqui a pessoa entende o que houve e troca de
// workspace ou sai.
definePageMeta({ layout: 'auth', middleware: ['auth'] })

const { workspaces, switching, switchTo } = useWorkspaces()
const available = computed(() => workspaces.value.filter(w => !w.current && w.membershipStatus === 'active' && w.organizationStatus === 'active'))
const current = computed(() => workspaces.value.find(w => w.current))
const reason = computed(() => {
  if (!current.value) return 'O vínculo com este espaço de trabalho não está mais ativo.'
  if (current.value.organizationStatus !== 'active') return `${current.value.name} não está ativo no momento.`
  if (current.value.membershipStatus === 'suspended') return `Seu acesso a ${current.value.name} foi suspenso pela administração da clínica.`
  return `Seu vínculo com ${current.value.name} foi encerrado.`
})
const { logout, isLoggingOut } = useLogout()

async function choose(organizationId: string) {
  try {
    await switchTo(organizationId)
  }
  catch (error) {
    toast.error(apiErrorMessage(error, { 403: 'Este espaço de trabalho não está disponível para você.', default: 'Não foi possível trocar de espaço agora.' }))
  }
}
</script>

<template>
  <main class="flex min-h-dvh items-center justify-center p-6">
    <Card class="w-full max-w-md">
      <CardHeader class="gap-5">
        <AppLogo />
        <div>
          <p class="label-mono">Acesso</p>
          <CardTitle class="display-serif mt-2 text-3xl">Acesso indisponível</CardTitle>
          <CardDescription class="mt-2">{{ reason }} Os dados continuam guardados; só o acesso foi interrompido.</CardDescription>
        </div>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <DocumentaryDepartures :framed="false" />
        <template v-if="available.length">
          <p class="text-sm text-muted-foreground">Você pode continuar em outro espaço de trabalho:</p>
          <Button
            v-for="workspace in available"
            :key="workspace.organizationId"
            variant="outline"
            class="h-auto justify-between gap-3 py-3"
            :disabled="switching !== null"
            @click="choose(workspace.organizationId)"
          >
            <span class="truncate">{{ workspace.name }}</span>
            <span class="text-xs text-muted-foreground">{{ workspaceTypeLabel(workspace.type) }}</span>
          </Button>
        </template>
        <p v-else class="text-sm text-muted-foreground">Se acha que é um engano, fale com a administração da clínica.</p>
        <Button variant="ghost" class="self-start" :disabled="isLoggingOut" @click="logout">{{ isLoggingOut ? 'Saindo…' : 'Sair' }}</Button>
      </CardContent>
    </Card>
  </main>
</template>
