"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Download, Link, Loader2, CheckCircle, XCircle } from "lucide-react"

interface DownloadResult {
  id: string
  url: string
  title: string
  status: "success" | "failed" | "processing"
  error?: string
  fileUrl?: string
}

export default function MediSavePage() {
  const [urls, setUrls] = useState("")
  const [results, setResults] = useState<DownloadResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentProgress, setCurrentProgress] = useState(0)
  const [totalUrls, setTotalUrls] = useState(0)
  const [currentProcessingUrl, setCurrentProcessingUrl] = useState("")

  const processUrls = async () => {
    const urlList = urls
      .split("\n")
      .filter((url) => url.trim())
      .slice(0, 100)
    if (urlList.length === 0) return

    setIsProcessing(true)
    setResults([])
    setCurrentProgress(0)
    setTotalUrls(urlList.length)
    setCurrentProcessingUrl("")

    const newResults: DownloadResult[] = []

    for (let i = 0; i < urlList.length; i++) {
      const url = urlList[i].trim()
      const id = `video-${i + 1}`

      setCurrentProcessingUrl(url)
      setCurrentProgress(i + 1)

      try {
        const response = await fetch("/api/download", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
          cache: "no-store",
          body: JSON.stringify({ url }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          const finalUrl = data.isStream
            ? `/api/proxy?target=${encodeURIComponent(data.fileUrl)}`
            : data.fileUrl
          newResults.push({
            id,
            url,
            title: data.title || `Video ${i + 1}`,
            status: "success",
            fileUrl: finalUrl,
          })
        } else {
          newResults.push({
            id,
            url,
            title: `Video ${i + 1}`,
            status: "failed",
            error: data.error || "Unknown error",
          })
        }
      } catch (err: any) {
        newResults.push({
          id,
          url,
          title: `Video ${i + 1}`,
          status: "failed",
          error: err.message || "Network error",
        })
      }

      setResults([...newResults])
    }

    setCurrentProcessingUrl("")
    setIsProcessing(false)
  }

  const downloadSingle = (result: DownloadResult) => {
    if (!result.fileUrl) return
    const link = document.createElement("a")
    link.href = result.fileUrl
    // Ensure filename has .mp4 extension
    const filename = result.title.endsWith('.mp4') ? result.title : `${result.title}.mp4`
    link.download = filename
    link.click()
  }

  const previewVideo = (result: DownloadResult) => {
    if (!result.fileUrl) return
    window.open(result.fileUrl, '_blank')
  }

  const downloadAll = async () => {
    const successfulResults = results.filter((r) => r.status === "success" && r.fileUrl)
    if (successfulResults.length === 0) return
    
    try {
      // Extract filenames from successful results
      const videoFiles = successfulResults.map(result => {
        // Extract filename from fileUrl
        if (!result.fileUrl) return null
        try {
          const url = new URL(result.fileUrl)
          const pathname = url.pathname
          return pathname.split('/').pop() || result.title + '.mp4'
        } catch {
          return result.title + '.mp4'
        }
      }).filter(Boolean) as string[]
      
      // Create ZIP file with only current session videos
      const response = await fetch("/api/create-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoFiles })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const link = document.createElement("a")
          link.href = data.zipUrl
          link.download = data.filename
          link.click()
        }
      } else {
        // Fallback to individual downloads
        for (let i = 0; i < successfulResults.length; i++) {
          downloadSingle(successfulResults[i])
          if (i < successfulResults.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }
      }
    } catch (error) {
      console.error('ZIP creation failed, falling back to individual downloads:', error)
      // Fallback to individual downloads
      for (let i = 0; i < successfulResults.length; i++) {
        downloadSingle(successfulResults[i])
        if (i < successfulResults.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#193c76] via-[#2d5aa0] to-[#4a90e2]">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="font-heading text-6xl font-bold text-white mb-4 text-balance">MediSave</h1>
          <p className="text-white/80 text-lg mb-2">made by creator team medtools</p>
          <p className="text-white text-xl font-medium text-balance">
            MediSave makes saving videos effortless — clean, quick, reliable.
          </p>
        </div>

        {/* Input Section */}
        <Card className="max-w-4xl mx-auto p-8 bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl">
          <div className="space-y-6">
            <div className="relative">
              <Link className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
              <Textarea
                placeholder="Paste your video links here (one per line, max 100 links)..."
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                className="pl-12 min-h-32 text-base rounded-xl border-2 focus:border-primary resize-none"
                disabled={isProcessing}
              />
            </div>

            <Button
              onClick={processUrls}
              disabled={isProcessing || !urls.trim()}
              className="w-full h-12 text-lg font-medium rounded-xl bg-gradient-to-r from-[#193c76] to-[#4a90e2] hover:from-[#2d5aa0] hover:to-[#5ba0f2] shadow-lg transition-all duration-300"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing Videos...
                </>
              ) : (
                "Process Videos"
              )}
            </Button>
          </div>
        </Card>

        {isProcessing && (
          <div className="max-w-4xl mx-auto mt-8">
            <Card className="p-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-semibold text-foreground">Processing Videos</h3>
                  <span className="text-sm text-muted-foreground">
                    {currentProgress} / {totalUrls}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#193c76] to-[#4a90e2] transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${(currentProgress / totalUrls) * 100}%` }}
                  />
                </div>

                {/* Current Processing URL */}
                {currentProcessingUrl && (
                  <div className="flex items-center space-x-3 p-3 bg-secondary/50 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin text-[#193c76]" />
                    <span className="text-sm text-muted-foreground truncate">Processing: {currentProcessingUrl}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <div className="max-w-4xl mx-auto mt-12">
            <Card className="p-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl">
              <h3 className="font-heading text-2xl font-semibold mb-6 text-foreground">Download Results</h3>

              <div className="space-y-3 mb-6">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl border"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      {result.status === "success" && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {result.status === "failed" && <XCircle className="h-5 w-5 text-red-600" />}
                      {result.status === "processing" && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}

                      <div className="flex-1 min-w-0">
                        <p 
                          className="font-medium text-foreground cursor-pointer hover:text-primary transition-colors truncate"
                          onClick={() => previewVideo(result)}
                          title={result.title}
                        >
                          {result.title}
                        </p>
                        {result.error && <p className="text-sm text-red-600">{result.error}</p>}
                      </div>
                    </div>

                    {result.status === "success" && result.fileUrl && (
                      <Button onClick={() => downloadSingle(result)} size="sm" variant="outline" className="rounded-lg flex-shrink-0">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Batch Download Button */}
              {results.some((r) => r.status === "success" && r.fileUrl) && (
                <Button
                  onClick={downloadAll}
                  className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-[#193c76] to-[#4a90e2] hover:from-[#2d5aa0] hover:to-[#5ba0f2] shadow-lg transition-all duration-300"
                >
                  <Download className="mr-3 h-6 w-6" />
                  Batch Download All ({results.filter((r) => r.status === "success" && r.fileUrl).length} files)
                </Button>
              )}
            </Card>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-16 text-white/60 text-sm">© 2025 MediSave. Powered by Medtools.</footer>
      </div>
    </div>
  )
}
