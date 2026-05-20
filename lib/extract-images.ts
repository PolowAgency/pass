// Extraction d'images depuis PDF et DOCX
// Retourne un tableau de base64 JPEG (max 6 images les plus représentatives)

export async function extractImagesFromPdf(buffer: Buffer): Promise<string[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createCanvas } = require('canvas') as { createCanvas: (w: number, h: number) => { getContext: (t: string) => unknown; toDataURL: (t: string, q: number) => string } }
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs').catch(() => null)
      ?? await import('pdfjs-dist').catch(() => null)
    if (!pdfjsLib || !createCanvas) return []

    const pdf = await (pdfjsLib as unknown as { getDocument: (opts: unknown) => { promise: Promise<{ numPages: number; getPage: (n: number) => Promise<unknown> }> } })
      .getDocument({ data: new Uint8Array(buffer) }).promise

    const numPages = Math.min(pdf.numPages, 8) // max 8 pages
    const images: string[] = []

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum) as {
          getViewport: (opts: { scale: number }) => { width: number; height: number }
          render: (opts: { canvasContext: unknown; viewport: unknown }) => { promise: Promise<void> }
        }
        const viewport = page.getViewport({ scale: 1.2 })
        const canvas = createCanvas(viewport.width, viewport.height)
        const ctx = canvas.getContext('2d')

        await page.render({ canvasContext: ctx, viewport }).promise
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
        const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '')
        if (base64.length > 1000) images.push(base64) // ignore pages vides
      } catch {
        // page illisible, on saute
      }
    }

    return images.slice(0, 6)
  } catch {
    return []
  }
}

export async function extractImagesFromDocx(buffer: Buffer): Promise<string[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require('mammoth') as {
      convertToHtml: (opts: { buffer: Buffer }, config: unknown) => Promise<{ value: string }>
      images?: { imgElement: (fn: (img: { read: (enc: string) => Promise<string> }) => Promise<{ src: string }>) => unknown }
    }

    const images: string[] = []

    const result = await mammoth.convertToHtml({ buffer }, {
      convertImage: mammoth.images?.imgElement
        ? mammoth.images.imgElement((img: { read: (enc: string) => Promise<string> }) =>
            img.read('base64').then((b64: string) => ({ src: 'data:image/png;base64,' + b64 }))
          )
        : undefined,
    })

    // Extraire les src base64 des images dans le HTML
    const matches = result.value.matchAll(/src="data:image\/[^;]+;base64,([^"]+)"/g)
    for (const match of matches) {
      if (match[1] && match[1].length > 500) {
        images.push(match[1])
        if (images.length >= 6) break
      }
    }

    return images
  } catch {
    return []
  }
}

// Envoie une image à Groq vision et retourne la description
export async function describeImageWithGroq(
  base64: string,
  lang: 'fr' | 'en',
  groq: import('groq-sdk').default
): Promise<string> {
  try {
    const resp = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
          {
            type: 'text',
            text: lang === 'en'
              ? 'Describe this image from a course: what does it show? What anatomical structures, mechanisms, or concepts are illustrated? Be precise and educational. 3-4 sentences max.'
              : 'Décris cette image de cours : que montre-t-elle ? Quelles structures anatomiques, mécanismes ou concepts sont illustrés ? Sois précis et pédagogique. 3-4 phrases max.'
          }
        ]
      }]
    })
    return resp.choices[0]?.message?.content?.trim() ?? ''
  } catch {
    return ''
  }
}
