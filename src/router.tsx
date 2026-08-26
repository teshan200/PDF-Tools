import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { trackPageView } from './analytics'
import { updateSEOForRoute } from './utils/seo'

interface RouterContextType {
  path: string
  navigate: (to: string) => void
  goBack: () => void
}

const RouterContext = createContext<RouterContextType>({
  path: '/',
  navigate: () => {},
  goBack: () => {},
})

function getHashPath(): string {
  const hash = window.location.hash.replace(/^#/, '')
  if (hash) return hash.startsWith('/') ? hash : `/${hash}`
  const pathname = window.location.pathname
  if (pathname && pathname !== '/') return pathname
  return '/'
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useState<string>(getHashPath)

  useEffect(() => {
    const handler = () => setPath(getHashPath())
    window.addEventListener('hashchange', handler)
    window.addEventListener('popstate', handler)
    return () => {
      window.removeEventListener('hashchange', handler)
      window.removeEventListener('popstate', handler)
    }
  }, [])

  // Update dynamic SEO metadata and send page_view event to Google Analytics
  useEffect(() => {
    updateSEOForRoute(path)
    const timer = setTimeout(() => {
      trackPageView(path, document.title)
    }, 100)
    return () => clearTimeout(timer)
  }, [path])

  const navigate = useCallback((to: string) => {
    window.location.hash = to
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const goBack = useCallback(() => {
    navigate('/')
  }, [navigate])

  return (
    <RouterContext.Provider value={{ path, navigate, goBack }}>
      {children}
    </RouterContext.Provider>
  )
}

export function useRouter() {
  return useContext(RouterContext)
}
