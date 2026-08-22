# PDF Tools

A fast, modern, and free full-stack PDF utility web application with **9 essential tools** — built with React 19, Vite, Tailwind CSS v4, PDF.js, pdf-lib, and Netlify Serverless Functions.

Live App: [https://asypdftools.xyz/](https://asypdftools.xyz/)

Developed by **Teshan Pamodya** • [Website](https://teshan.click) • [GitHub](https://github.com/teshan200/)

---

## ✨ Features & Tools

| Tool | Description |
|---|---|
| ✏️ **Edit PDF** | Click any original text in the PDF to edit/replace paragraphs in place, whiteout unwanted content, insert images & digital signatures, and draw freehand notes. |
| 🔀 **Merge PDF** | Combine multiple PDF files into a single document with custom ordering. |
| ✂️ **Split PDF** | Extract page ranges, split by intervals (every N pages), or split into individual pages. |
| 🗜️ **Compress PDF** | Reduce PDF file size with Extreme, Recommended, or Low compression levels. |
| 📝 **PDF to Word** | Convert PDF documents into editable Microsoft Word (`.docx`) files. |
| 🖼️ **PDF to JPG** | Convert PDF pages into high-resolution JPG images packaged in a ZIP archive. |
| 🔄 **Rotate PDF** | Rotate pages 90°, 180°, or 270° with filters for all, even, or odd pages. |
| 🔒 **Protect PDF** | Encrypt and lock PDF files with AES password protection. |
| 🔓 **Unlock PDF** | Remove password restrictions and security locks from protected PDF files. |

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 8, TypeScript
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **In-Browser PDF Engine**: `pdf-lib`, `pdfjs-dist` (local Web Worker)
- **Backend / API**: Netlify Serverless Functions (TypeScript `.mts`)
- **Cloud PDF Processing**: `@ilovepdf/ilovepdf-nodejs`
- **Routing**: Lightweight hash-based client router
- **Deployment**: Netlify

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- An API Key pair (Public Key & Secret Key)

### 1. Clone & Install

```bash
git clone https://github.com/teshan200/pdf-tools.git
cd pdf-tools
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
ILOVEPDF_PUBLIC_KEY=your_public_key_here
ILOVEPDF_SECRET_KEY=your_secret_key_here
```

*(Refer to `.env.example` for the template)*

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Deploy to Netlify

1. Push your code to your GitHub repository.
2. Connect the repository to [Netlify](https://netlify.com).
3. Build settings are automatically detected from `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
4. Configure environment variables in Netlify site settings:
   - `ILOVEPDF_PUBLIC_KEY`
   - `ILOVEPDF_SECRET_KEY`
5. Deploy! 🎉

---

## 🔒 Security & Privacy

- All API keys and credentials are kept strictly server-side in serverless functions and never exposed to the client.
- In-browser editing (Text, Whiteout, Images, Drawing) executes locally using `pdf-lib` without sending document contents across the wire.
- Files processed through serverless endpoints are handled in-memory in real time over HTTPS and are never stored.

---

## 👨‍💻 Author

**Teshan Pamodya**
- Website: [teshan.click](https://teshan.click)
- GitHub: [@teshan200](https://github.com/teshan200/)

---

## 📜 License

MIT License — free to use and customize.
