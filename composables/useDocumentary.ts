import type { User } from '~/types'
import {
  notebooksSchema,
  documentaryPatientsSchema,
} from '~/schemas/documentary'
export function useDocumentaryIdentity() {
  const { data: user } = useNuxtData<User | null>('me')
  return computed(
    () => `${user.value?.organizationId ?? ''}:${user.value?.id ?? ''}`,
  )
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
