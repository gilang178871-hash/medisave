# 🚀 Deployment Guide - MediSave to Vercel

## Prerequisites

1. **GitHub Account** - untuk menyimpan kode
2. **Vercel Account** - untuk deployment
3. **yt-dlp installed** - di sistem Vercel (otomatis)

## Step-by-Step Deployment

### 1. Prepare Repository

```bash
# Initialize git (jika belum)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: MediSave video downloader"

# Create GitHub repository dan push
git remote add origin https://github.com/yourusername/medisave.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign in with GitHub**
3. **Click "New Project"**
4. **Import your repository:**
   - Select your `medisave` repository
   - Click "Import"

5. **Configure Project:**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

6. **Environment Variables (Optional):**
   ```
   YTDLP_PATH=yt-dlp
   YTDLP_COOKIES_FROM_BROWSER=chrome
   ```

7. **Click "Deploy"**

### 3. Post-Deployment

1. **Wait for deployment to complete** (2-3 minutes)
2. **Test your app:**
   - Go to the provided Vercel URL
   - Test with a YouTube video
   - Verify download functionality

3. **Custom Domain (Optional):**
   - Go to Project Settings → Domains
   - Add your custom domain

## Important Notes

### ⚠️ Vercel Limitations

1. **Function Timeout**: 10 seconds (Hobby), 60 seconds (Pro)
   - Our download function has 4-minute timeout
   - May need Pro plan for longer downloads

2. **File Storage**: `/tmp` directory only
   - Files are temporary and will be deleted
   - Perfect for our use case

3. **Memory**: 1GB (Hobby), 3GB (Pro)
   - Should be sufficient for video processing

### 🔧 Troubleshooting

**If deployment fails:**

1. **Check build logs** in Vercel dashboard
2. **Verify yt-dlp is available:**
   ```bash
   # Add to vercel.json
   {
     "buildCommand": "npm run build && which yt-dlp"
   }
   ```

3. **Check environment variables**
4. **Verify all API routes are working**

### 📊 Monitoring

1. **Vercel Analytics** - Built-in
2. **Function Logs** - Available in dashboard
3. **Performance** - Monitor in Vercel dashboard

## Alternative Deployments

### Railway
```bash
# Add railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

### Netlify
```bash
# Add netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

## Success Checklist

- [ ] Repository pushed to GitHub
- [ ] Vercel project created
- [ ] Deployment successful
- [ ] Health check working (`/api/health`)
- [ ] Video download working
- [ ] ZIP download working
- [ ] Custom domain configured (optional)

## Support

If you encounter issues:

1. Check Vercel function logs
2. Verify yt-dlp installation
3. Test locally first
4. Check environment variables

**Your MediSave app is now live! 🎉**
