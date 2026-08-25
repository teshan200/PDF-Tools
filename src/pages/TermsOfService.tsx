import { useEffect } from 'react'

export default function TermsOfService() {
  useEffect(() => {
    document.title = 'Terms of Service — Easy PDF Tools | easypdftools.xyz'
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8 transition-colors duration-200">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-full text-xs font-bold mb-3">
            Terms of Use
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Terms of Service</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Last Updated: August 25, 2026</p>
        </div>

        <section className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing and using <strong>Easy PDF Tools</strong> (<a href="https://easypdftools.xyz" className="text-blue-600 dark:text-blue-400 hover:underline">https://easypdftools.xyz</a>), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our services.
          </p>
        </section>

        <section className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Free &amp; Unrestricted Open Source License</h2>
          <p>
            Easy PDF Tools is provided free of charge for personal, educational, and commercial purposes under open-source terms. The software is provided "as is", without warranty of any kind, express or implied.
          </p>
        </section>

        <section className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. User Responsibility &amp; File Sovereignty</h2>
          <p>
            Because all file processing executes locally inside your web browser, you retain 100% ownership and sovereignty of all documents processed through our tools. You are solely responsible for ensuring you have the legal right and authorization to modify, sign, merge, or convert any documents you open.
          </p>
        </section>

        <section className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Electronic Signatures Compliance</h2>
          <p>
            Our Sign PDF tool provides client-side electronic signature capabilities compliant with ESIGN and eIDAS electronic signature standards. Users should verify specific jurisdictional legal requirements for regulated contracts (such as real estate deeds or court filings).
          </p>
        </section>

        <section className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">5. Limitation of Liability</h2>
          <p>
            In no event shall Easy PDF Tools or its developer Teshan Pamodya be liable for any claim, damages, or other liability arising from, out of, or in connection with the software or the use or other dealings in the software.
          </p>
        </section>

        <section className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">6. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the website following any changes constitutes acceptance of the new terms.
          </p>
        </section>
      </div>
    </div>
  )
}
