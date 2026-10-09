import type { User } from '~/types'
import { nextDocumentaryIdentity } from '~/utils/documentary-identity'

export default defineNuxtPlugin(() => {
  const identity = useState<string>('documentary-identity')
  const { data: user } = useNuxtData<User | null>('me')
  // Só outro usuário válido troca a identidade; `null` por sessão expirada,
  // rede ou 5xx mantém a anterior e preserva o rascunho (ACO-77).
  watch(
    user,
    (value) => {
      identity.value = nextDocumentaryIdentity(identity.value ?? ':', value)
    },
    { flush: 'sync', immediate: true },
  )
  watch(
    identity,
    () => clearNuxtData((key) => key.startsWith('documentary-')),
    { flush: 'sync' },
  )
  // Detect a session changed in another tab before reusing any private cache.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void refreshNuxtData('me')
  })
})
