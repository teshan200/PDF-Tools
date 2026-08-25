interface SecurityModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SecurityModal({ isOpen, onClose }: SecurityModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center text-xl shadow-xs">
              🛡️
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">How It Works &amp; Privacy Architecture</h3>
              <p className="text-xs text-slate-500">Why your files and signatures are 100% private and secure</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center text-sm font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 4-Step Visual Flow Diagram */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">The 4-Step Client-Side Lifecycle</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Step 1 */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <span className="font-bold text-xs text-slate-900">Zero Server Uploads</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                When you pick a PDF, it is loaded directly into your browser's local RAM via <strong>PDF.js Web Workers</strong>. 0 bytes are ever transmitted over the network.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <span className="font-bold text-xs text-slate-900">Local Vector Rendering</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Signatures, whiteouts, and edits are created using in-memory HTML5 Canvas and mathematical vector coordinates on your physical computer.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                <span className="font-bold text-xs text-slate-900">AES-256 Encryption &amp; PIN</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Saved signatures are encrypted locally with native <strong>Web Crypto AES-GCM 256-bit</strong> and PBKDF2 PIN keys. Raw images are never saved to disk unencrypted.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0">4</span>
                <span className="font-bold text-xs text-slate-900">In-Browser PDF Flattening</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>pdf-lib</strong> flattens signatures and stamps directly into the PDF’s binary stream in your browser, generating your signed file instantly.
              </p>
            </div>
          </div>
        </div>

        {/* Offline Proof Callout */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
          <span className="text-2xl shrink-0">📶</span>
          <div className="space-y-1">
            <h5 className="font-bold text-xs text-emerald-950">The Offline Test Guarantee</h5>
            <p className="text-xs text-emerald-800 leading-relaxed">
              You can open any tool on this website, <strong>completely disconnect your Wi-Fi / Internet</strong>, and edit, sign, merge, or protect PDFs with 100% functionality. That is cryptographic proof that zero files leave your computer.
            </p>
          </div>
        </div>

        {/* Legal & Regulatory Compliance */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Legal Compliance &amp; Standards</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900">🇺🇸 ESIGN Act &amp; UETA</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Compliant with US Electronic Signatures in Global and National Commerce Act.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900">🇪🇺 eIDAS Compliant</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Adheres to EU Regulation No 910/2014 for Standard Electronic Signatures (SES).</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900">⭐ 100% Open Source</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Full source code is open and verifiable on GitHub by independent auditors.</p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <a
            href="https://github.com/teshan200/PDF-Tools"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-700 hover:text-teal-800 font-bold inline-flex items-center gap-1.5 hover:underline"
          >
            <span>Auditable Source Code on GitHub</span>
            <span>↗</span>
          </a>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
          >
            Got It, Thanks!
          </button>
        </div>
      </div>
    </div>
  )
}
