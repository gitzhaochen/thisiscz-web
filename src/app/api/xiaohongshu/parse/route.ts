import { apiFetchServer } from '@/lib/apiFetch'
import { extractParsedCarFields } from './_lib/car-fields'
import { extractDateText, extractDetailTitle, extractImages, extractMeta, removeHashtagTopics, sanitizeText } from './_lib/html'
import { parseOriginalPostPublishedAt } from './_lib/post-date'
import { NextRequest, NextResponse } from 'next/server'

const ACCEPTED_HOSTS = ['xiaohongshu.com', 'xhslink.com', 'xhscdn.com']

const getTitle = (html: string) => {
  return (
    sanitizeText(extractDetailTitle(html)) ||
    sanitizeText(extractMeta(html, 'og:title')) ||
    sanitizeText(extractMeta(html, 'twitter:title')) ||
    sanitizeText(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '')
  )
}

const getContent = (html: string) => {
  return removeHashtagTopics(
    sanitizeText(extractMeta(html, 'og:description')) ||
      sanitizeText(extractMeta(html, 'description')) ||
      sanitizeText(extractMeta(html, 'twitter:description')),
  )
}

export async function GET(request: NextRequest) {
  try {
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

    const allowed = ACCEPTED_HOSTS.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))
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
      return NextResponse.json({ error: `fetch failed with status ${response.status}` }, { status: 502 })
    }

    const html = await response.text()
    const finalUrl = response.url || parsed.toString()
    const title = getTitle(html)
    const content = getContent(html)
    const dateText = sanitizeText(extractDateText(html))
    const imageUrls = extractImages(html)
    const parsedFields = {
      ...extractParsedCarFields(title, content),
      originalPostPublishedAt: parseOriginalPostPublishedAt(dateText),
    }

    return NextResponse.json({
      sourceUrl: finalUrl,
      postTitle: title,
      postContent: content,
      imageUrls,
      parsedFields,
      parseSource: 'regex',
    })
  } catch (error) {
    console.error('Parse xiaohongshu error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
