import { useEffect } from 'react'

export default function About() {
  useEffect(() => {
    document.title = 'About Us — Easy PDF Tools | easypdftools.xyz'
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-full text-xs font-bold mb-3">
            <span>💡</span> Our Mission
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">About Easy PDF Tools</h1>
          <p className="text-slate-500 mt-2 text-base leading-relaxed">
            A free, privacy-first PDF utility suite engineered to make document management fast, unrestricted, and completely secure.
          </p>
        </div>

        <div className="space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed">
          <h2 className="text-xl font-bold text-slate-900">Why Easy PDF Tools Was Created</h2>
          <p>
            Most online PDF websites force users to upload their private files to remote servers, charge monthly subscriptions, or place daily limits on how many pages you can edit or sign.
          </p>
          <p>
            <strong>Easy PDF Tools</strong> was built by developer <strong>Teshan Pamodya</strong> to prove that high-performance, professional PDF utilities can run <strong>entirely inside the user's browser</strong> — with zero server uploads, zero file size caps, and complete open-source transparency.
          </p>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-2xl">🔒</span>
            <h3 className="font-bold text-slate-900 text-sm">100% Client-Side</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your files never touch a cloud server. All operations run in local Web Worker threads.
            </p>
          </div>
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-2xl">⭐</span>
            <h3 className="font-bold text-slate-900 text-sm">Open Source</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              The entire code is publicly accessible on GitHub for transparency and security auditing.
            </p>
          </div>
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-2xl">⚡</span>
            <h3 className="font-bold text-slate-900 text-sm">Zero Limits</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Unlimited file sizes, no account creation, and zero paywalls for users worldwide.
            </p>
          </div>
        </div>

        {/* Developer Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div>
            <h3 className="text-base font-bold">Developed &amp; Maintained by Teshan Pamodya</h3>
            <p className="text-xs text-slate-400 mt-0.5">Software Developer &amp; Open Source Creator</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://teshan.click"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold transition-colors"
            >
              Website ↗
            </a>
            <a
              href="https://github.com/teshan200/PDF-Tools"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-xl text-xs transition-colors"
            >
              GitHub Repo ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
