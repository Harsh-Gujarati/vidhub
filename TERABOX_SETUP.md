# TeraBox Video Player Setup Guide

## Overview

This implementation uses a **backend resolver architecture** to play TeraBox videos in your site. The backend converts TeraBox share links into direct video stream URLs that can be played in a standard HTML5 `<video>` player.

## Architecture

```
Frontend (app.js)
    ↓ POST /api/terabox/resolve
Backend (api/terabox-resolve.js)
    ↓ Calls resolver service
Resolver Service (external)
    ↓ Returns direct video URL
Frontend plays video in <video> tag
```

## Setup Steps

### 1. Configure Resolver Service

You need to set up a resolver service that converts TeraBox share URLs to direct video stream URLs.

**Option A: Use Environment Variable (Recommended)**

Set the `TERABOX_RESOLVER_URL` environment variable in your Vercel project:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - **Key**: `TERABOX_RESOLVER_URL`
   - **Value**: Your resolver service URL (e.g., `https://api.example.com/resolve-terabox`)

**Option B: Modify the Code**

Edit `api/terabox-resolve.js` and replace the `RESOLVER_SERVICE_URL` constant with your resolver endpoint.

### 2. Resolver Service Requirements

Your resolver service must:

- Accept POST requests with JSON body: `{ "link": "https://teraboxurl.com/s/..." }`
- Return JSON response with:
  ```json
  {
    "streamUrl": "https://direct-cdn-url.com/video.mp4",
    "title": "Video Title (optional)",
    "thumbnail": "https://thumbnail-url.com/thumb.jpg (optional)"
  }
  ```

### 3. Resolver Service Options

#### Option 1: Use Existing Public APIs

Some services provide TeraBox resolution APIs. Search for:
- "TeraBox direct link generator API"
- "TeraBox downloader API"
- "TeraBox stream URL resolver"

**Important**: Only use services that are legal and respect TeraBox's Terms of Service.

#### Option 2: Build Your Own Resolver

Create a separate service (Node.js/Python/PHP) that:

1. Accepts TeraBox share URL
2. Uses TeraBox's public APIs (if available) or web scraping (if legal)
3. Extracts the direct CDN video URL
4. Returns it in the expected format

**Example Node.js resolver structure:**

```javascript
// resolver-service.js
app.post('/resolve', async (req, res) => {
    const { link } = req.body;
    
    // 1. Extract share ID from URL
    const shareId = extractShareId(link);
    
    // 2. Call TeraBox APIs or scrape (respect ToS)
    const videoData = await getTeraBoxVideoData(shareId);
    
    // 3. Return direct stream URL
    res.json({
        streamUrl: videoData.directUrl,
        title: videoData.title,
        thumbnail: videoData.thumbnail
    });
});
```

#### Option 3: Use Apify Actors

Apify provides actors that can resolve TeraBox links:

1. Find a TeraBox resolver actor on Apify
2. Use their API endpoint as your resolver URL
3. Format the response to match expected structure

### 4. Testing

1. **Test the resolver endpoint directly:**

```bash
curl -X POST https://your-domain.com/api/terabox/resolve \
  -H "Content-Type: application/json" \
  -d '{"shareUrl": "https://teraboxurl.com/s/1YvMt6-56oPAkYVyZGbe8ZA"}'
```

Expected response:
```json
{
  "streamUrl": "https://direct-video-url.com/video.mp4",
  "title": "Video Title",
  "thumbnail": "https://thumbnail-url.com/thumb.jpg"
}
```

2. **Test in the frontend:**

- Navigate to the TeraBox section
- Click "Play TeraBox Video"
- The video should load and play

### 5. Error Handling

The implementation includes error handling for:

- Invalid TeraBox URLs
- Resolver service failures
- Invalid video URLs
- Network errors

Errors are displayed in the player area with helpful messages.

## Security Notes

⚠️ **Important Considerations:**

1. **Terms of Service**: Ensure your resolver service complies with TeraBox's Terms of Service
2. **Rate Limiting**: Implement rate limiting to avoid abuse
3. **CORS**: The resolver endpoint has CORS enabled for your domain
4. **Validation**: URLs are validated before processing

## Troubleshooting

### "Failed to resolve TeraBox link"

- Check that `TERABOX_RESOLVER_URL` is set correctly
- Verify your resolver service is accessible
- Check resolver service logs for errors
- Ensure resolver returns the expected JSON format

### "Could not play video"

- The resolved URL may be invalid or expired
- Check browser console for CORS errors
- Verify the video URL is accessible
- Some CDN URLs may require specific headers

### "Resolver response format not recognized"

- Your resolver must return `streamUrl`, `directUrl`, `url`, or `downloadUrl`
- Check the response format matches expected structure
- Update `callResolverService()` if your resolver uses different field names

## Next Steps

1. Set up your resolver service
2. Configure `TERABOX_RESOLVER_URL` environment variable
3. Test the endpoint
4. Deploy and test in production

## Support

For issues:
- Check browser console for errors
- Check Vercel function logs
- Verify resolver service is working
- Ensure environment variables are set

