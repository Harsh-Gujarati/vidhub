# Ad Integration Reference

## 📋 Information Needed for Ad Implementation

### Google AdSense

Once your site is approved by AdSense, you'll need:

1. **Publisher ID** (format: `ca-pub-XXXXXXXXXXXXXXXX`)
   - Found in: AdSense Dashboard → Account → Account Information

2. **Ad Unit Code**
   - Go to: Ads → Overview → By ad unit → Display ads
   - Create a new ad unit
   - Choose ad size (recommended: Responsive)
   - Copy the ad code

3. **Example AdSense Code**:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
     crossorigin="anonymous"></script>
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="YYYYYYYYYY"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

### Adsterra

After signing up with Adsterra:

1. **Publisher ID**
   - Found in: Dashboard → Settings → Account Details

2. **Zone ID**
   - Go to: Sites → Your Site → Create Ad Zone
   - Choose ad format (Banner, Native, etc.)
   - Copy the Zone ID

3. **Example Adsterra Code** (Banner):
```html
<script type="text/javascript">
    atOptions = {
        'key' : 'YOUR_ZONE_ID_HERE',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
    };
    document.write('<scr' + 'ipt type="text/javascript" src="http' + (location.protocol === 'https:' ? 's' : '') + '://www.profitabledisplaynetwork.com/YOUR_PUBLISHER_ID/invoke.js"></scr' + 'ipt>');
</script>
```

## 🎯 Recommended Ad Placements for VidHub

### Option 1: Between Content Rows
- **Position**: After every 6-8 gallery items
- **Format**: Responsive display ad
- **Size**: 728x90 (desktop), 320x50 (mobile)

### Option 2: Sidebar (Desktop Only)
- **Position**: Fixed sidebar on right
- **Format**: Vertical banner
- **Size**: 300x600 or 160x600

### Option 3: Sticky Bottom Banner
- **Position**: Fixed at bottom of screen
- **Format**: Anchor/sticky ad
- **Size**: 320x50 (mobile), 728x90 (desktop)

### Option 4: In-Feed Native Ads
- **Position**: Within the gallery grid
- **Format**: Native ad matching gallery item style
- **Blend**: Styled to match gallery items

## 🔄 Fallback Implementation Strategy

The implementation will work as follows:

```javascript
// 1. Try to load AdSense
loadAdSense()
  .then(() => {
    console.log('AdSense loaded successfully');
  })
  .catch(() => {
    // 2. If AdSense fails, load Adsterra
    console.log('AdSense failed, loading Adsterra fallback');
    loadAdsterra();
  });
```

## 📝 What to Provide Me

When you're ready to implement ads, send me:

```
AdSense:
- Publisher ID: ca-pub-XXXXXXXXXXXXXXXX
- Ad Slot ID: YYYYYYYYYY
- Preferred placement: [between rows / sidebar / sticky bottom / in-feed]

Adsterra:
- Publisher ID: ZZZZZZZZZ
- Zone ID: AAAAAAAAAA
- Ad format: [banner / native / popunder]
```

## ⚠️ Important Notes

1. **AdSense Approval**: 
   - Site must be live and accessible
   - Need sufficient content (you have this ✅)
   - Must comply with AdSense policies
   - Approval can take 1-2 weeks

2. **Adsterra Approval**:
   - Usually faster than AdSense (1-3 days)
   - More lenient policies
   - Good backup option

3. **Ad Policy Compliance**:
   - Don't click your own ads
   - Don't encourage users to click ads
   - Ensure ads are clearly labeled
   - Follow platform-specific policies

4. **Testing**:
   - Use AdSense test mode during development
   - Verify ads don't break layout
   - Test on mobile and desktop

## 🚀 Next Steps

1. ✅ Deploy site to Vercel (DONE)
2. ⏳ Wait 24-48 hours for site to be indexed
3. 📝 Apply for AdSense
4. 📝 Apply for Adsterra (as backup)
5. ⏳ Wait for approval
6. 💬 Send me the ad codes
7. 🎨 I'll implement with fallback mechanism
8. ✅ Test and verify

---

**Questions?** Let me know which ad placement you prefer and I'll prepare the implementation!
