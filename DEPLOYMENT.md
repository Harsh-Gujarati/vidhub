# Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel**: Visit [vercel.com](https://vercel.com)

2. **Sign in**: Log in with your GitHub account

3. **Import Project**:
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Choose `Harsh-Gujarati/vidhub` from your repositories
   - Click "Import"

4. **Configure Project**:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
   - **Install Command**: `npm install`

5. **Environment Variables**: 
   - No environment variables needed for basic setup

6. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete (usually 1-2 minutes)
   - Your site will be live at `https://vidhub-[random].vercel.app`

### Method 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to your project
cd e:\vidhub

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

## 📋 Post-Deployment Checklist

After deployment, verify:

- ✅ Homepage loads correctly
- ✅ Videos section displays content
- ✅ Images section displays content
- ✅ "Load More" buttons work
- ✅ Modal popups function properly
- ✅ Theme toggle works
- ✅ Responsive design on mobile

## 🔧 Configuration Files Explained

### `vercel.json`
- Configures serverless function routing
- Maps `/api/proxy` to the proxy serverless function
- Handles CORS headers
- Routes all other requests to static files

### `package.json`
- Defines Node.js dependencies
- Specifies Node.js version (14.x or higher)
- Contains project metadata

### `.gitignore`
- Excludes `node_modules` and build artifacts
- Prevents sensitive files from being committed

## 🌐 Custom Domain (Optional)

To add a custom domain:

1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Domains"
3. Add your domain name
4. Follow DNS configuration instructions
5. Wait for DNS propagation (up to 48 hours)

## 📊 Monitoring & Analytics

Vercel provides built-in analytics:
- Visit your project dashboard
- Click "Analytics" tab
- View page views, performance metrics, and more

## 🐛 Troubleshooting

### Issue: API requests failing
**Solution**: Check browser console for CORS errors. Ensure `vercel.json` is properly configured.

### Issue: Videos/Images not loading
**Solution**: Verify the proxy function is deployed correctly at `/api/proxy`

### Issue: 404 errors
**Solution**: Ensure all routes in `vercel.json` are correct

### Issue: Slow loading
**Solution**: Check Vercel function logs for timeout issues

## 📝 Updating Your Deployment

To update your live site:

```bash
# Make your changes
git add .
git commit -m "Your update message"
git push origin main
```

Vercel will automatically redeploy your site when you push to the main branch!

## 🎯 Next Steps for AdSense/Adsterra

Once your site is live and verified:

1. **Register with Google AdSense**:
   - Visit [adsense.google.com](https://adsense.google.com)
   - Add your Vercel domain
   - Wait for approval (can take 1-2 weeks)

2. **Register with Adsterra**:
   - Visit [adsterra.com](https://adsterra.com)
   - Sign up as a publisher
   - Add your site
   - Get your Publisher ID and Zone IDs

3. **Implement Ads**:
   - Once approved, provide me with your ad IDs
   - I'll implement the ads with fallback mechanism

---

**Your GitHub Repository**: https://github.com/Harsh-Gujarati/vidhub

**Deploy Now**: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Harsh-Gujarati/vidhub)
