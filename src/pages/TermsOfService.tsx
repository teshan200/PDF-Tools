import { useEffect } from 'react'

export default function TermsOfService() {
  useEffect(() => {
    document.title = 'Terms of Service — Easy PDF Tools | easypdftools.xyz'
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
        <div className="border-b border-slate-100 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-full text-xs font-bold mb-3">
            <span>📜</span> Terms of Use
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Terms of Service</h1>
          <p className="text-xs text-slate-500 mt-1">Last Updated: August 25, 2026</p>
        </div>

        <section className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By accessing and using <strong>Easy PDF Tools</strong> (<a href="https://easypdftools.xyz" className="text-blue-600 hover:underline">https://easypdftools.xyz</a>), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our services.
          </p>
        </section>

        <section className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">2. Free &amp; Open Source Software (FOSS)</h2>
          <p>
            Easy PDF Tools is provided free of charge under open-source software licensing. You are free to process your documents without subscriptions, credit cards, or hidden paywalls.
          </p>
        </section>

        <section className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">3. Electronic Signatures &amp; Document Validity</h2>
          <p>
            Our signing tool embeds vector signature stamps and SHA-256 cryptographic audit trails in compliance with the US ESIGN Act and EU eIDAS regulation for Standard Electronic Signatures (SES). Users are responsible for verifying whether electronic signatures meet specific jurisdictional or contractual requirements for their specific legal documents.
          </p>
        </section>

        <section className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">4. Disclaimer of Warranties</h2>
          <p>
            The service is provided on an "AS IS" and "AS AVAILABLE" basis. While our client-side tools use robust libraries (including PDF.js and pdf-lib), we do not warrant that files will convert or process without unforeseen formatting alterations.
          </p>
        </section>

        <section className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">5. Limitation of Liability</h2>
          <p>
            In no event shall Easy PDF Tools, its creators, or contributors be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use the service.
          </p>
        </section>
      </div>
    </div>
  )
}
