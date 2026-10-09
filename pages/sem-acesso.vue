<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Vínculo ativo, mas sem área no Acolhe: nem atende nem administra uma clínica
// (ex.: org_admin antiga de consultório). Explica e oferece os outros espaços.
definePageMeta({ layout: 'auth', middleware: ['auth'] })

const { workspaces, switching, switchTo } = useWorkspaces()
const available = computed(() => workspaces.value.filter(w => !w.current && w.membershipStatus === 'active' && w.organizationStatus === 'active'))
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
          <CardTitle class="display-serif mt-2 text-3xl">Nada para mostrar aqui</CardTitle>
          <CardDescription class="mt-2">O seu papel neste espaço de trabalho não inclui atender nem administrar a clínica. Se precisar de acesso, fale com a responsável pela clínica.</CardDescription>
        </div>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <template v-if="available.length">
          <p class="text-sm text-muted-foreground">Você pode continuar em outro espaço de trabalho:</p>
          <Button v-for="workspace in available" :key="workspace.organizationId" variant="outline" class="h-auto justify-between gap-3 py-3" :disabled="switching !== null" @click="choose(workspace.organizationId)">
            <span class="truncate">{{ workspace.name }}</span>
            <span class="text-xs text-muted-foreground">{{ workspaceTypeLabel(workspace.type) }}</span>
          </Button>
        </template>
        <Button variant="ghost" class="self-start" :disabled="isLoggingOut" @click="logout">{{ isLoggingOut ? 'Saindo…' : 'Sair' }}</Button>
      </CardContent>
    </Card>
  </main>
</template>
