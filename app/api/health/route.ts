import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    ok: true, 
    port: process.env.PORT || 3000,
    downloadsDir: '/tmp/downloads' // Vercel uses /tmp for temporary files
  })
}
