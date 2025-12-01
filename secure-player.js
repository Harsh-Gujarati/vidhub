// Secure Google Drive Video Player
// Prevents direct URL access and download attempts

class SecureDrivePlayer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentVideoId = null;
        this.iframe = null;
    }

    // Extract Google Drive ID from various URL formats
    extractDriveId(url) {
        const patterns = [
            /\/file\/d\/([a-zA-Z0-9_-]+)/,
            /id=([a-zA-Z0-9_-]+)/,
            /\/d\/([a-zA-Z0-9_-]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }

    // Load video securely
    loadVideo(driveUrl) {
        const videoId = this.extractDriveId(driveUrl);

        if (!videoId) {
            this.showError('Invalid Google Drive URL');
            return false;
        }

        this.currentVideoId = videoId;
        this.renderPlayer(videoId);
        return true;
    }

    // Render secure iframe player
    renderPlayer(videoId) {
        if (!this.container) return;

        // Create iframe with security measures
        this.iframe = document.createElement('iframe');
        this.iframe.className = 'secure-drive-player';

        // Use preview mode which prevents direct downloads
        this.iframe.src = `https://drive.google.com/file/d/${videoId}/preview`;

        // Security attributes
        this.iframe.setAttribute('allow', 'autoplay; encrypted-media');
        this.iframe.setAttribute('allowfullscreen', 'true');
        this.iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');

        // Prevent right-click and context menu
        this.iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 12px;
            background: #000;
            pointer-events: auto;
        `;

        // Clear container and add iframe
        this.container.innerHTML = '';
        this.container.appendChild(this.iframe);

        // Add overlay to prevent right-click on container
        this.addProtectionOverlay();
    }

    // Add transparent overlay to prevent context menu
    addProtectionOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'player-protection-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1;
            pointer-events: none;
        `;

        this.container.style.position = 'relative';
        this.container.appendChild(overlay);

        // Prevent context menu on container
        this.container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });

        // Prevent drag and drop
        this.container.addEventListener('dragstart', (e) => {
            e.preventDefault();
            return false;
        });
    }

    // Show error message
    showError(message) {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="player-error">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p>${message}</p>
            </div>
        `;
    }

    // Clear player
    clear() {
        if (this.container) {
            this.container.innerHTML = `
                <div class="player-placeholder">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    <p>Enter a Google Drive video URL to play</p>
                </div>
            `;
        }
        this.currentVideoId = null;
        this.iframe = null;
    }

    // Get current video ID (obfuscated)
    getCurrentVideoId() {
        return this.currentVideoId ? btoa(this.currentVideoId) : null;
    }
}

// VIP Video List Manager
class VIPVideoManager {
    constructor() {
        this.videos = this.loadVIPVideos();
    }

    // Load VIP videos from localStorage
    loadVIPVideos() {
        try {
            const stored = localStorage.getItem('plx_vip_videos');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading VIP videos:', error);
            return [];
        }
    }

    // Save VIP videos to localStorage
    saveVIPVideos() {
        try {
            localStorage.setItem('plx_vip_videos', JSON.stringify(this.videos));
        } catch (error) {
            console.error('Error saving VIP videos:', error);
        }
    }

    // Add video to VIP list
    addVideo(driveUrl, title = 'Untitled Video') {
        const player = new SecureDrivePlayer('temp-container');
        const videoId = player.extractDriveId(driveUrl);

        if (!videoId) return false;

        // Check if already exists
        if (this.videos.find(v => v.id === videoId)) {
            return false;
        }

        this.videos.unshift({
            id: videoId,
            title: title,
            url: driveUrl,
            addedAt: Date.now()
        });

        this.saveVIPVideos();
        return true;
    }

    // Remove video from VIP list
    removeVideo(videoId) {
        this.videos = this.videos.filter(v => v.id !== videoId);
        this.saveVIPVideos();
    }

    // Get all VIP videos
    getVideos() {
        return this.videos;
    }

    // Clear all VIP videos
    clearAll() {
        this.videos = [];
        this.saveVIPVideos();
    }
}

// Export to window
window.SecureDrivePlayer = SecureDrivePlayer;
window.VIPVideoManager = VIPVideoManager;
