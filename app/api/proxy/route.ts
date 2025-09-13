import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const target = request.nextUrl.searchParams.get('target')
    if (!target || typeof target !== 'string' || !/^https?:\/\//i.test(target)) {
      return NextResponse.json({ success: false, error: 'Invalid target url' }, { status: 400 })
    }

    const parsed = (() => { try { return new URL(target) } catch { return null } })()
    const urlHost = parsed ? parsed.hostname : ''

    const defaultUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
    const isTikTok = urlHost.includes('tiktok')
    const inferredReferer = isTikTok ? 'https://www.tiktok.com/' : 'https://www.youtube.com/'

    const forwardHeaders = {
      'User-Agent': defaultUA,
      'Referer': inferredReferer,
      'Origin': isTikTok ? 'https://www.tiktok.com' : 'https://www.youtube.com',
      'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'identity',
      'Connection': 'keep-alive',
      'Host': urlHost,
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-Mode': 'no-cors',
      'Sec-Fetch-Dest': 'video',
    }
    
    if (request.headers.get('range')) {
      forwardHeaders['Range'] = request.headers.get('range')!
    } else {
      forwardHeaders['Range'] = 'bytes=0-'
    }
    
    if (isTikTok && request.headers.get('cookie')) {
      forwardHeaders['Cookie'] = request.headers.get('cookie')!
    }

    const upstream = await fetch(target, { headers: forwardHeaders, redirect: 'follow' })
    if (!upstream.ok && upstream.status !== 206) {
      const errText = await upstream.text().catch(() => '')
      console.warn('[proxy] upstream error', upstream.status, urlHost, errText?.slice(0, 500) || '')
      return new NextResponse(errText || `Upstream error (${upstream.status}) from ${urlHost}`, {
        status: upstream.status,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      })
    }

    const response = new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'video/mp4',
        'Content-Length': upstream.headers.get('content-length') || '',
        'Accept-Ranges': upstream.headers.get('accept-ranges') || '',
        'Content-Range': upstream.headers.get('content-range') || '',
        'Cache-Control': 'no-store',
        'Content-Disposition': upstream.headers.get('content-disposition') || `attachment; filename="video_${Date.now()}.mp4"`
      }
    })

    return response
  } catch (e) {
    console.error('[proxy] error:', e)
    return NextResponse.json({ error: 'Bad gateway' }, { status: 502 })
  }
}
