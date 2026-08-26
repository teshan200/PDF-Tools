/**
 * SEO & Structured Data Manager for Easy PDF Tools (easypdftools.xyz)
 * Based on Google Search Central guidelines, Schema.org standards & Lighthouse SEO best practices.
 */

interface RouteSEO {
  title: string
  description: string
  keywords: string
  canonicalPath: string
  toolName?: string
  faq?: { question: string; answer: string }[]
}

const BASE_URL = 'https://easypdftools.xyz'

const SEO_DATA: Record<string, RouteSEO> = {
  '/': {
    title: 'Easy PDF Tools — 100% Free Online PDF Editor, Signer & Converter',
    description: 'Free online PDF suite. Edit PDF text, sign documents, merge, split, compress, and convert PDF to Word & JPG. 100% private in-browser tools with zero file limits.',
    keywords: 'easy pdf tools, free pdf editor, sign pdf online, edit pdf text, merge pdf, split pdf, compress pdf, convert pdf to word, pdf to jpg, rotate pdf, protect pdf, unlock pdf',
    canonicalPath: '/',
    faq: [
      {
        question: 'Is Easy PDF Tools completely free to use?',
        answer: 'Yes, Easy PDF Tools is 100% free with no file size limits, no daily restrictions, and no registration or credit card required.',
      },
      {
        question: 'Are my PDF documents uploaded to remote servers?',
        answer: 'Core tools like Sign PDF, Edit PDF, Merge, Split, Rotate, and PDF to JPG run 100% locally inside your browser memory with zero bytes uploaded. Conversion tools process files in ephemeral RAM and delete them immediately.',
      },
      {
        question: 'Can I edit existing text in a PDF document?',
        answer: 'Yes! The Edit PDF tool allows you to click on existing text in your document and change or replace it directly in your browser.',
      },
    ],
  },
  '/edit': {
    title: 'Edit PDF Online Free — Change Existing Text, Whiteout & Annotate | Easy PDF Tools',
    description: 'Free in-browser PDF editor. Click to edit original PDF text directly, erase with whiteout, insert images & signatures, and draw notes. 100% local privacy.',
    keywords: 'edit pdf text, change text in pdf, online pdf editor, free pdf editor, whiteout pdf, annotate pdf, add text to pdf',
    canonicalPath: '/edit',
    toolName: 'Edit PDF',
    faq: [
      {
        question: 'How do I edit original text in a PDF?',
        answer: 'Upload your PDF, click on any text block on the page, and start typing to change or replace paragraphs directly.',
      },
      {
        question: 'Can I cover up sensitive text in a PDF?',
        answer: 'Yes, use the Whiteout tool to place clean eraser boxes over private text or numbers.',
      },
    ],
  },
  '/sign': {
    title: 'Sign PDF Online Free — Draw, Type or Upload Digital Signatures | Easy PDF Tools',
    description: 'Sign PDF contracts online for free. Draw, type, or extract ink signatures from photos. AES-256 encrypted local storage, PIN lock & cryptographic audit trail.',
    keywords: 'sign pdf, digital signature, e-sign pdf free, sign document online, electronic signature, sign contract, extract signature from photo',
    canonicalPath: '/sign',
    toolName: 'Sign PDF',
    faq: [
      {
        question: 'How does photo signature extraction work?',
        answer: 'Upload a picture of your signature on paper. The tool automatically removes the paper background, corrects shadows, and converts it into transparent digital ink.',
      },
      {
        question: 'Are my saved signatures secure?',
        answer: 'Yes. Saved signatures are encrypted on your local device using AES-256 encryption and can be locked with a PIN code.',
      },
    ],
  },
  '/merge': {
    title: 'Merge PDF Online Free — Combine Multiple PDF Files Instantly | Easy PDF Tools',
    description: 'Combine and merge PDF files into one document in seconds. Reorder pages with drag and drop. 100% private client-side processing with zero file size limits.',
    keywords: 'merge pdf, combine pdf, join pdf files, merge pdf online free, merge pdfs into one, collate pdf',
    canonicalPath: '/merge',
    toolName: 'Merge PDF',
  },
  '/split': {
    title: 'Split PDF Online Free — Extract Pages & Separate PDF Files | Easy PDF Tools',
    description: 'Split PDF files by custom page ranges, intervals, or extract individual pages into a ZIP archive. Fast, free, and runs 100% in your browser.',
    keywords: 'split pdf, extract pages from pdf, separate pdf pages, split pdf into single pages, split pdf by range',
    canonicalPath: '/split',
    toolName: 'Split PDF',
  },
  '/compress': {
    title: 'Compress PDF Online Free — Reduce PDF File Size Without Quality Loss | Easy PDF Tools',
    description: 'Reduce PDF file size online with Extreme, Recommended, or Low compression profiles. Fast, secure, and preserves high document resolution.',
    keywords: 'compress pdf, reduce pdf size, shrink pdf online free, make pdf smaller, optimize pdf file',
    canonicalPath: '/compress',
    toolName: 'Compress PDF',
  },
  '/word': {
    title: 'PDF to Word Converter Free — Convert PDF to Editable DOCX Online | Easy PDF Tools',
    description: 'Convert PDF documents to editable Microsoft Word (.docx) files accurately. Text, tables, and layouts are preserved. 100% free with instant download.',
    keywords: 'pdf to word, convert pdf to docx, pdf to word converter free, editable word from pdf, pdf to doc',
    canonicalPath: '/word',
    toolName: 'PDF to Word',
  },
  '/jpg': {
    title: 'PDF to JPG Converter Free — Extract High-Resolution Images | Easy PDF Tools',
    description: 'Convert PDF pages to high-quality JPG images with custom DPI settings. Download as high-res images or a packaged ZIP file. Runs 100% client-side.',
    keywords: 'pdf to jpg, convert pdf to image, pdf to jpeg, extract images from pdf, pdf to picture converter',
    canonicalPath: '/jpg',
    toolName: 'PDF to JPG',
  },
  '/rotate': {
    title: 'Rotate PDF Pages Online Free — 90, 180 or 270 Degrees | Easy PDF Tools',
    description: 'Rotate PDF pages permanently online. Rotate all pages, even pages, or odd pages clockwise or counter-clockwise in seconds. 100% local in-browser.',
    keywords: 'rotate pdf, flip pdf, turn pdf pages, rotate pdf online free, change pdf orientation',
    canonicalPath: '/rotate',
    toolName: 'Rotate PDF',
  },
  '/protect': {
    title: 'Password Protect PDF Online Free — Secure AES Encryption | Easy PDF Tools',
    description: 'Add 128-bit or 256-bit AES password protection to PDF files. Prevent unauthorized viewing, copying, or printing. Fast and secure.',
    keywords: 'protect pdf, password protect pdf, encrypt pdf online, lock pdf with password, secure pdf',
    canonicalPath: '/protect',
    toolName: 'Protect PDF',
  },
  '/unlock': {
    title: 'Unlock PDF Online Free — Remove Password & Restrictions | Easy PDF Tools',
    description: 'Remove password security, editing locks, and printing restrictions from protected PDF documents. Fast, secure, and free.',
    keywords: 'unlock pdf, remove pdf password, decrypt pdf online, unlock protected pdf, remove pdf security',
    canonicalPath: '/unlock',
    toolName: 'Unlock PDF',
  },
  '/about': {
    title: 'About Easy PDF Tools — Open Source, Private & Free PDF Suite | easypdftools.xyz',
    description: 'Learn about Easy PDF Tools and developer Teshan Pamodya. A free, privacy-first PDF utility suite engineered with WebAssembly and client-side cryptography.',
    keywords: 'about easy pdf tools, Teshan Pamodya, teshan.click, open source pdf tools, client side pdf editor',
    canonicalPath: '/about',
  },
  '/privacy': {
    title: 'Privacy Policy — Zero-Knowledge & Local Browser Processing | Easy PDF Tools',
    description: 'Easy PDF Tools privacy policy. Learn how our zero-knowledge architecture processes documents locally in browser RAM without server uploads.',
    keywords: 'privacy policy easy pdf tools, zero knowledge pdf, safe pdf tools, client side privacy',
    canonicalPath: '/privacy',
  },
  '/terms': {
    title: 'Terms of Service — Open Source & Free Use Agreement | Easy PDF Tools',
    description: 'Terms of service and open-source usage policies for Easy PDF Tools (easypdftools.xyz). Free for personal and commercial document workflows.',
    keywords: 'terms of service, easy pdf tools terms, open source license',
    canonicalPath: '/terms',
  },
  '/contact': {
    title: 'Contact Support & Feedback — Easy PDF Tools | easypdftools.xyz',
    description: 'Contact developer Teshan Pamodya for feature requests, feedback, or support with Easy PDF Tools. Fast response guaranteed.',
    keywords: 'contact easy pdf tools, report bug, feedback pdf tools, Teshan Pamodya contact',
    canonicalPath: '/contact',
  },
}

function setMetaTag(attrName: 'name' | 'property', attrValue: string, content: string) {
  let element = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attrName, attrValue)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function setCanonical(href: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

export function updateSEOForRoute(path: string) {
  const normPath = path.startsWith('/') ? path : `/${path}`
  const data = SEO_DATA[normPath] || SEO_DATA['/']

  // Update Page Title
  document.title = data.title

  // Update Meta Description & Keywords
  setMetaTag('name', 'description', data.description)
  setMetaTag('name', 'keywords', data.keywords)
  setMetaTag('name', 'title', data.title)

  // Update Canonical
  const fullCanonical = `${BASE_URL}${data.canonicalPath === '/' ? '' : data.canonicalPath}`
  setCanonical(fullCanonical)

  // Update Open Graph (Facebook / LinkedIn)
  setMetaTag('property', 'og:title', data.title)
  setMetaTag('property', 'og:description', data.description)
  setMetaTag('property', 'og:url', fullCanonical)

  // Update Twitter Cards
  setMetaTag('name', 'twitter:title', data.title)
  setMetaTag('name', 'twitter:description', data.description)
  setMetaTag('name', 'twitter:url', fullCanonical)

  // Dynamic JSON-LD Structured Data
  updateStructuredData(data, fullCanonical)
}

function updateStructuredData(data: RouteSEO, currentUrl: string) {
  const existingScript = document.getElementById('dynamic-seo-jsonld')
  if (existingScript) {
    existingScript.remove()
  }

  const jsonLdData: any[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: data.toolName ? `${data.toolName} — Easy PDF Tools` : 'Easy PDF Tools',
      url: currentUrl,
      description: data.description,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      author: {
        '@type': 'Person',
        name: 'Teshan Pamodya',
        url: 'https://teshan.click',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: BASE_URL,
        },
        ...(data.toolName
          ? [
              {
                '@type': 'ListItem',
                position: 2,
                name: data.toolName,
                item: currentUrl,
              },
            ]
          : []),
      ],
    },
  ]

  if (data.faq && data.faq.length > 0) {
    jsonLdData.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: data.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    })
  }

  const script = document.createElement('script')
  script.id = 'dynamic-seo-jsonld'
  script.type = 'application/ld+json'
  script.text = JSON.stringify(jsonLdData)
  document.head.appendChild(script)
}
