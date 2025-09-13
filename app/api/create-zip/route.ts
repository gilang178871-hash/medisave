import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { videoFiles } = await request.json()
    
    if (!videoFiles || !Array.isArray(videoFiles) || videoFiles.length === 0) {
      return NextResponse.json({ success: false, error: 'No video files specified' }, { status: 400 })
    }

    const downloadsDir = '/tmp/downloads'
    const medisaveFolder = path.join(downloadsDir, 'medisave-downloader')
    
    if (!fs.existsSync(medisaveFolder)) {
      fs.mkdirSync(medisaveFolder, { recursive: true })
    }

    const zipName = `medisave-downloader-${Date.now()}.zip`
    const zipPath = path.join(medisaveFolder, zipName)
    
    // Filter only existing files
    const existingFiles = videoFiles.filter(filename => {
      const filePath = path.join(downloadsDir, filename)
      return fs.existsSync(filePath)
    })

    if (existingFiles.length === 0) {
      return NextResponse.json({ success: false, error: 'No existing video files found' }, { status: 404 })
    }

    // Create zip using system zip command
    const fileList = existingFiles.map(f => `"${path.join(downloadsDir, f)}"`).join(' ')
    const zipCommand = `cd "${medisaveFolder}" && zip -r "${zipName}" ${fileList}`
    
    return new Promise((resolve) => {
      exec(zipCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('[zip] Error:', error)
          resolve(NextResponse.json({ success: false, error: 'Failed to create zip file' }, { status: 500 }))
        } else {
          const zipUrl = `${request.nextUrl.origin}/api/downloads/medisave-downloader/${encodeURIComponent(zipName)}`
          resolve(NextResponse.json({ success: true, zipUrl, filename: zipName }))
        }
      })
    })
  } catch (e) {
    console.error('[zip] Error:', e)
    return NextResponse.json({ success: false, error: 'Failed to create zip file' }, { status: 500 })
  }
}
