<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { ClinicInvitationResult } from '~/schemas/clinic'
import type { WorkspaceRole } from '~/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Convite para a equipe (ACO-62). Só a responsável convida responsáveis; o
// resultado mostra o link copiável, que vale mesmo quando o e-mail falha.
const props = defineProps<{ canInviteOwner: boolean }>()
const emit = defineEmits<{ invited: [] }>()
const open = ref(false)
const email = ref('')
const roles = ref<WorkspaceRole[]>(['psychologist'])
const submitting = ref(false)
const error = ref('')
const result = ref<ClinicInvitationResult | null>(null)
const options = computed<WorkspaceRole[]>(() => props.canInviteOwner
  ? ['psychologist', 'clinic_admin', 'clinical_supervisor', 'clinic_owner']
  : ['psychologist', 'clinic_admin', 'clinical_supervisor'])

watch(open, (value) => {
  if (!value) return
  email.value = ''
  roles.value = ['psychologist']
  error.value = ''
  result.value = null
})

function toggle(role: WorkspaceRole, checked: boolean) {
  roles.value = checked ? [...new Set([...roles.value, role])] : roles.value.filter(r => r !== role)
}

async function submit() {
  error.value = ''
  if (!email.value.includes('@')) { error.value = 'Informe um e-mail válido.'; return }
  if (!roles.value.length) { error.value = 'Escolha ao menos um papel.'; return }
  submitting.value = true
  try {
    result.value = await $fetch<ClinicInvitationResult>('/api/clinic/invitations', { method: 'POST', body: { email: email.value, roles: roles.value } })
    emit('invited')
  }
  catch (err) {
    error.value = clinicErrorMessage(err, 'Não foi possível enviar o convite agora.')
  }
  finally {
    submitting.value = false
  }
}

async function copyLink() {
  if (!result.value) return
  try {
    await navigator.clipboard.writeText(result.value.link)
    toast.success('Link do convite copiado.')
  }
  catch {
    toast.error('Não foi possível copiar automaticamente. Selecione o link exibido.')
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child><slot /></DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle class="font-serif text-2xl font-normal">Convidar para a equipe</DialogTitle>
        <DialogDescription>A pessoa recebe um link de uso único, válido por 7 dias, para entrar com a conta do Acolhe ou criar uma.</DialogDescription>
      </DialogHeader>
      <div v-if="result" class="flex flex-col gap-3">
        <p class="text-sm">{{ deliveryMessage(result.deliveryStatus) }}</p>
        <p class="break-all rounded-md border bg-muted/40 p-3 font-mono text-xs">{{ result.link }}</p>
        <div class="flex gap-2">
          <Button variant="outline" @click="copyLink">Copiar link</Button>
          <Button @click="open = false">Concluir</Button>
        </div>
      </div>
      <form v-else class="flex flex-col gap-4" novalidate @submit.prevent="submit">
        <div class="flex flex-col gap-1.5">
          <Label for="invite-email">E-mail</Label>
          <Input id="invite-email" v-model="email" type="email" autocomplete="off" />
        </div>
        <fieldset class="flex flex-col gap-2">
          <legend class="mb-1 text-sm font-medium">Papéis</legend>
          <div v-for="role in options" :key="role" class="flex items-center gap-3 text-sm">
            <Checkbox :id="`invite-role-${role}`" :model-value="roles.includes(role)" @update:model-value="(checked) => toggle(role, checked === true)" />
            <Label :for="`invite-role-${role}`" class="font-normal">{{ workspaceRoleLabel(role) }}</Label>
          </div>
          <p class="text-xs text-muted-foreground">Quem só administra vê os números da clínica, nunca dados de pacientes.</p>
        </fieldset>
        <p v-if="error" class="text-sm text-destructive" role="alert">{{ error }}</p>
        <Button type="submit" :disabled="submitting">{{ submitting ? 'Enviando…' : 'Enviar convite' }}</Button>
      </form>
    </DialogContent>
  </Dialog>
</template>
