// Sair: a API revoga a sessão deste token (ACO-85) e o cookie é apagado. Se a
// API não responder, o cookie sai do mesmo jeito — quem clicou em Sair não pode
// ficar preso logado; o token só continua válido até expirar.
export default defineEventHandler(async (event) => {
  if (getCookie(event, 'acolhe_session')) {
    try {
      await apiFetch(event, '/logout', { method: 'POST', timeout: 3000 })
    }
    catch {
      // Sessão já inválida (401) ou API fora: nada a fazer além de apagar o cookie.
    }
  }
  deleteCookie(event, 'acolhe_session', { path: '/' })
  return { ok: true }
})
