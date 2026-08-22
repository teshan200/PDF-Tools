declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}

const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID

export function initAnalytics() {
  if (!gaMeasurementId || typeof window === 'undefined') return

  // Prevent multiple script insertions
  if (document.getElementById('ga-script')) return

  const script = document.createElement('script')
  script.id = 'ga-script'
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function () {
    window.dataLayer?.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', gaMeasurementId, {
    send_page_view: false, // Page views tracked on route changes
  })
}

export function trackPageView(path: string, title?: string) {
  if (typeof window.gtag === 'function' && gaMeasurementId) {
    window.gtag('event', 'page_view', {
      page_title: title || document.title,
      page_location: window.location.href,
      page_path: path,
    })
  }
}
