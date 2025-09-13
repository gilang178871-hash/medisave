# MediSave - Video Downloader

A modern video downloader web application built with Next.js 14, supporting YouTube, TikTok, and Instagram videos.

## Features

- 🎥 Download videos from YouTube, TikTok, and Instagram
- 📱 Responsive design with modern UI
- 🎯 High-quality downloads (1080p for YouTube)
- 📦 Batch download with ZIP support
- ⚡ Fast and reliable downloads
- 🔒 Secure proxy for streaming URLs

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Video Processing**: yt-dlp
- **Deployment**: Vercel

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install yt-dlp:**
   ```bash
   # macOS
   brew install yt-dlp
   
   # Ubuntu/Debian
   sudo apt install yt-dlp
   
   # Or via pip
   pip install yt-dlp
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env.local` file:

```env
# Optional: Path to yt-dlp binary (default: yt-dlp)
YTDLP_PATH=yt-dlp

# Optional: Path to cookies file for YouTube
YTDLP_COOKIES=/path/to/cookies.txt

# Optional: Browser to extract cookies from
YTDLP_COOKIES_FROM_BROWSER=chrome
```

## Deployment to Vercel

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect Next.js
   - Deploy!

3. **Environment Variables in Vercel:**
   - Go to your project settings
   - Add environment variables if needed
   - Redeploy

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/download` - Download video
- `GET /api/proxy?target=...` - Proxy streaming URLs
- `POST /api/create-zip` - Create ZIP file
- `GET /api/downloads/[...filename]` - Serve downloaded files

## Usage

1. Paste video URLs (one per line)
2. Click "Process Videos"
3. Download individual videos or batch download as ZIP
4. Videos are saved with original titles and high quality

## Supported Platforms

- ✅ YouTube (1080p)
- ✅ TikTok (original quality)
- ✅ Instagram (original quality)

## License

MIT License - feel free to use for personal or commercial projects.

## Support

For issues or questions, please open an issue on GitHub.
