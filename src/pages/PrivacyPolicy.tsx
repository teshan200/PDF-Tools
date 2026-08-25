import { useEffect } from 'react'

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy — Easy PDF Tools | easypdftools.xyz'
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
        <div className="border-b border-slate-100 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-bold mb-3">
            <span>🛡️</span> Zero-Knowledge Privacy Standard
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
          <p className="text-xs text-slate-500 mt-1">Last Updated: August 25, 2026 • Effective Date: August 25, 2026</p>
        </div>

        <section className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">1. Overview &amp; Core Privacy Commitment</h2>
          <p>
            At <strong>Easy PDF Tools</strong> (accessible at <a href="https://easypdftools.xyz" className="text-blue-600 hover:underline">https://easypdftools.xyz</a>), we believe privacy is a fundamental human right. Our web application is architected around a <strong>zero-knowledge, client-side processing model</strong>. 
          </p>
          <p>
            Unlike traditional PDF websites that upload your personal documents to remote cloud servers, all core file operations (including PDF signing, text editing, merging, splitting, compressing, rotating, encrypting, and unlocking) run <strong>100% locally inside your web browser</strong> using WebAssembly, Web Workers, and the Web Crypto API.
          </p>
        </section>

        <section className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">2. Information We Do NOT Collect</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>No Document Data:</strong> We never transmit, store, read, or log the contents of your PDF files or images.</li>
            <li><strong>No Signature Retention:</strong> Your handwritten or typed signatures are processed entirely in browser RAM or encrypted on your physical device via 256-bit AES-GCM. We have zero access to your signatures.</li>
            <li><strong>No User Accounts / PII:</strong> No registration, email address, password, or credit card is required to use our services.</li>
          </ul>
        </section>

        <section className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">3. Google Analytics &amp; Cookies</h2>
          <p>
            We use <strong>Google Analytics 4 (GA4)</strong> to collect anonymous, aggregated telemetry to understand how visitors interact with our website (such as page views, device types, browser versions, and referral sources).
          </p>
          <p>
            Google Analytics uses first-party cookies to report on visitor interactions. These cookies store non-personally identifiable information. You can opt out of Google Analytics tracking at any time by using the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Analytics Opt-out Browser Add-on</a>.
          </p>
        </section>

        <section className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">4. Google AdSense &amp; Third-Party Advertising</h2>
          <p>
            To keep Easy PDF Tools completely free and unlimited for users worldwide, we may serve advertisements provided by <strong>Google AdSense</strong> and authorized advertising partners.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites on the internet.</li>
            <li>Google's use of advertising cookies enables it and its partners to serve ads to users based on their visit to our site and/or other sites on the Internet.</li>
            <li>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Ads Settings</a> or <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">aboutads.info</a>.</li>
          </ul>
        </section>

        <section className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">5. GDPR &amp; CCPA Privacy Rights</h2>
          <p>
            Under the European General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA), users have rights regarding their data. Because we do not store, collect, or monetize personal document data, your right to data sovereignty is respected by design.
          </p>
        </section>

        <section className="space-y-3 text-slate-700 text-sm leading-relaxed border-t border-slate-100 pt-6">
          <h2 className="text-lg font-bold text-slate-900">6. Open Source Transparency &amp; Contact</h2>
          <p>
            Easy PDF Tools is open-source. Anyone can audit our code and verify our privacy architecture on <a href="https://github.com/teshan200/PDF-Tools" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">GitHub</a>.
          </p>
          <p>
            If you have questions about this policy, contact developer <strong>Teshan Pamodya</strong> at <a href="https://teshan.click" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">teshan.click</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
