# VIP Video Player Implementation Guide

## Overview
This guide explains how to implement a secure Google Drive video player with persistent user data (likes/saves) across devices.

## Features Implemented

### 1. Secure Google Drive Video Playback
- **File**: `secure-player.js`
- Prevents direct URL access and downloads
- Uses Google Drive preview mode (iframe)
- Blocks right-click and context menu
- Prevents drag-and-drop
- Extracts video ID from various Google Drive URL formats

### 2. Firebase Integration for Cross-Device Sync
- **File**: `firebase-config.js`
- Stores user likes and saves in Firestore
- Syncs data across devices when user logs in
- Merges local and remote data intelligently
- Handles conflicts (remote data takes precedence)

### 3. User Authentication Persistence
- Uses localStorage for session persistence
- Google Sign-In integration
- Auto-login on page reload
- Secure user ID generation from Google profile

## Setup Instructions

### Step 1: Add Firebase to Your Project

Add these scripts to your `index.html` **before** the closing `</head>` tag:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
```

### Step 2: Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Add a web app to your project
4. Copy the configuration object
5. Update `firebase-config.js` with your credentials:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Step 3: Enable Firestore

1. In Firebase Console, go to Firestore Database
2. Click "Create database"
3. Start in **production mode**
4. Set up security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Step 4: Add Scripts to index.html

Add these scripts **before** `app.js`:

```html
<!-- Secure Player & Firebase -->
<script src="firebase-config.js" data-allowed></script>
<script src="secure-player.js" data-allowed></script>
```

### Step 5: Update VIP Section HTML

Replace your VIP section in `index.html` with:

```html
<!-- VIP Section -->
<section id="vip-section" class="content-section">
    <div class="section-header">
        <h2 class="section-title">VIP Lounge</h2>
        <div class="section-stats">
            <span class="stat-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15 10 23 10 17 14 19 22 12 17 5 22 7 14 1 10 9 10 12 2"></polygon>
                </svg>
                Premium Content
            </span>
        </div>
    </div>

    <!-- Secure Video Player -->
    <div class="vip-player-section">
        <div class="vip-player-controls">
            <input 
                type="text" 
                id="vip-drive-url" 
                class="vip-url-input" 
                placeholder="Paste Google Drive video URL here..."
                autocomplete="off"
            >
            <button id="vip-play-btn" class="vip-play-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Play
            </button>
        </div>

        <!-- Video Player Container -->
        <div id="vip-player-container" class="vip-player-wrapper">
            <div class="player-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <p>Enter a Google Drive video URL to play</p>
            </div>
        </div>

        <!-- Video Actions -->
        <div class="vip-actions" id="vip-actions" style="display: none;">
            <button class="vip-action-btn" id="vip-like-btn" data-action="like">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span>Like</span>
            </button>
            <button class="vip-action-btn" id="vip-save-btn" data-action="save">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Save</span>
            </button>
            <button class="vip-action-btn" id="vip-add-list-btn" data-action="add">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Add to VIP List</span>
            </button>
        </div>
    </div>

    <!-- VIP Video List -->
    <div class="vip-list-section">
        <div class="vip-list-header">
            <h3 class="vip-list-title">Your VIP Videos</h3>
            <button id="vip-clear-all" class="vip-clear-btn" style="display: none;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Clear All
            </button>
        </div>
        <div id="vip-video-list" class="vip-video-grid">
            <div class="vip-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <polygon points="12 2 15 10 23 10 17 14 19 22 12 17 5 22 7 14 1 10 9 10 12 2"></polygon>
                </svg>
                <p>No VIP videos yet</p>
                <p class="vip-empty-hint">Add videos from the player above</p>
            </div>
        </div>
    </div>

    <!-- Auth Prompt for VIP Features -->
    <div id="vip-auth-prompt" class="vip-auth-prompt" style="display: none;">
        <div class="auth-prompt-content">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <h3>Sign In Required</h3>
            <p>Sign in with Google to like, save, and manage your VIP videos</p>
            <div id="google-signin-button"></div>
        </div>
    </div>
</section>
```

### Step 6: Add CSS Styles

Add to your `index.css`:

```css
/* VIP Player Section */
.vip-player-section {
    margin-bottom: 3rem;
}

.vip-player-controls {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.vip-url-input {
    flex: 1;
    padding: 0.875rem 1.25rem;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: 12px;
    color: var(--text-primary);
    font-size: 0.9375rem;
    transition: all 0.3s ease;
}

.vip-url-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.vip-play-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.vip-play-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

.vip-player-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    background: var(--surface);
    border-radius: 16px;
    overflow: hidden;
    border: 2px solid var(--border);
}

.player-placeholder,
.player-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-secondary);
    text-align: center;
    padding: 2rem;
}

.player-placeholder svg,
.player-error svg {
    margin-bottom: 1rem;
    opacity: 0.5;
}

.secure-drive-player {
    width: 100%;
    height: 100%;
    border: none;
}

/* VIP Actions */
.vip-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
    flex-wrap: wrap;
}

.vip-action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: 12px;
    color: var(--text-primary);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
}

.vip-action-btn:hover {
    border-color: var(--primary);
    background: var(--surface-hover);
}

.vip-action-btn.active {
    border-color: var(--primary);
    background: rgba(102, 126, 234, 0.1);
    color: var(--primary);
}

.vip-action-btn.active svg {
    fill: var(--primary);
}

/* VIP Video List */
.vip-list-section {
    margin-top: 3rem;
}

.vip-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.vip-list-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
}

.vip-clear-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-secondary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.vip-clear-btn:hover {
    border-color: #ef4444;
    color: #ef4444;
}

.vip-video-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
}

.vip-empty-state {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    color: var(--text-secondary);
    text-align: center;
}

.vip-empty-state svg {
    margin-bottom: 1rem;
    opacity: 0.3;
}

.vip-empty-hint {
    font-size: 0.875rem;
    opacity: 0.7;
    margin-top: 0.5rem;
}

/* Auth Prompt */
.vip-auth-prompt {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.auth-prompt-content {
    background: var(--surface);
    padding: 3rem;
    border-radius: 24px;
    text-align: center;
    max-width: 400px;
    border: 2px solid var(--border);
}

.auth-prompt-content svg {
    margin-bottom: 1.5rem;
    opacity: 0.8;
}

.auth-prompt-content h3 {
    font-size: 1.5rem;
    margin-bottom: 0.75rem;
    color: var(--text-primary);
}

.auth-prompt-content p {
    color: var(--text-secondary);
    margin-bottom: 2rem;
}
```

## Usage

### Playing a Video

1. User pastes Google Drive URL in the input field
2. Clicks "Play" button
3. Video loads in secure iframe (preview mode)
4. User cannot download or access direct URL

### Liking/Saving Videos

1. User must be signed in with Google
2. Click "Like" or "Save" button
3. Data is stored in:
   - **LocalStorage** (immediate, offline)
   - **Firestore** (synced across devices)

### Cross-Device Sync

1. User signs in on Device A, likes/saves videos
2. User signs in on Device B with same Google account
3. All likes/saves automatically sync from Firestore
4. Local and remote data are merged intelligently

## Security Features

1. **No Direct URL Exposure**: Uses Google Drive preview iframe
2. **Right-Click Disabled**: Prevents context menu on player
3. **Drag-Drop Disabled**: Prevents dragging video element
4. **Sandbox Iframe**: Restricted iframe permissions
5. **Firestore Rules**: Users can only access their own data

## Testing

1. Add your Google Drive video URL (make sure it's set to "Anyone with link can view")
2. Test like/save functionality
3. Sign out and sign in again - data should persist
4. Try on different device with same Google account - data should sync

## Troubleshooting

### Video Won't Play
- Ensure Google Drive link is set to "Anyone with link can view"
- Check if URL format is correct
- Try the preview link format: `https://drive.google.com/file/d/FILE_ID/preview`

### Data Not Syncing
- Check Firebase console for errors
- Verify Firestore rules are set correctly
- Check browser console for Firebase errors
- Ensure user is signed in

### Firebase Not Loading
- Check if Firebase scripts are loaded before your app scripts
- Verify Firebase config credentials are correct
- Check browser console for initialization errors

## Next Steps

1. Set up Firebase project and get credentials
2. Update `firebase-config.js` with your credentials
3. Add the scripts to your HTML
4. Replace VIP section HTML
5. Add CSS styles
6. Test the implementation

## Support

For issues or questions, check:
- Firebase documentation: https://firebase.google.com/docs
- Google Drive API: https://developers.google.com/drive
