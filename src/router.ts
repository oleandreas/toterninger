import { ref, readonly } from 'vue'

export interface RouteHome { name: 'home' }
export interface RouteSession { name: 'session'; sessionId: string }
export type Route = RouteHome | RouteSession

const route = ref<Route>(parseHash())

function parseHash(): Route {
  const hash = window.location.hash
  const match = hash.match(/^#\/session\/(\d{3}-\d{3}-\d{3})$/)
  if (match) {
    return { name: 'session', sessionId: match[1] }
  }
  return { name: 'home' }
}

window.addEventListener('hashchange', () => {
  route.value = parseHash()
})

export function useRouter() {
  function navigate(r: Route) {
    if (r.name === 'home') {
      window.location.hash = ''
    } else {
      window.location.hash = `/session/${r.sessionId}`
    }
  }

  return { route: readonly(route), navigate }
}

export function generateSessionId(): string {
  const part = () => String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  return `${part()}-${part()}-${part()}`
}
