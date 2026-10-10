<script setup lang="ts">
import { ChevronRight, Download, RefreshCw } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { PatientSelfExport, PatientSettingsConsent, PatientSettingsProfile } from '~/schemas/patient-settings'
import { patientProfileUpdateSchema } from '~/schemas/patient-settings'
import {
  consentErrorMessage,
  consentStatusLabel,
  healthRevokedNotice,
  initialsOf,
  profileErrorMessage,
  psychologistMeta,
  selfExportErrorMessage,
  selfExportNotice,
} from '~/utils/patient-settings'
import { Button } from '@/components/ui/button'
import { InlineNotice } from '@/components/ui/inline-notice'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

// Ajustes da paciente (protótipo AjustesPaciente, ACO-102): dados, psicóloga,
// consentimentos, baixar meus dados, trocar senha e sair. Abre com o vínculo
// em qualquer estado. "Compartilhar com outra psicóloga" fica fora: ainda não
// existe o compartilhamento entre psicólogas.
definePageMeta({ layout: 'patient', middleware: ['auth', 'patient-only'] })
useHead({ title: 'Ajustes · Acolhe' })

const { data: settings, status, error, refresh } = usePatientSettings()
const { logout, isLoggingOut } = useLogout()
const pending = computed(() => (status.value === 'pending' || status.value === 'idle') && !settings.value)
const revokedNotice = computed(() => healthRevokedNotice(settings.value))
const psychologist = computed(() => settings.value?.psychologist ?? null)

// Seus dados: edição num bottom sheet. O e-mail é o login e não muda aqui.
const editOpen = ref(false)
const form = reactive({ fullName: '', phone: '' })
const formErrors = reactive<{ fullName?: string, phone?: string }>({})
const savingProfile = ref(false)
const profileError = ref('')
function openEdit() {
  const profile = settings.value?.profile
  form.fullName = profile?.fullName ?? ''
  form.phone = profile?.phone ?? ''
  formErrors.fullName = undefined
  formErrors.phone = undefined
  profileError.value = ''
  editOpen.value = true
}
async function saveProfile() {
  if (savingProfile.value) return
  formErrors.fullName = undefined
  formErrors.phone = undefined
  profileError.value = ''
  const parsed = patientProfileUpdateSchema.safeParse(form)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as 'fullName' | 'phone'
      formErrors[field] ??= issue.message
    }
    return
  }
  savingProfile.value = true
  try {
    const profile = await $fetch<PatientSettingsProfile>('/api/patient/profile', { method: 'PUT', body: parsed.data })
    if (settings.value) settings.value = { ...settings.value, profile }
    editOpen.value = false
    toast.success('Seus dados foram atualizados.')
    // O nome aparece no Início e no avatar, que vêm do /me.
    void refreshNuxtData('me')
  } catch (err) {
    profileError.value = profileErrorMessage(err)
  } finally {
    savingProfile.value = false
  }
}

// Consentimentos. Revogar o de dados de saúde pede confirmação; os opcionais
// mudam direto e podem voltar.
const busyScope = ref<string | null>(null)
const confirmHealthOpen = ref(false)
async function changeConsent(consent: PatientSettingsConsent, on: boolean) {
  if (busyScope.value) return
  if (!on && consent.scope === 'health_data') {
    confirmHealthOpen.value = true
    return
  }
  await sendConsent(consent.scope, on ? 'accept' : 'revoke')
}
async function sendConsent(scope: PatientSettingsConsent['scope'], action: 'accept' | 'revoke') {
  busyScope.value = scope
  try {
    await $fetch(`/api/patient/consents/${scope}/${action}`, { method: 'POST' })
    if (scope === 'health_data') {
      // O estado do vínculo muda: o portal inteiro passa a ler o /me novo.
      await refreshNuxtData('me')
      toast.success(action === 'revoke' ? 'Consentimento revogado.' : 'Consentimento autorizado. O acompanhamento pelo app voltou.')
    }
  } catch (err) {
    toast.error(consentErrorMessage(err, action))
  } finally {
    await refresh()
    busyScope.value = null
  }
}
async function confirmHealthRevoke() {
  confirmHealthOpen.value = false
  await sendConsent('health_data', 'revoke')
}

// Baixar meus dados.
const exportRequest = ref<PatientSelfExport | null>(null)
const requestingExport = ref(false)
const exportState = computed(() => exportRequest.value ?? settings.value?.export ?? null)
const exportNotice = computed(() => selfExportNotice(exportState.value))
async function requestExport() {
  if (requestingExport.value) return
  requestingExport.value = true
  try {
    exportRequest.value = await $fetch<PatientSelfExport>('/api/patient/export', { method: 'POST' })
  } catch (err) {
    toast.error(selfExportErrorMessage(err))
  } finally {
    requestingExport.value = false
  }
}

const rowClass = 'flex min-h-[52px] w-full items-center justify-between gap-3 border-t border-surface-hover px-4 py-2.5 text-left text-sm first:border-t-0'
</script>

<template>
  <div class="flex flex-col gap-6">
    <PatientPageHeader title="Ajustes" back="/patient" back-label="Voltar ao início" />

    <PortalLoadState :pending="pending" :error="error && !settings ? error : null" error-title="Não foi possível carregar os seus ajustes.">
      <template #error-action>
        <Button variant="outline" @click="() => refresh()"><RefreshCw class="size-4" />Tentar novamente</Button>
      </template>
      <div v-if="settings" class="flex flex-col gap-6">
        <InlineNotice v-if="revokedNotice" tone="warning">{{ revokedNotice }}</InlineNotice>

        <section class="animate-rise flex flex-col gap-2.5 [animation-delay:60ms]" aria-labelledby="t-dados">
          <h2 id="t-dados" class="label-mono">Seus dados</h2>
          <div class="overflow-hidden rounded-2xl border bg-card">
            <div :class="rowClass"><span class="text-muted-foreground">Nome</span><span class="min-w-0 truncate text-right font-medium">{{ settings.profile.fullName }}</span></div>
            <div :class="rowClass"><span class="text-muted-foreground">E-mail</span><span class="min-w-0 truncate text-right font-medium">{{ settings.profile.email }}</span></div>
            <div :class="rowClass"><span class="text-muted-foreground">Telefone</span><span class="min-w-0 truncate text-right font-medium">{{ settings.profile.phone || 'Não informado' }}</span></div>
            <button type="button" :class="[rowClass, 'font-medium text-primary transition-colors hover:bg-surface-subtle']" @click="openEdit">
              Editar dados
            </button>
          </div>
        </section>

        <section v-if="psychologist" class="animate-rise flex flex-col gap-2.5 [animation-delay:100ms]" aria-labelledby="t-psi">
          <h2 id="t-psi" class="label-mono">Sua psicóloga</h2>
          <div class="flex items-center gap-3.5 rounded-2xl border bg-card p-4">
            <span aria-hidden="true" class="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-highlight">{{ initialsOf(psychologist.name) }}</span>
            <span class="flex min-w-0 flex-col gap-0.5">
              <span class="text-[15px] font-semibold">{{ psychologist.name }}</span>
              <span class="font-mono text-xs text-muted-foreground">{{ psychologistMeta(psychologist) }}</span>
            </span>
          </div>
        </section>

        <section class="animate-rise flex flex-col gap-2.5 [animation-delay:140ms]" aria-labelledby="t-cons">
          <h2 id="t-cons" class="label-mono">Consentimentos (LGPD)</h2>
          <div class="overflow-hidden rounded-2xl border bg-card">
            <div v-for="consent in settings.consents" :key="consent.scope" :class="[rowClass, 'items-start py-3.5']">
              <span class="flex min-w-0 flex-col gap-1">
                <span :id="`cons-${consent.scope}`" class="text-[15px] font-semibold">{{ consent.title }}</span>
                <span :id="`cons-${consent.scope}-desc`" class="whitespace-pre-line text-[13px] leading-normal text-secondary-foreground">{{ consent.content }}</span>
                <span class="font-mono text-[11px] text-muted-foreground">{{ consentStatusLabel(consent) }}</span>
              </span>
              <span class="flex h-11 w-[52px] shrink-0 items-center justify-center">
                <Switch
                  size="lg"
                  :model-value="consent.status === 'accepted'"
                  :disabled="busyScope !== null"
                  :aria-labelledby="`cons-${consent.scope}`"
                  :aria-describedby="`cons-${consent.scope}-desc`"
                  @update:model-value="(on: boolean) => changeConsent(consent, on)"
                />
              </span>
            </div>
          </div>
        </section>

        <section class="animate-rise flex flex-col gap-2.5 [animation-delay:180ms]" aria-labelledby="t-priv">
          <h2 id="t-priv" class="label-mono">Privacidade e conta</h2>
          <div class="overflow-hidden rounded-2xl border bg-card">
            <button type="button" :class="[rowClass, 'transition-colors hover:bg-surface-subtle disabled:opacity-60']" :disabled="requestingExport" @click="requestExport">
              <span class="flex min-w-0 flex-col gap-0.5">
                <span class="font-medium">{{ requestingExport ? 'Pedindo seus dados…' : 'Baixar meus dados' }}</span>
                <span v-if="exportNotice" class="animate-fade text-[13px] text-muted-foreground" aria-live="polite">{{ exportNotice }}</span>
              </span>
              <Download class="size-[18px] shrink-0 text-muted-foreground" :stroke-width="1.8" aria-hidden="true" />
            </button>
            <NuxtLink to="/patient/ajustes/senha" :class="[rowClass, 'font-medium transition-colors hover:bg-surface-subtle']">
              <span>Trocar senha</span>
              <ChevronRight class="size-[18px] shrink-0 text-muted-foreground" :stroke-width="1.8" aria-hidden="true" />
            </NuxtLink>
            <button type="button" :class="[rowClass, 'font-medium text-destructive transition-colors hover:bg-surface-subtle']" :disabled="isLoggingOut" @click="logout">
              {{ isLoggingOut ? 'Saindo…' : 'Sair' }}
            </button>
          </div>
        </section>
      </div>
    </PortalLoadState>

    <PatientBottomSheet v-model:open="editOpen" title="Editar dados" description="O e-mail é o seu login e não muda por aqui.">
      <form class="flex flex-col gap-4" novalidate @submit.prevent="saveProfile">
        <div class="flex flex-col gap-2">
          <Label for="settings-name">Nome completo</Label>
          <Input id="settings-name" v-model="form.fullName" autocomplete="name" :aria-invalid="!!formErrors.fullName" :disabled="savingProfile" />
          <p v-if="formErrors.fullName" class="text-sm text-destructive">{{ formErrors.fullName }}</p>
        </div>
        <div class="flex flex-col gap-2">
          <Label for="settings-phone">Telefone</Label>
          <Input id="settings-phone" v-model="form.phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(11) 98765-4321" :aria-invalid="!!formErrors.phone" :disabled="savingProfile" />
          <p v-if="formErrors.phone" class="text-sm text-destructive">{{ formErrors.phone }}</p>
        </div>
        <p v-if="profileError" class="text-sm text-destructive" role="alert">{{ profileError }}</p>
        <div class="flex flex-col gap-2.5 pt-1">
          <Button type="submit" size="xl" class="w-full" :loading="savingProfile">{{ savingProfile ? 'Salvando…' : 'Salvar' }}</Button>
          <Button type="button" variant="outline" size="xl" class="w-full" :disabled="savingProfile" @click="editOpen = false">Cancelar</Button>
        </div>
      </form>
    </PatientBottomSheet>

    <PatientBottomSheet v-model:open="confirmHealthOpen" title="Revogar consentimento de dados de saúde?">
      <div class="flex flex-col gap-3 text-sm leading-relaxed text-secondary-foreground">
        <p>Sem esse consentimento, o acompanhamento pelo app fica pausado e você deixa de receber atividades e check-ins por aqui.</p>
        <p>O prontuário já registrado continua guardado pelo prazo previsto na Resolução CFP 01/2009, e você pode baixar seus dados quando quiser. Se mudar de ideia, é só autorizar de novo nesta tela.</p>
      </div>
      <div class="flex flex-col gap-2.5 pt-1">
        <Button variant="destructive" size="xl" class="w-full" @click="confirmHealthRevoke">Revogar consentimento</Button>
        <Button variant="outline" size="xl" class="w-full" @click="confirmHealthOpen = false">Manter como está</Button>
      </div>
    </PatientBottomSheet>
  </div>
</template>
