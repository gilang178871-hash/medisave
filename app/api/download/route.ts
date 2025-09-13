import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Use /tmp for Vercel (temporary files)
    const downloadsDir = '/tmp/downloads'
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true })
    }

    const outputTemplate = path.join(downloadsDir, "%(title)s-%(id)s.%(ext)s")
    const format = '137+140/136+140/135+140/18+140/bv*[height>=1080]+ba[ext=m4a]/bv*[height>=720]+ba[ext=m4a]/bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv+ba/best'

    console.log("[download] Incoming URL:", url)

    const args = [
      "--no-playlist",
      "-o",
      outputTemplate,
      "-f",
      format,
      "--merge-output-format",
      "mp4",
      "--restrict-filenames",
      "--no-part",
      "--no-progress",
      "--geo-bypass",
      "--concurrent-fragments",
      "1",
      "--retries",
      "3",
      "--fragment-retries",
      "3",
      "--extractor-args",
      "youtube:player_client=web",
      "--downloader",
      "native",
      "--add-header",
      "Referer:https://www.youtube.com/",
      "--add-header",
      "User-Agent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
      "--print",
      "after_move:filepath",
      "--print",
      "title",
      url,
    ]

    // Optional: cookies support for YouTube
    if (process.env.YTDLP_COOKIES && fs.existsSync(process.env.YTDLP_COOKIES)) {
      args.unshift(process.env.YTDLP_COOKIES)
      args.unshift("--cookies")
      console.log("[download] Using cookies file:", process.env.YTDLP_COOKIES)
    } else if (process.env.YTDLP_COOKIES_FROM_BROWSER) {
      args.unshift(process.env.YTDLP_COOKIES_FROM_BROWSER)
      args.unshift("--cookies-from-browser")
      console.log("[download] Using cookies from browser:", process.env.YTDLP_COOKIES_FROM_BROWSER)
    }

    console.log("[download] Spawning yt-dlp:", "yt-dlp", args.join(" "))

    const ytDlpPath = process.env.YTDLP_PATH || "yt-dlp"
    const child = spawn(ytDlpPath, args, { stdio: ["ignore", "pipe", "pipe"] })

    let stdoutBuf = ""
    let stderrBuf = ""
    let responded = false

    const finishWith = (statusCode: number, payload: any) => {
      if (responded) return
      responded = true
      return NextResponse.json(payload, { status: statusCode })
    }

    const timeoutMs = 4 * 60 * 1000 // 4 minutes
    const timer = setTimeout(() => {
      console.error("[download] Timeout reached. Killing yt-dlp process.")
      try { child.kill("SIGKILL") } catch {}
      finishWith(504, { success: false, error: "Download timeout" })
    }, timeoutMs)

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString()
      stdoutBuf += text
    })

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString()
      stderrBuf += text
    })

    child.on("error", (err) => {
      clearTimeout(timer)
      console.error("[download] Failed to spawn yt-dlp:", err.message)
      finishWith(500, { success: false, error: "Failed to start downloader" })
    })

    child.on("close", async (code) => {
      clearTimeout(timer)
      if (stdoutBuf.trim()) console.log("[yt-dlp stdout]\n" + stdoutBuf)
      if (stderrBuf.trim()) console.warn("[yt-dlp stderr]\n" + stderrBuf)

      if (code !== 0) {
        console.error("[download] yt-dlp exited with code", code)
        // Try stream fallback
        try {
          const urlArgs = [
            "--no-playlist",
            "-f",
            format,
            "--geo-bypass",
            "--concurrent-fragments",
            "1",
            "--retries",
            "3",
            "--fragment-retries",
            "3",
            "--extractor-args",
            "youtube:player_client=web",
            "--get-url",
            url,
          ]
          if (process.env.YTDLP_COOKIES && fs.existsSync(process.env.YTDLP_COOKIES)) {
            urlArgs.unshift(process.env.YTDLP_COOKIES)
            urlArgs.unshift("--cookies")
          } else if (process.env.YTDLP_COOKIES_FROM_BROWSER) {
            urlArgs.unshift(process.env.YTDLP_COOKIES_FROM_BROWSER)
            urlArgs.unshift("--cookies-from-browser")
          }

          const streamUrl = await new Promise((resolve, reject) => {
            const p = spawn(ytDlpPath, urlArgs, { stdio: ["ignore", "pipe", "pipe"] })
            let out = ""
            let err = ""
            const to = setTimeout(() => { try { p.kill("SIGKILL") } catch {}; reject(new Error("stream url timeout")) }, 120000)
            p.stdout.on("data", (c) => (out += c.toString()))
            p.stderr.on("data", (c) => (err += c.toString()))
            p.on("close", (c) => {
              clearTimeout(to)
              if (c === 0) {
                const u = out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)[0]
                return u ? resolve(u) : reject(new Error("no url in output"))
              }
              reject(new Error(err || `exit ${c}`))
            })
          })
          const inferredTitle = stdoutBuf.split(/\r?\n/).map((l)=>l.trim()).filter(Boolean)[0] || "Video"
          console.log("[download] Returning stream URL due to missing file.")
          return finishWith(200, { success: true, title: inferredTitle, fileUrl: streamUrl, isStream: true })
        } catch (e) {
          console.error("[download] Stream fallback failed:", e?.message || e)
        }
        return finishWith(500, { success: false, error: "Download failed", details: stderrBuf.slice(0, 4000) })
      }

      const lines = stdoutBuf
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)

      let title = ""
      let finalPath = ""
      
      for (const line of lines) {
        if (line.startsWith("/") && line.includes(".mp4")) {
          finalPath = line
        } else if (line && !line.startsWith("/") && !line.includes("http") && !line.includes("yt-dlp") && !line.includes("WARNING") && !line.includes("ERROR") && !line.includes("Downloading") && !line.includes("Destination")) {
          if (!title) title = line
        }
      }
      
      console.log("[download] All stdout lines:", lines)
      console.log("[download] Parsed title:", title)
      console.log("[download] Parsed filepath:", finalPath)

      if (!finalPath || !fs.existsSync(finalPath)) {
        console.warn("[download] No file detected from yt-dlp stdout. Trying stream fallback.")
        // Stream fallback logic here...
        return finishWith(500, { success: false, error: "Could not locate downloaded file" })
      }

      const publicName = path.basename(finalPath)
      const fileUrl = `${request.nextUrl.origin}/api/downloads/${encodeURIComponent(publicName)}`
      console.log("[download] Success:", publicName)
      console.log("[download] fileUrl:", fileUrl)
      const cleanTitle = title || path.parse(publicName).name.replace(/-[^-]+$/, '')
      return finishWith(200, { success: true, title: cleanTitle, fileUrl })
    })
  } catch (e) {
    console.error('[download] Handler error:', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
