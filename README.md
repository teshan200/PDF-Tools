# Easy PDF Tools

A fast, modern, privacy-first full-stack PDF utility web application with **10 essential tools** — built with React 19, Vite, Tailwind CSS v4, PDF.js, pdf-lib, fflate, and Netlify Serverless Functions.

🌐 **Live Application**: [https://easypdftools.xyz/](https://easypdftools.xyz/)  
👨‍💻 **Author**: **Teshan Pamodya** • [Website](https://teshan.click) • [GitHub](https://github.com/teshan200/) • [LinkedIn](https://www.linkedin.com/in/teshan-pamodya/)

---

## ✨ Features & Tools

### 🛡️ 100% Client-Side Tools (0 Bytes Uploaded — Private & Local)
| Tool | Description | Engine |
|---|---|---|
| **Sign PDF** | Draw, type, or extract transparent signatures from photos. AES-256 encrypted local storage & PIN lock. | `pdf-lib` + Web Crypto |
| **Edit PDF** | Click original text to edit in-place, whiteout unwanted content, insert images, and draw freehand annotations. | `pdfjs-dist` + `pdf-lib` |
| **Merge PDF** | Combine multiple PDF files into a single document with custom drag-and-drop ordering. | `pdf-lib` |
| **Split PDF** | Extract custom page ranges, split by interval (every N pages), or export individual pages in a ZIP archive. | `pdf-lib` + `fflate` |
| **Rotate PDF** | Rotate pages 90°, 180°, or 270° with filters for all, even, or odd pages. | `pdf-lib` |
| **PDF to JPG** | Render PDF pages into high-resolution JPG images packaged in a ZIP archive. | `pdfjs-dist` + Canvas + `fflate` |

### ⚡ Cloud-Powered Conversion Tools
| Tool | Description | Engine |
|---|---|---|
| **PDF to Word** | Convert complex PDF documents into editable Microsoft Word (`.docx`) files with OCR support. | iLovePDF Cloud Engine |
| **Compress PDF** | Reduce PDF file size with Extreme, Recommended, or Low compression profiles. | iLovePDF Cloud Engine |
| **Protect PDF** | Encrypt and lock PDF files with AES password protection. | iLovePDF Cloud Engine |
| **Unlock PDF** | Remove password restrictions and security locks from protected PDF files. | iLovePDF Cloud Engine |

---

## 🌓 Dark & Light Mode Theme Support
- **Automatic System Preference**: Automatically detects and matches your operating system theme (Dark or Light).
- **Manual Toggle**: Sun / Moon button in the navigation bar with instant `localStorage` persistence.
- **Zero Flash**: Inlined `<head>` theme bootstrap script ensures instant render without white screen flashing.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 8, TypeScript
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Client-Side PDF Engine**: `pdf-lib`, `pdfjs-dist` (local Web Worker), `fflate` (in-browser ZIP)
- **Backend / API**: Netlify Serverless Functions (TypeScript `.mts`)
- **Cloud Document Engine**: `@ilovepdf/ilovepdf-nodejs`
- **Routing**: Lightweight hash-based client router
- **Deployment & Hosting**: Netlify

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- *(Optional for cloud tools)*: [iLovePDF Developer API Keys](https://developer.ilovepdf.com/)

### 1. Clone & Install

```bash
git clone https://github.com/teshan200/PDF-Tools.git
cd PDF-Tools
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
ILOVEPDF_PUBLIC_KEY=your_public_key_here
ILOVEPDF_SECRET_KEY=your_secret_key_here
VITE_GA_MEASUREMENT_ID=your_ga_measurement_id_here
```

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Deploy to Netlify

1. Push your repository to GitHub.
2. Connect your repository to **Netlify**.
3. Build settings from `netlify.toml` will configure automatically:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
4. Set environment variables in your Netlify site dashboard:
   - `ILOVEPDF_PUBLIC_KEY`
   - `ILOVEPDF_SECRET_KEY`
5. Deploy!

---

## 🔒 Security & Privacy Architecture

- **Client-Side Processing**: Core tools (Sign, Edit, Merge, Split, Rotate, PDF to JPG) run 100% locally in browser memory. Documents never leave your computer.
- **Encrypted Signature Storage**: Saved signatures are encrypted with AES-GCM (256-bit) using device-generated Web Crypto keys.
- **Zero Server Retention**: Cloud conversion requests are processed in real-time memory over HTTPS and auto-deleted immediately after completion.

---

## 👨‍💻 Author

**Teshan Pamodya**
- Website: [teshan.click](https://teshan.click)
- GitHub: [@teshan200](https://github.com/teshan200/)
- LinkedIn: [Teshan Pamodya](https://www.linkedin.com/in/teshan-pamodya/)

---

## 📜 License

MIT License — free to use and open-source.
