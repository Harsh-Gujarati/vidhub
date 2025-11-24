# Ad Implementation Guide for VidHub

## Overview
This guide explains how to implement AdSense (primary) and Adsterra (fallback) ads on your VidHub site with smart detection and automatic fallback.

## Files Created
1. **ad-manager.js** - Handles ad loading, detection, and fallback logic
2. **ad-styles.css** - Styles for ad containers

## Implementation Steps

### Step 1: Add CSS to index.html
Add this line in the `<head>` section of `index.html` after `index.css`:
```html
<link rel="stylesheet" href="ad-styles.css">
```

### Step 2: Add Ad Containers to index.html

#### A) Header Ad (After Hero Section)
Add this after the `</section>` closing tag of the hero section (around line 111):
```html
<!-- Header Ad -->
<div class="ad-container header-ad" id="header-ad-container" data-ad-type="display" data-ad-id="header"></div>
```

#### B) Load Ad Manager Script
Add this before the closing `</body>` tag, after `api-security.js` and before `app.js`:
```html
<!-- Ad Manager -->
<script src="ad-manager.js" data-allowed></script>
```

### Step 3: Add In-Content Ads (Optional)
To add ads between gallery items, add this code to `app.js` after the `renderVideos()` and `renderImages()` functions:

```javascript
// Add in-content ads after rendering
const addInContentAds = () => {
    const videosGallery = document.getElementById('videos-gallery');
    const imagesGallery = document.getElementById('images-gallery');
    
    // Add ad after every 12 items in videos
    if (videosGallery && window.adManager) {
        window.adManager.addInContentAd(videosGallery, 11); // After 12th item (0-indexed)
    }
    
    // Add ad after every 12 items in images
    if (imagesGallery && window.adManager) {
        window.adManager.addInContentAd(imagesGallery, 11);
    }
};

// Call this after rendering
// In renderVideos() function, add at the end:
addInContentAds();

// In renderImages() function, add at the end:
addInContentAds();
```

## How It Works

### Ad Priority System
1. **Primary**: AdSense ads load first
2. **Detection**: System checks if AdSense loaded successfully (3-second timeout)
3. **Fallback**: If AdSense fails or doesn't fill, Adsterra ads load automatically

### Ad Types Implemented

#### AdSense (Primary)
- **Display Ad**: Responsive banner (header position)
- **In-Article Ad**: Fluid ad for content areas
- **In-Feed Ad**: Native-style ad between gallery items
- **Multiplex Ad**: Recommended content style

#### Adsterra (Fallback)
- **Popunder**: Loads automatically on page load
- **Desktop Banner**: 728x90 leaderboard
- **Mobile Banner**: 320x50 mobile banner
- **Native Banner**: Blends with content

### Automatic Detection
The ad manager automatically:
- Detects if user is on mobile or desktop
- Loads appropriate ad sizes
- Checks if AdSense loaded successfully
- Falls back to Adsterra if needed
- Uses lazy loading for better performance

## Ad Placements Recommended

### Desktop
```
Header (after hero): 728x90 AdSense Display / Adsterra Desktop Banner
Between content (every 12 items): AdSense In-Feed / Adsterra Native
```

### Mobile
```
Header (after hero): 320x50 AdSense Display / Adsterra Mobile Banner
Between content (every 12 items): AdSense In-Feed / Adsterra Native
Sticky Footer (optional): 320x50 Adsterra Mobile Banner
```

## Testing

### Test AdSense
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for: `AdSense available: true`
4. Ads should load within 3 seconds

### Test Fallback
1. Block AdSense domain in browser (use ad blocker)
2. Refresh page
3. Console should show: `AdSense timeout - using fallback`
4. Adsterra ads should load instead

## Performance Optimization

The system includes:
- **Lazy Loading**: Ads load 200px before they come into view
- **Async Loading**: All scripts load asynchronously
- **Smart Detection**: 3-second timeout prevents long waits
- **Caching**: Prevents duplicate ad initialization

## Revenue Optimization Tips

1. **Placement**: Header ad gets highest viewability
2. **Frequency**: One ad per 12 content items prevents ad fatigue
3. **Native Ads**: In-feed ads blend better, higher CTR
4. **Mobile**: Sticky footer ads on mobile can boost revenue
5. **A/B Testing**: Try different ad positions to find what works best

## Troubleshooting

### Ads Not Showing
- Check browser console for errors
- Verify ad codes are correct
- Ensure ad-manager.js is loaded before app.js
- Check if ad blockers are interfering

### AdSense Not Loading
- Verify your AdSense account is approved
- Check if domain is added to AdSense
- Ensure ads.txt file is present (if required)

### Adsterra Not Loading
- Verify ad codes are correct
- Check if scripts are being blocked
- Ensure warhealthy.com domain is accessible

## Ad Codes Reference

### Your AdSense Publisher ID
```
ca-pub-9258235332675012
```

### Your AdSense Ad Slots
- Display: `9026742119`
- In-Article: `5195292409`
- Multiplex: `8731939089`
- In-Feed: `7629884051`

### Your Adsterra Codes
- Popunder: `87115acd9552baa3c90beda2f274dc8e`
- Native: `43c72195bc0c32d143a2ea7687d2c6f9`
- Mobile Banner: `5dc248752b1180e6817864a61efebc1a`
- Desktop Banner: `5c864e04a217fd55138f61168bcb91a9`

## Next Steps

1. Add the CSS link to index.html
2. Add the header ad container to index.html
3. Add the ad-manager.js script tag to index.html
4. (Optional) Add in-content ads to app.js
5. Test on localhost
6. Deploy to production
7. Monitor ad performance in AdSense and Adsterra dashboards

## Support

If ads aren't working:
1. Check browser console for errors
2. Verify all files are uploaded
3. Clear browser cache
4. Test in incognito mode
5. Check ad network dashboards for approval status
