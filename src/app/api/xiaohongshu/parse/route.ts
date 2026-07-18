import { apiFetchServer } from '@/lib/apiFetch'
import { NextRequest, NextResponse } from 'next/server'

const ACCEPTED_HOSTS = ['xiaohongshu.com', 'xhslink.com', 'xhscdn.com']

const decodeHtmlEntities = (input: string) => {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

const extractMeta = (html: string, key: string) => {
  const reg = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i',
  )
  return reg.exec(html)?.[1]?.trim() || ''
}

const sanitizeText = (value: string) => decodeHtmlEntities(value).replace(/\s+/g, ' ').trim()

const extractImages = (html: string) => {
  const matches = [...html.matchAll(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/gi)]
  const urls = matches
    .map((match) => sanitizeText(match[1] || ''))
    .filter(Boolean)
    .slice(0, 12)

  return [...new Set(urls)]
}

export async function GET(request: NextRequest) {
  try {
    // 限制为 admin，避免被滥用成开放抓取代理
    const currentUser = await apiFetchServer('/api/users/me')
    const role = String(currentUser?.role || '').toLowerCase()
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const targetUrl = request.nextUrl.searchParams.get('url')?.trim()
    if (!targetUrl) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 })
    }

    let parsed: URL
    try {
      parsed = new URL(targetUrl)
    } catch {
      return NextResponse.json({ error: 'invalid url' }, { status: 400 })
    }

    const allowed = ACCEPTED_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
    )
    if (!allowed) {
      return NextResponse.json({ error: 'unsupported host' }, { status: 400 })
    }

    const response = await fetch(parsed.toString(), {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `fetch failed with status ${response.status}` },
        { status: 502 },
      )
    }

    const html = await response.text()
    const finalUrl = response.url || parsed.toString()

    const title =
      sanitizeText(extractMeta(html, 'og:title')) ||
      sanitizeText(extractMeta(html, 'twitter:title')) ||
      sanitizeText(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '')

    const content =
      sanitizeText(extractMeta(html, 'og:description')) ||
      sanitizeText(extractMeta(html, 'description')) ||
      sanitizeText(extractMeta(html, 'twitter:description'))

    const imageUrls = extractImages(html)

    return NextResponse.json({
      sourceUrl: finalUrl,
      postTitle: title,
      postContent: content,
      imageUrls,
    })
  } catch (error) {
    console.error('Parse xiaohongshu error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
