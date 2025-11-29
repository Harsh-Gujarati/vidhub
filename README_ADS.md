# Adsterra Ads & Google Sign-In Setup

## ✅ Updates Completed

1.  **Adsterra Ads Implemented:**
    *   Updated `ad-manager.js` with your exact Adsterra ad codes.
    *   Configured to use HTTPS to ensure they load correctly.
    *   Setup includes:
        *   **Desktop Banner (728x90)**
        *   **Mobile Banner (320x50)**
        *   **Popunder**
        *   **Social Bar**
        *   **Native Banner** (for in-feed)

2.  **Google Sign-In:**
    *   The Google Sign-In button code is present in the header.
    *   **Note:** Google Sign-In often **does not work** when opening files directly (e.g., `file:///C:/...`). It requires a running web server (localhost) or a live domain to function for security reasons.

## 🚀 How to Test Properly

To see the Ads and Google Sign-In button working, you should run a local server.

### Option 1: Using VS Code Live Server (Recommended)
1.  Install the "Live Server" extension in VS Code.
2.  Right-click `index.html` and select "Open with Live Server".
3.  This will open your site at `http://127.0.0.1:5500/`.

### Option 2: Using Python
If you have Python installed, open a terminal in your project folder and run:
```bash
python -m http.server
```
Then open `http://localhost:8000` in your browser.

### Option 3: Using Node.js
If you have Node.js installed:
```bash
npx serve .
```

## ⚠️ Important Note on Ads
*   **Ad Blockers:** Ensure you disable any ad blockers on your browser when testing.
*   **Localhost:** Some ad networks may not fill ads on `localhost`. If you see the ad containers but they are empty, deploy to Vercel to see live ads.
