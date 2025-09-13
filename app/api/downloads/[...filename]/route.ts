import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string[] } }
) {
  try {
    const filename = params.filename.join('/')
    const downloadsDir = '/tmp/downloads'
    const filePath = path.join(downloadsDir, filename)
    
    // Security check - prevent directory traversal
    if (!filePath.startsWith(downloadsDir)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
    const fileBuffer = fs.readFileSync(filePath)
    const stats = fs.statSync(filePath)
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
