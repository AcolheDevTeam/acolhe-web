// Menu lateral recolhido (só ícones) no desktop. Fica em cookie para o SSR já
// desenhar o estado certo, sem piscar ao recarregar.
export function useSidebarCollapsed() {
  return useCookie<boolean>('acolhe_sidebar_recolhido', {
    default: () => false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })
}
