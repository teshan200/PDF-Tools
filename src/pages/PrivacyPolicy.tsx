import { useEffect } from 'react'

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy — Easy PDF Tools | easypdftools.xyz'
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8 transition-colors duration-200">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-full text-xs font-bold mb-3">
            Privacy Standard
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Privacy Policy</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Last Updated: August 25, 2026 • Effective Date: August 25, 2026</p>
        </div>

        <section className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Overview &amp; Core Privacy Commitment</h2>
          <p>
            At <strong>Easy PDF Tools</strong> (accessible at <a href="https://easypdftools.xyz" className="text-blue-600 dark:text-blue-400 hover:underline">https://easypdftools.xyz</a>), we believe privacy is a fundamental human right. Our application is engineered with a privacy-first hybrid architecture designed to keep document processing local whenever possible.
          </p>
        </section>

        <section className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. How Documents Are Processed</h2>
          <div className="space-y-3">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                A. Client-Side Tools (100% Local — 0 Bytes Uploaded)
              </h3>
              <p className="text-xs leading-relaxed">
                For <strong>Sign PDF, Edit PDF, Merge PDF, Split PDF, Rotate PDF, and PDF to JPG</strong>, all document operations execute entirely inside your browser's private memory using WebAssembly, HTML5 Canvas, <code className="text-xs bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">pdf-lib</code>, and <code className="text-xs bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">pdfjs-dist</code>. <strong>Your documents never leave your device or get uploaded to any server.</strong>
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-blue-700 dark:text-blue-400">
                B. Cloud Conversion Tools (In-Memory Processing)
              </h3>
              <p className="text-xs leading-relaxed">
                For tools requiring complex server-side engines (such as <strong>PDF to Word</strong> OCR and advanced <strong>PDF Compression</strong>), files are transmitted over encrypted TLS 1.3 to secure serverless functions. Documents are processed ephemerally in RAM and are <strong>permanently deleted immediately</strong> after processing. No documents are ever stored on disk or shared with third parties.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Local Signature Storage &amp; Encryption</h2>
          <p>
            When using the <strong>Sign PDF</strong> tool:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>Your signatures are processed in local volatile RAM.</li>
            <li>If you choose to save a signature for future use, it is encrypted locally on your computer with <strong>AES-GCM 256-bit encryption</strong> using keys derived via PBKDF2 (100,000 iterations).</li>
            <li>We have zero access to your saved signatures, decryption keys, or PIN codes.</li>
          </ul>
        </section>

        <section className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Google Analytics &amp; Cookies</h2>
          <p>
            We use <strong>Google Analytics 4 (GA4)</strong> to collect anonymous, aggregated telemetry to understand how visitors interact with our website (such as page views, device types, browser versions, and referral sources).
          </p>
          <p>
            Google Analytics uses first-party cookies to report on visitor interactions. These cookies store non-personally identifiable information. You can opt out of Google Analytics tracking at any time by using the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Google Analytics Opt-out Browser Add-on</a>.
          </p>
        </section>

        <section className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">5. Google AdSense &amp; Third-Party Advertising</h2>
          <p>
            To keep Easy PDF Tools completely free and unrestricted for users worldwide, we may serve advertisements provided by <strong>Google AdSense</strong> and authorized advertising partners.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites on the internet.</li>
            <li>Google's use of advertising cookies enables it and its partners to serve ads to users based on their visit to our site and/or other sites on the Internet.</li>
            <li>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Google Ads Settings</a> or <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">aboutads.info</a>.</li>
          </ul>
        </section>

        <section className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">6. GDPR &amp; CCPA Privacy Rights</h2>
          <p>
            Under the European General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA), users have rights regarding their data. Because we do not store, collect, or monetize personal document data, your right to data sovereignty is respected by design.
          </p>
        </section>

        <section className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">7. Open Source Verification &amp; Contact</h2>
          <p>
            Easy PDF Tools is open-source. Anyone can audit our code and verify our privacy architecture on <a href="https://github.com/teshan200/PDF-Tools" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">GitHub</a>.
          </p>
          <p>
            If you have questions about this policy, contact developer <strong>Teshan Pamodya</strong> at <a href="https://teshan.click" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">teshan.click</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
