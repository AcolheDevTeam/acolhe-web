export default defineNuxtPlugin(() => {
  const identity = useDocumentaryIdentity()
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
