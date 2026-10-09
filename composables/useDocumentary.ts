import type { User } from '~/types'
import {
  nextDocumentaryIdentity,
  unknownDocumentaryIdentity,
} from '~/utils/documentary-identity'
import {
  notebooksSchema,
  documentaryPatientsSchema,
} from '~/schemas/documentary'
// Última identidade válida; só muda quando `/me` traz outro usuário (ACO-77).
// O plugin documentary-privacy acompanha o `me` e atualiza este estado.
export function useDocumentaryIdentity() {
  const { data: user } = useNuxtData<User | null>('me')
  const identity = useState('documentary-identity', () =>
    nextDocumentaryIdentity(unknownDocumentaryIdentity, user.value),
  )
  return readonly(identity)
}
export function useDocumentaryPatient(patientId: MaybeRefOrGetter<string>) {
  const identity = useDocumentaryIdentity()
  return useFetch(() => `/api/documentary/patients/${toValue(patientId)}`, {
    key: () => `documentary-${identity.value}-${toValue(patientId)}`,
    transform: (value) => notebooksSchema.parse(value),
  })
}
export function useDocumentaryPatients(page: Ref<number>) {
  const identity = useDocumentaryIdentity()
  return useFetch('/api/documentary/patients', {
    query: { page, pageSize: 20 },
    key: () => `documentary-list-${identity.value}-${page.value}`,
    transform: (value) => documentaryPatientsSchema.parse(value),
  })
}
