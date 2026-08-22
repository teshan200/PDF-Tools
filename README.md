# PDF Tools

A free, full-stack PDF utility web application with 8 essential tools — built with React 19, Vite, Tailwind CSS v4, and Netlify Serverless Functions.

Developed by **Teshan Pamodya** • [Website](https://teshan.click) • [GitHub](https://github.com/teshan200/)

---

## ✨ Features

| Tool | Description |
|---|---|
| **Merge PDF** | Combine multiple PDFs into one document with custom ordering. |
| **Split PDF** | Split by page ranges, every N pages, or into individual pages. |
| **Compress PDF** | Reduce file size with Low, Recommended, or Extreme compression. |
| **PDF to Word** | Convert PDF documents to editable `.docx` Word files. |
| **PDF to JPG** | Convert PDF pages into high-quality JPG images (packaged in ZIP). |
| **Rotate PDF** | Rotate pages 90°, 180°, or 270° (all, even, or odd pages). |
| **Protect PDF** | Encrypt PDFs with 128-bit or 256-bit AES password protection. |
| **Unlock PDF** | Remove password restrictions from protected PDF files. |

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 8, TypeScript
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Backend / API**: Netlify Serverless Functions (TypeScript `.mts`)
- **Processing**: Cloud-based PDF Engine (`@ilovepdf/ilovepdf-nodejs`)
- **Routing**: Lightweight hash-based client-side router
- **Deployment**: Netlify

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- An API Key pair (Public & Secret Key)

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

1. Push your code to your Git repository.
2. Connect your repository to [Netlify](https://netlify.com).
3. Build settings are automatically detected from `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
4. Add your environment variables in Netlify:
   - `ILOVEPDF_PUBLIC_KEY`
   - `ILOVEPDF_SECRET_KEY`
5. Deploy! 🎉

---

## 🔒 Security

- All API credentials are kept strictly server-side in serverless functions and are never exposed to the client.
- Documents are processed in-memory in real time over HTTPS and are never permanently stored.

---

## 👨‍💻 Author

**Teshan Pamodya**
- Website: [teshan.click](https://teshan.click)
- GitHub: [@teshan200](https://github.com/teshan200/)

---

## 📜 License

MIT License — free to use and customize.
