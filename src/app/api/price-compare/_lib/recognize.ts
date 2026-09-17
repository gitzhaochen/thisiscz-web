import { z } from 'zod'

const DEEPSEEK_TIMEOUT_MS = 25_000
const MAX_IMAGE_BYTES = 4 * 1024 * 1024

const recognizeSchema = z.object({
  productName: z.string().trim().min(1).max(160),
  brand: z.string().trim().max(80).nullable().optional(),
  size: z.string().trim().max(40).nullable().optional(),
  barcode: z.string().trim().max(32).nullable().optional(),
  confidence: z.number().min(0).max(1),
})

export type RecognizeResult = z.infer<typeof recognizeSchema>

export class RecognizeError extends Error {
  readonly code: 'missing_api_key' | 'invalid_image' | 'timeout' | 'upstream_error' | 'invalid_response'

  constructor(code: RecognizeError['code']) {
    super(code)
    this.name = 'RecognizeError'
    this.code = code
  }
}

const SYSTEM_PROMPT = `You identify New Zealand supermarket grocery products from a photo (packaging, shelf label, or barcode).
Return one JSON object only:
{
  "productName": "Anchor Blue Top Standard Milk 2L",
  "brand": "Anchor",
  "size": "2L",
  "barcode": "9415492000018",
  "confidence": 0.92
}
Rules:
- productName should be a concise English search query suitable for Pak'nSAVE / Woolworths NZ.
- Prefer brand + product + size when visible.
- barcode null if not readable.
- confidence reflects how sure you are.`

function pickVisionModel() {
  const configured = process.env.DEEPSEEK_VISION_MODEL || process.env.DEEPSEEK_MODEL || 'deepseek-flash'
  if (configured.includes('vision') || configured === 'deepseek-flash' || configured.includes('v4')) {
    return configured
  }
  return 'deepseek-flash'
}

export async function recognizeProductFromImage(params: {
  base64: string
  mimeType: string
}): Promise<RecognizeResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new RecognizeError('missing_api_key')

  const mime = params.mimeType.startsWith('image/') ? params.mimeType : 'image/jpeg'
  const approxBytes = Math.floor((params.base64.length * 3) / 4)
  if (approxBytes > MAX_IMAGE_BYTES) throw new RecognizeError('invalid_image')

  const dataUrl = `data:${mime};base64,${params.base64}`

  let response: Response
  try {
    response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: pickVisionModel(),
        stream: false,
        temperature: 0,
        max_tokens: 512,
        thinking: { type: 'disabled' },
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identify the grocery product in this image for NZ supermarket price search.',
              },
              {
                type: 'image_url',
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(DEEPSEEK_TIMEOUT_MS),
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new RecognizeError('timeout')
    }
    throw new RecognizeError('upstream_error')
  }

  if (!response.ok) throw new RecognizeError('upstream_error')

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>
  }
  const content = payload.choices?.[0]?.message?.content
  if (!content) throw new RecognizeError('invalid_response')

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new RecognizeError('invalid_response')
  }

  const result = recognizeSchema.safeParse(parsed)
  if (!result.success) throw new RecognizeError('invalid_response')
  return result.data
}
