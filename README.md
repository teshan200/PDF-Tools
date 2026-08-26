# Easy PDF Tools 📄✨

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-badge-id/deploy-status)](https://easypdftools.xyz/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19.x-61dafb.svg?logo=react)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff.svg?logo=vite)](https://vitejs.dev/)

A modern, lightning-fast, privacy-first PDF utility suite featuring **10 professional document tools** — built with React 19, TypeScript, Tailwind CSS v4, PDF.js, pdf-lib, fflate, and Netlify Serverless Functions.

🌐 **Live Application**: [https://easypdftools.xyz/](https://easypdftools.xyz/)  
👨‍💻 **Author & Lead Developer**: **Teshan Pamodya** • [Portfolio (teshan.click)](https://teshan.click) • [GitHub](https://github.com/teshan200/) • [LinkedIn](https://www.linkedin.com/in/teshan-pamodya/)

---

## 🚀 Key Highlights

* 🛡️ **100% Client-Side Privacy (Local-First Engine)**: Core document operations (*Sign, Edit, Merge, Split, Rotate, PDF to JPG*) execute entirely within your browser memory using WebAssembly & Web Workers — **0 bytes are uploaded to remote servers**.
* ✍️ **Studio-Grade PDF Signing**: Draw, type, or extract transparent signatures from photos of handwriting. Includes AES-256 local encrypted storage and PIN protection.
* 📝 **In-Place Text Editing**: Click original text directly in the PDF canvas to edit or replace paragraphs, cover content with whiteout boxes, and draw freehand notes.
* 🌓 **Adaptive Dark & Light Themes**: Auto-detects system color preferences with zero Flash of Unstyled Theme (FOUT) and manual toggle support.
* 🔍 **Comprehensive SEO & Structured Data**: Built with Schema.org `WebApplication`, `Organization`, and `FAQPage` JSON-LD rich snippet schemas, XML sitemaps, and strict HSTS security headers.

---

## 🛠️ Tool Suite Breakdown

### 💻 Client-Side Local Engine (Zero Uploads — 100% Private)

| Tool | Capability | Technical Engine |
|---|---|---|
| **[Sign PDF](https://easypdftools.xyz/#/sign)** | Draw, type, or upload photo signatures. Erases paper backgrounds to produce clean digital ink stamps. Includes AES-256 local signature encryption & PIN locking. | `pdf-lib` + Web Crypto API |
| **[Edit PDF](https://easypdftools.xyz/#/edit)** | Click existing text to edit/replace in-place, apply clean whiteout eraser blocks, insert image stamps, and draw annotations. | `pdfjs-dist` + `pdf-lib` |
| **[Merge PDF](https://easypdftools.xyz/#/merge)** | Combine multiple PDF files into one clean document with custom drag-and-drop page ordering. | `pdf-lib` |
| **[Split PDF](https://easypdftools.xyz/#/split)** | Extract custom page ranges, split by intervals (every N pages), or extract individual pages into a single ZIP file. | `pdf-lib` + `fflate` |
| **[Rotate PDF](https://easypdftools.xyz/#/rotate)** | Permanently rotate pages 90°, 180°, or 270° with filters for all, even, or odd pages. | `pdf-lib` |
| **[PDF to JPG](https://easypdftools.xyz/#/jpg)** | Render PDF pages into high-resolution JPG images with adjustable DPI, packaged into a ZIP archive. | `pdfjs-dist` + Canvas + `fflate` |

---

### ⚡ Cloud Document Conversion Engine (Ephemeral Processing)

| Tool | Capability | Technical Engine |
|---|---|---|
| **[PDF to Word](https://easypdftools.xyz/#/word)** | Convert PDF documents into editable Microsoft Word (`.docx`) files with layout and table preservation. | iLovePDF Cloud Engine |
| **[Compress PDF](https://easypdftools.xyz/#/compress)** | Reduce document file size with Extreme, Recommended, or Low compression profiles. | iLovePDF Cloud Engine |
| **[Protect PDF](https://easypdftools.xyz/#/protect)** | Encrypt and lock PDF documents with standard 128-bit / 256-bit AES password security. | iLovePDF Cloud Engine |
| **[Unlock PDF](https://easypdftools.xyz/#/unlock)** | Remove password restrictions, printing locks, and editing security from protected PDF files. | iLovePDF Cloud Engine |

---

## 🔐 Security & Privacy Architecture

1. **Zero-Knowledge Document Processing**:
   - Files processed client-side never leave your device RAM.
   - Files processed via cloud conversion are transmitted over encrypted HTTPS, held temporarily in ephemeral RAM, and permanently deleted immediately after processing.
2. **Device-Level AES-256 Encryption**:
   - Signatures saved for quick stamping are encrypted using **AES-GCM (256-bit)** with PBKDF2 key derivation.
   - Sensitive signatures can be locked behind a PIN code with built-in brute-force rate limiting and session memory clearing.
3. **Hardened HTTP Headers**:
   - Includes `Strict-Transport-Security (HSTS)`, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: SAMEORIGIN`.

---

## 💻 Tech Stack

* **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite 8](https://vitejs.dev/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
* **Document Processing**: `pdf-lib`, `pdfjs-dist` (local Web Worker), `fflate`
* **Serverless Backend**: [Netlify Functions](https://docs.netlify.com/functions/overview/) (`.mts` TypeScript handlers)
* **SEO & Web Quality**: Schema.org JSON-LD structured data, XML Sitemaps, OpenGraph & Twitter Cards
* **Deployment**: [Netlify](https://www.netlify.com/)

---

## 🏃 Local Development Setup

### Prerequisites

* Node.js 18+
* npm 9+

### 1. Clone Repository

```bash
git clone https://github.com/teshan200/PDF-Tools.git
cd PDF-Tools
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Optional — Required only for cloud conversion tools (PDF to Word, Compress, Protect, Unlock)
ILOVEPDF_PUBLIC_KEY=your_public_key_here
ILOVEPDF_SECRET_KEY=your_secret_key_here

# Optional — Google Analytics
VITE_GA_MEASUREMENT_ID=your_ga_measurement_id
```

### 3. Run Local Development Server

```bash
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

### 4. Build for Production

```bash
npm run build
```

---

## 🌐 Deploy to Netlify

1. Push your code to your GitHub repository.
2. Import the project into **[Netlify](https://www.netlify.com/)**.
3. Netlify will detect `netlify.toml` automatically:
   * **Build command**: `npm run build`
   * **Publish directory**: `dist`
   * **Functions directory**: `netlify/functions`
4. In your Netlify dashboard (*Site configuration > Environment variables*), add your `ILOVEPDF_PUBLIC_KEY` and `ILOVEPDF_SECRET_KEY`.
5. Click **Deploy Site**!

---

## 👨‍💻 Developer & Author

**Teshan Pamodya**
* 🌐 **Portfolio**: [https://teshan.click](https://teshan.click)
* 🐙 **GitHub**: [@teshan200](https://github.com/teshan200)
* 💼 **LinkedIn**: [Teshan Pamodya](https://www.linkedin.com/in/teshan-pamodya/)
* 📦 **Repository**: [https://github.com/teshan200/PDF-Tools](https://github.com/teshan200/PDF-Tools)

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute.
