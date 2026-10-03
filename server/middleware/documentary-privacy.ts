// SSR HTML also contains authorized notebook text; prevent intermediary/browser caching.
export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  if (
    path === '/registry' ||
    path.startsWith('/registry/') ||
    /^\/patients\/[^/]+\/registry\/?$/.test(path)
  ) {
    setResponseHeader(event, 'Cache-Control', 'private, no-store')
  }
})
