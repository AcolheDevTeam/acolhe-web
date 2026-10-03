import { createProtectedLogout } from '~/utils/protected-logout'

export default defineNuxtPlugin(() => ({
  provide: { protectedLogout: createProtectedLogout() },
}))
