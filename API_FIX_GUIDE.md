# API & UI Fix Guide

## Issues Fixed

### 1. ✅ Missing Render Functions
**Problem**: `renderVideos()`, `renderImages()`, `renderVipVideos()`, `updateUserUI()` were being called but didn't exist.

**Solution**: Created `app-render-functions.js` with all missing functions.

### 2. ✅ Like/Save Buttons Showing When Not Logged In
**Problem**: Like and save buttons were visible even when users weren't logged in.

**Solution**: Updated render functions to conditionally show buttons only when `state.user` exists.

### 3. ✅ API Not Being Called
**Problem**: Civitai API might not be working properly.

**Solution**: Added debugging function `testCivitaiAPI()` to test the API.

## Implementation Steps

### Step 1: Add the Render Functions to app.js

Open `app.js` and add the contents of `app-render-functions.js` **before** the `init()` function.

**Option A - Manual Copy:**
1. Open `app-render-functions.js`
2. Copy all the code
3. Open `app.js`
4. Find the line `// ===== INITIALIZATION =====` (around line 664)
5. Paste the code **above** that line

**Option B - Include as Script:**
Add to your HTML before `app.js`:
```html
<script src="app-render-functions.js" data-allowed></script>
```

### Step 2: Add Gallery Styles

Add to your `index.html` in the `<head>` section:
```html
<link rel="stylesheet" href="gallery-styles.css">
```

### Step 3: Test the API

1. Open your website in a browser
2. Open browser console (F12)
3. Type: `testCivitaiAPI()`
4. Press Enter

**Expected Output:**
```
Testing Civitai API...
API URL: https://civitai.com/api/trpc/image.getInfinite?input=...
Proxy URL: .../api/proxy/?url=...
Response status: 200
✅ API working! Items: 20
```

**If you see errors:**
- Check if proxy is running (for local development)
- Check Vercel deployment logs (for production)
- Check browser console for CORS errors

### Step 4: Update User Profile Display

The new code automatically handles:
- ✅ Hiding like/save buttons when not logged in
- ✅ Showing only reaction counts for non-logged-in users
- ✅ Hiding user chip when not logged in
- ✅ Showing sign-in button when not logged in

### Step 5: Test the Changes

**Test 1: Not Logged In**
1. Open website (not logged in)
2. Check videos/images section
3. ✅ Should see reaction counts
4. ❌ Should NOT see like/save buttons
5. ✅ Should see "Sign In" button in header

**Test 2: Logged In**
1. Sign in with Google
2. Check videos/images section
3. ✅ Should see reaction counts
4. ✅ Should see like/save buttons
5. ✅ Should see user profile chip in header
6. ❌ Should NOT see "Sign In" button

**Test 3: Like/Save**
1. While logged in, click like button
2. ✅ Button should turn active (filled)
3. ✅ Data should save to localStorage
4. Refresh page
5. ✅ Like should still be active

## How It Works Now

### Before (Broken):
```javascript
// Always showed buttons
<button class="stat-btn">Like</button>
<button class="stat-btn">Save</button>
```

### After (Fixed):
```javascript
// Only shows reaction count if not logged in
${!isLoggedIn ? `
    <span class="stat-item">
        <svg>...</svg>
        <span>${formatNumber(item.reactionCount)}</span>
    </span>
` : ''}

// Only shows buttons if logged in
${isLoggedIn ? `
    <button class="stat-btn ${isLiked ? 'active' : ''}">
        <svg>...</svg>
    </button>
    <button class="stat-btn ${isSaved ? 'active' : ''}">
        <svg>...</svg>
    </button>
` : ''}
```

## UI Changes

### Not Logged In:
```
┌─────────────────────────────┐
│ Video Thumbnail             │
│                             │
├─────────────────────────────┤
│ ❤️ 1.2k                     │ ← Only shows count
└─────────────────────────────┘
```

### Logged In:
```
┌─────────────────────────────┐
│ Video Thumbnail             │
│                             │
├─────────────────────────────┤
│ ❤️ 1.2k  [❤️] [💾]          │ ← Shows count + buttons
└─────────────────────────────┘
```

## Debugging API Issues

### Check 1: Proxy Status

**Local Development:**
```bash
# Make sure proxy is running
node proxy.js
# Should show: Proxy server running on http://localhost:3000
```

**Production (Vercel):**
- Check Vercel deployment logs
- Verify `api/proxy.js` is deployed
- Check `vercel.json` configuration

### Check 2: Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Reload page
4. Look for requests to `/api/proxy`
5. Check status code (should be 200)
6. Check response data

### Check 3: Console Errors

Look for errors like:
- ❌ `Failed to fetch` → CORS or network issue
- ❌ `renderVideos is not defined` → Function not loaded
- ❌ `Cannot read property 'items'` → API response issue

### Check 4: API Response Structure

The API should return:
```json
{
  "result": {
    "data": {
      "json": {
        "items": [...],
        "nextCursor": "..."
      }
    }
  }
}
```

If structure is different, update the code in `fetchVideos()` and `fetchImages()`.

## Common Issues & Solutions

### Issue: "renderVideos is not defined"
**Solution**: Make sure `app-render-functions.js` is loaded before `app.js`

### Issue: "API returns 404"
**Solution**: 
- Local: Start proxy server (`node proxy.js`)
- Production: Check Vercel deployment

### Issue: "Buttons still show when not logged in"
**Solution**: 
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check if `state.user` is null

### Issue: "Videos not loading"
**Solution**:
1. Run `testCivitaiAPI()` in console
2. Check proxy logs
3. Verify API URL is correct
4. Check CORS headers

### Issue: "Likes/saves not persisting"
**Solution**:
- Check localStorage (DevTools → Application → Local Storage)
- Verify `persistUserData()` is being called
- Check if Firebase is initialized (if using)

## File Structure

```
vidhub/
├── index.html
├── index.css
├── gallery-styles.css          ← NEW: Add this
├── app.js                       ← UPDATE: Add render functions
├── app-render-functions.js      ← NEW: Contains all render functions
├── vip-styles.css
├── vip-integration.js
├── secure-player.js
├── firebase-config.js
└── api/
    └── proxy.js
```

## Quick Checklist

- [ ] Added `app-render-functions.js` to `app.js` or included as script
- [ ] Added `gallery-styles.css` to HTML
- [ ] Tested API with `testCivitaiAPI()`
- [ ] Verified buttons hidden when not logged in
- [ ] Verified buttons shown when logged in
- [ ] Tested like/save functionality
- [ ] Checked browser console for errors
- [ ] Tested on mobile (responsive)

## Next Steps

1. **Fix the issues** following steps above
2. **Test thoroughly** with both logged in and logged out states
3. **Deploy** to production
4. **Monitor** for any errors in production

## Support

If issues persist:
1. Check browser console for errors
2. Check network tab for failed requests
3. Verify all files are loaded correctly
4. Test API endpoint directly
5. Check Vercel deployment logs (if deployed)

---

**Remember**: The key changes are:
1. ✅ Render functions now exist
2. ✅ Buttons only show when logged in
3. ✅ API debugging function available
4. ✅ Proper error handling
