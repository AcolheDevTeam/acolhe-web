// Páginas que recebem token de uso único na URL (ACO-87): o HTML do SSR carrega
// a URL no payload do Nuxt, então nada de cache, e o Referer não sai da página.
export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  if (path === '/redefinir-senha' || path === '/verify-email') {
    setResponseHeader(event, 'Cache-Control', 'private, no-store')
    setResponseHeader(event, 'Referrer-Policy', 'no-referrer')
  }
})
