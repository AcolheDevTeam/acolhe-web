import type { User } from '~/types'

// Qualquer escrita recusada com 402 (workspace só leitura) recarrega a
// assinatura: a faixa "Assinatura inativa" aparece no shell com o link para
// /assinatura, mesmo que o estado em cache ainda dissesse "liberado". O texto
// do erro vem do apiErrorMessage (402) em cada tela.
export default defineNuxtPlugin((nuxtApp) => {
  globalThis.$fetch = globalThis.$fetch.create({
    onResponseError({ request, response }) {
      if (response.status !== 402) return
      const url = typeof request === 'string' ? request : request instanceof Request ? request.url : String(request)
      if (url.includes('/api/billing/')) return
      // O interceptor roda fora do setup: o contexto do Nuxt vem do plugin.
      void nuxtApp.runWithContext(() => {
        const { data: me } = useNuxtData<User | null>('me')
        return refreshNuxtData(subscriptionKey(me.value?.workspace?.organizationId))
      })
    },
  })
})
