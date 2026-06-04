import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { message } = await req.json()

  const deepseekRes = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY!}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      stream: false,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    }),
  })

  if (!deepseekRes.ok) {
    return NextResponse.json(
      { error: 'Failed to fetch from DeepSeek API' },
      { status: 500 },
    )
  }

  const result = await deepseekRes.json()
  const text = result.choices?.[0]?.message?.content || ''

  return NextResponse.json({ text })
}
