// VIP Player Integration for app.js
// Add these functions to your existing app.js file

// ===== VIP PLAYER INITIALIZATION =====
let vipPlayer = null;
let vipManager = null;
let currentVipVideo = null;

const initVIPPlayer = () => {
    // Initialize secure player
    vipPlayer = new SecureDrivePlayer('vip-player-container');
    vipManager = new VIPVideoManager();

    const urlInput = document.getElementById('vip-drive-url');
    const playBtn = document.getElementById('vip-play-btn');
    const actions = document.getElementById('vip-actions');
    const likeBtn = document.getElementById('vip-like-btn');
    const saveBtn = document.getElementById('vip-save-btn');
    const addListBtn = document.getElementById('vip-add-list-btn');
    const clearAllBtn = document.getElementById('vip-clear-all');

    if (!urlInput || !playBtn) return;

    // Play button handler
    const handlePlay = () => {
        const url = urlInput.value.trim();
        if (!url) {
            alert('Please enter a Google Drive video URL');
            return;
        }

        const success = vipPlayer.loadVideo(url);
        if (success) {
            currentVipVideo = {
                url: url,
                id: vipPlayer.getCurrentVideoId(),
                title: 'VIP Video',
                timestamp: Date.now()
            };

            // Show actions
            if (actions) actions.style.display = 'flex';

            // Update button states
            updateVIPActionButtons();
        }
    };

    playBtn.addEventListener('click', handlePlay);
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handlePlay();
    });

    // Like button
    if (likeBtn) {
        likeBtn.addEventListener('click', () => {
            if (!requireAuth()) return;
            if (!currentVipVideo) return;

            toggleLike(currentVipVideo);
            updateVIPActionButtons();
            syncToFirebase();
        });
    }

    // Save button
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (!requireAuth()) return;
            if (!currentVipVideo) return;

            toggleSave(currentVipVideo);
            updateVIPActionButtons();
            syncToFirebase();
        });
    }

    // Add to list button
    if (addListBtn) {
        addListBtn.addEventListener('click', () => {
            if (!currentVipVideo) return;

            const title = prompt('Enter a title for this video:', 'VIP Video');
            if (title) {
                const added = vipManager.addVideo(currentVipVideo.url, title);
                if (added) {
                    renderVIPList();
                    alert('Video added to VIP list!');
                } else {
                    alert('Video already in list');
                }
            }
        });
    }

    // Clear all button
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all VIP videos?')) {
                vipManager.clearAll();
                renderVIPList();
            }
        });
    }

    // Initial render
    renderVIPList();
};

// Update VIP action button states
const updateVIPActionButtons = () => {
    if (!currentVipVideo) return;

    const likeBtn = document.getElementById('vip-like-btn');
    const saveBtn = document.getElementById('vip-save-btn');
    const itemId = getItemId(currentVipVideo);

    if (likeBtn) {
        const isLiked = state.userData.likes.has(itemId);
        likeBtn.classList.toggle('active', isLiked);
        likeBtn.querySelector('span').textContent = isLiked ? 'Liked' : 'Like';
    }

    if (saveBtn) {
        const isSaved = state.userData.saved.some(s => s.id === itemId);
        saveBtn.classList.toggle('active', isSaved);
        saveBtn.querySelector('span').textContent = isSaved ? 'Saved' : 'Save';
    }
};

// Render VIP video list
const renderVIPList = () => {
    const listContainer = document.getElementById('vip-video-list');
    const clearBtn = document.getElementById('vip-clear-all');

    if (!listContainer) return;

    const videos = vipManager.getVideos();

    if (videos.length === 0) {
        listContainer.innerHTML = `
            <div class="vip-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <polygon points="12 2 15 10 23 10 17 14 19 22 12 17 5 22 7 14 1 10 9 10 12 2"></polygon>
                </svg>
                <p>No VIP videos yet</p>
                <p class="vip-empty-hint">Add videos from the player above</p>
            </div>
        `;
        if (clearBtn) clearBtn.style.display = 'none';
        return;
    }

    if (clearBtn) clearBtn.style.display = 'flex';

    listContainer.innerHTML = videos.map(video => `
        <div class="vip-video-card" data-video-id="${video.id}">
            <div class="vip-video-thumbnail">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
            </div>
            <div class="vip-video-info">
                <h4 class="vip-video-title">${video.title}</h4>
                <p class="vip-video-date">${new Date(video.addedAt).toLocaleDateString()}</p>
            </div>
            <div class="vip-video-actions">
                <button class="vip-video-play-btn" onclick="playVIPVideo('${video.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                </button>
                <button class="vip-video-remove-btn" onclick="removeVIPVideo('${video.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
};

// Play VIP video from list
window.playVIPVideo = (videoId) => {
    const videos = vipManager.getVideos();
    const video = videos.find(v => v.id === videoId);

    if (video && vipPlayer) {
        const urlInput = document.getElementById('vip-drive-url');
        if (urlInput) urlInput.value = video.url;

        vipPlayer.loadVideo(video.url);
        currentVipVideo = video;

        const actions = document.getElementById('vip-actions');
        if (actions) actions.style.display = 'flex';

        updateVIPActionButtons();

        // Scroll to player
        document.getElementById('vip-player-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
};

// Remove VIP video from list
window.removeVIPVideo = (videoId) => {
    if (confirm('Remove this video from your VIP list?')) {
        vipManager.removeVideo(videoId);
        renderVIPList();
    }
};

// ===== FIREBASE SYNC =====
const syncToFirebase = async () => {
    if (!window.FirebaseUserData || !state.user) return;

    const userId = getUserId();
    if (!userId) return;

    const userData = {
        likes: Array.from(state.userData.likes),
        saved: state.userData.saved,
        vip: state.userData.vip
    };

    await window.FirebaseUserData.saveUserData(userId, userData);
};

const syncFromFirebase = async () => {
    if (!window.FirebaseUserData || !state.user) return;

    const userId = getUserId();
    if (!userId) return;

    const localData = {
        likes: Array.from(state.userData.likes),
        saved: state.userData.saved,
        vip: state.userData.vip
    };

    const mergedData = await window.FirebaseUserData.syncUserData(userId, localData);

    if (mergedData) {
        state.userData.likes = new Set(mergedData.likes);
        state.userData.saved = mergedData.saved;
        state.userData.vip = mergedData.vip;

        persistUserData();
        updateVIPActionButtons();
        renderVIPList();
    }
};

// ===== MISSING RENDER FUNCTIONS =====

// Render videos gallery
const renderVideos = () => {
    const galleryEl = document.getElementById('videos-gallery');
    if (!galleryEl || state.videos.items.length === 0) return;

    galleryEl.innerHTML = state.videos.items.map(item => {
        const itemId = getItemId(item);
        const isLiked = state.userData.likes.has(itemId);
        const isSaved = state.userData.saved.some(s => s.id === itemId);
        const isPremium = isPremiumContent(item);

        return `
            <div class="gallery-item" data-id="${itemId}">
                <div class="gallery-item-media">
                    <video 
                        src="${getVideoUrl(item.url)}" 
                        poster="${getImageUrl(item.url)}"
                        loop
                        muted
                        playsinline
                        onmouseenter="this.play()"
                        onmouseleave="this.pause()"
                    ></video>
                    ${isPremium ? '<div class="premium-badge">Premium</div>' : ''}
                </div>
                <div class="gallery-item-info">
                    <div class="gallery-item-stats">
                        <button class="stat-btn ${isLiked ? 'active' : ''}" onclick="toggleLike(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span>${formatNumber(item.reactionCount || 0)}</span>
                        </button>
                        <button class="stat-btn ${isSaved ? 'active' : ''}" onclick="toggleSave(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
};

// Render images gallery
const renderImages = () => {
    const galleryEl = document.getElementById('images-gallery');
    if (!galleryEl || state.images.items.length === 0) return;

    galleryEl.innerHTML = state.images.items.map(item => {
        const itemId = getItemId(item);
        const isLiked = state.userData.likes.has(itemId);
        const isSaved = state.userData.saved.some(s => s.id === itemId);
        const isPremium = isPremiumContent(item);

        return `
            <div class="gallery-item" data-id="${itemId}" onclick="openImageModal(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                <div class="gallery-item-media">
                    <img src="${getImageUrl(item.url)}" alt="${getItemTitle(item)}" loading="lazy">
                    ${isPremium ? '<div class="premium-badge">Premium</div>' : ''}
                </div>
                <div class="gallery-item-info">
                    <div class="gallery-item-stats">
                        <button class="stat-btn ${isLiked ? 'active' : ''}" onclick="event.stopPropagation(); toggleLike(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span>${formatNumber(item.reactionCount || 0)}</span>
                        </button>
                        <button class="stat-btn ${isSaved ? 'active' : ''}" onclick="event.stopPropagation(); toggleSave(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
};

// Render VIP videos (premium content from main feed)
const renderVipVideos = () => {
    // This can show premium videos from the main feed in VIP section
    // For now, we'll keep it simple and just use the VIP list
    renderVIPList();
};

// Render saved videos
const renderSavedVideos = () => {
    // This would render a saved videos section if you have one
    // For now, saved items are tracked in state.userData.saved
};

// Update user UI
const updateUserUI = () => {
    const authPrompt = document.getElementById('vip-auth-prompt');

    if (state.user) {
        // User is signed in
        if (authPrompt) authPrompt.style.display = 'none';

        // Sync from Firebase
        if (window.initFirebase) {
            window.initFirebase();
            syncFromFirebase();
        }
    } else {
        // User is not signed in - show auth prompt when trying to use VIP features
        // (handled by requireAuth function)
    }
};

// ===== UPDATE INIT FUNCTION =====
// Add to your existing init() function:
/*
const init = () => {
    // ... existing code ...
    
    // Initialize VIP player
    initVIPPlayer();
    
    // Initialize Firebase
    if (window.initFirebase) {
        window.initFirebase();
    }
    
    // ... rest of existing code ...
};
*/
