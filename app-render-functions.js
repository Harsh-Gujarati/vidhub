// ===== COMPLETE RENDER FUNCTIONS FOR APP.JS =====
// Add these functions to your app.js file (they are currently missing)

// Render videos gallery
const renderVideos = () => {
    const galleryEl = document.getElementById('videos-gallery');
    if (!galleryEl) return;

    if (state.videos.items.length === 0) {
        galleryEl.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                <p>No videos found</p>
            </div>
        `;
        return;
    }

    const isLoggedIn = !!state.user;

    galleryEl.innerHTML = state.videos.items.map(item => {
        const itemId = getItemId(item);
        const isLiked = isLoggedIn && state.userData.likes.has(itemId);
        const isSaved = isLoggedIn && state.userData.saved.some(s => s.id === itemId);
        const isPremium = isPremiumContent(item);

        return `
            <div class="gallery-item" data-id="${itemId}">
                <div class="gallery-item-media" onclick='openVideoModal(${JSON.stringify(item).replace(/'/g, "\\'")})'> 
                    <video 
                        src="${getVideoUrl(item.url)}" 
                        poster="${getImageUrl(item.url, 250)}"
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
                        <span class="stat-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span>${formatNumber(item.reactionCount || 0)}</span>
                        </span>
                        ${isLoggedIn ? `
                            <button class="stat-btn ${isLiked ? 'active' : ''}" onclick='event.stopPropagation(); toggleLike(${JSON.stringify(item).replace(/'/g, "\\'")}); renderVideos();'>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                            </button>
                            <button class="stat-btn ${isSaved ? 'active' : ''}" onclick='event.stopPropagation(); toggleSave(${JSON.stringify(item).replace(/'/g, "\\'")}); renderVideos();'>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    console.log('Rendered', state.videos.items.length, 'videos');
};

// Render images gallery
const renderImages = () => {
    const galleryEl = document.getElementById('images-gallery');
    if (!galleryEl) return;

    if (state.images.items.length === 0) {
        galleryEl.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                <p>No images found</p>
            </div>
        `;
        return;
    }

    const isLoggedIn = !!state.user;

    galleryEl.innerHTML = state.images.items.map(item => {
        const itemId = getItemId(item);
        const isLiked = isLoggedIn && state.userData.likes.has(itemId);
        const isSaved = isLoggedIn && state.userData.saved.some(s => s.id === itemId);
        const isPremium = isPremiumContent(item);

        return `
            <div class="gallery-item" data-id="${itemId}" onclick='openImageModal(${JSON.stringify(item).replace(/'/g, "\\'")})'> 
                <div class="gallery-item-media">
                    <img src="${getImageUrl(item.url, 250)}" alt="${getItemTitle(item)}" loading="lazy">
                    ${isPremium ? '<div class="premium-badge">Premium</div>' : ''}
                </div>
                <div class="gallery-item-info">
                    <div class="gallery-item-stats">
                        <span class="stat-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span>${formatNumber(item.reactionCount || 0)}</span>
                        </span>
                        ${isLoggedIn ? `
                            <button class="stat-btn ${isLiked ? 'active' : ''}" onclick='event.stopPropagation(); toggleLike(${JSON.stringify(item).replace(/'/g, "\\'")}); renderImages();'>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                            </button>
                            <button class="stat-btn ${isSaved ? 'active' : ''}" onclick='event.stopPropagation(); toggleSave(${JSON.stringify(item).replace(/'/g, "\\'")}); renderImages();'>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    console.log('Rendered', state.images.items.length, 'images');
};

// Render VIP videos (premium content from main feed)
const renderVipVideos = () => {
    // This function can be used to show premium videos in VIP section
    // For now, we'll keep it simple
    console.log('VIP videos rendered');
};

// Render saved videos
const renderSavedVideos = () => {
    // This would render a saved videos section if you have one
    console.log('Saved videos:', state.userData.saved.length);
};

// Update user UI
const updateUserUI = () => {
    const authPrompt = document.getElementById('vip-auth-prompt');
    const userChip = document.querySelector('.user-chip');
    const signInButton = document.getElementById('google-signin-button');

    if (state.user) {
        // User is signed in
        if (authPrompt) authPrompt.style.display = 'none';

        // Update user chip if it exists
        if (userChip) {
            userChip.style.display = 'flex';
        }

        // Hide sign-in button
        if (signInButton && signInButton.parentElement) {
            signInButton.parentElement.style.display = 'none';
        }

        console.log('User signed in:', state.user.name);
    } else {
        // User is not signed in
        if (userChip) {
            userChip.style.display = 'none';
        }

        // Show sign-in button
        if (signInButton && signInButton.parentElement) {
            signInButton.parentElement.style.display = 'block';
        }

        console.log('User not signed in');
    }

    // Re-render galleries to update like/save buttons
    renderVideos();
    renderImages();
};

// ===== UPDATE TOGGLE FUNCTIONS TO NOT REQUIRE AUTH FOR DISPLAY =====

// Updated toggleLike - only works if logged in
const toggleLike = (item) => {
    if (!state.user) {
        alert('Please sign in to like content');
        focusAuthEntry();
        return;
    }

    const itemId = getItemId(item);

    if (state.userData.likes.has(itemId)) {
        state.userData.likes.delete(itemId);
    } else {
        state.userData.likes.add(itemId);
    }

    persistUserData();

    // Sync to Firebase if available
    if (window.FirebaseUserData && typeof syncToFirebase === 'function') {
        syncToFirebase();
    }
};

// Updated toggleSave - only works if logged in
const toggleSave = (item) => {
    if (!state.user) {
        alert('Please sign in to save content');
        focusAuthEntry();
        return;
    }

    const itemId = getItemId(item);
    const existingIndex = state.userData.saved.findIndex(saved => saved.id === itemId);

    if (existingIndex >= 0) {
        state.userData.saved.splice(existingIndex, 1);
    } else {
        state.userData.saved.unshift({
            id: itemId,
            timestamp: Date.now(),
            item
        });

        if (state.userData.saved.length > 30) {
            state.userData.saved = state.userData.saved.slice(0, 30);
        }
    }

    persistUserData();

    // Sync to Firebase if available
    if (window.FirebaseUserData && typeof syncToFirebase === 'function') {
        syncToFirebase();
    }
};

// ===== API DEBUGGING HELPER =====

// Add this to help debug API calls
const testCivitaiAPI = async () => {
    console.log('Testing Civitai API...');

    const params = {
        period: 'Month',
        periodMode: 'published',
        sort: 'Most Reactions',
        types: ['video'],
        withMeta: false,
        useIndex: true,
        browsingLevel: 28,
        include: ['cosmetics'],
        excludedTagIds: [415792, 426772, 5188, 5249, 130818, 130820, 133182, 5351, 306619, 154326, 161829, 163032],
        disablePoi: true,
        disableMinor: true,
        authed: true
    };

    const apiUrl = `https://civitai.com/api/trpc/image.getInfinite?input=${encodeURIComponent(JSON.stringify({ json: params }))}`;
    const proxyUrl = `${getProxyUrl()}/?url=${encodeURIComponent(apiUrl)}`;

    console.log('API URL:', apiUrl);
    console.log('Proxy URL:', proxyUrl);

    try {
        const response = await fetch(proxyUrl);
        console.log('Response status:', response.status);

        const data = await response.json();
        console.log('Response data:', data);

        if (data.result && data.result.data && data.result.data.json) {
            console.log('✅ API working! Items:', data.result.data.json.items.length);
            return true;
        } else {
            console.error('❌ Unexpected response structure:', data);
            return false;
        }
    } catch (error) {
        console.error('❌ API Error:', error);
        return false;
    }
};

// Call this in browser console to test: testCivitaiAPI()
window.testCivitaiAPI = testCivitaiAPI;

console.log('✅ Render functions loaded. Test API with: testCivitaiAPI()');
