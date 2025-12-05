// ===== STATE MANAGEMENT =====
const state = {
    videos: {
        items: [],
        cursor: null,
        loading: false
    },
    images: {
        items: [],
        cursor: null,
        loading: false
    },
    currentSection: 'videos',
    theme: localStorage.getItem('theme') || 'dark',
    user: null,
    userStore: {},
    userData: null,
    premiumVideos: [],
    megaVideos: {
        items: [],
        loading: false
    }
};

let adInjectionSeed = 0;

const onAdManagerReady = (callback) => {
    if (window.adManager) {
        callback(window.adManager);
        return;
    }

    const handler = (event) => {
        callback(event.detail || window.adManager);
    };

    document.addEventListener('adManagerReady', handler, { once: true });
};

const STORAGE_KEYS = {
    user: 'plx_user_profile',
    userStore: 'plx_user_store'
};

const defaultUserData = () => ({
    likes: new Set(),
    saved: [],
    vip: false
});

const getStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.user));
    } catch (error) {
        console.warn('Failed to parse stored user', error);
        return null;
    }
};

const saveStoredUser = (user) => {
    if (user) {
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    } else {
        localStorage.removeItem(STORAGE_KEYS.user);
    }
};

const loadUserStore = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.userStore)) || {};
    } catch (error) {
        console.warn('Failed to parse user store', error);
        return {};
    }
};

const persistUserStore = (store) => {
    localStorage.setItem(STORAGE_KEYS.userStore, JSON.stringify(store));
};

const getUserId = (user = state.user) => {
    if (!user) return null;
    return user.sub || user.email || null;
};

const syncUserData = () => {
    state.userStore = loadUserStore();
    const userId = getUserId();
    if (!userId) {
        state.userData = defaultUserData();
        return;
    }

    const profile = state.userStore[userId] || { likes: [], saved: [], vip: false };
    state.userData = {
        likes: new Set(profile.likes || []),
        saved: profile.saved || [],
        vip: !!profile.vip
    };
};

const persistUserData = () => {
    const userId = getUserId();
    if (!userId) return;

    state.userStore[userId] = {
        likes: Array.from(state.userData.likes),
        saved: state.userData.saved,
        vip: state.userData.vip
    };

    persistUserStore(state.userStore);
};

state.user = getStoredUser();
syncUserData();
if (!state.userData) {
    state.userData = defaultUserData();
}

const GOOGLE_CLIENT_ID = document.body?.dataset?.googleClientId || '';

// ===== API CONFIGURATION =====
// Detect proxy URL based on environment
const getProxyUrl = () => {
    // Check if running on localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000';
    }
    // Use current domain for production (Vercel)
    return `${window.location.origin}/api/proxy`;
};

const API = {
    videos: {
        base: 'https://civitai.com/api/trpc/image.getInfinite',
        params: {
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
        }
    },
    images: {
        base: 'https://civitai.com/api/trpc/image.getInfinite',
        params: {
            period: 'Month',
            periodMode: 'published',
            sort: 'Most Reactions',
            types: ['image'],
            withMeta: false,
            useIndex: true,
            browsingLevel: 28,
            include: ['cosmetics'],
            excludedTagIds: [415792, 426772, 5188, 5249, 130818, 130820, 133182, 5351, 306619, 154326, 161829, 163032],
            disablePoi: true,
            disableMinor: true,
            authed: true
        }
    }
};

// ===== UTILITY FUNCTIONS =====
const formatNumber = (num) => {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
};

const getImageUrl = (url, width = 450) => {
    return `https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/${url}/width=${width}/`;
};

const getVideoUrl = (url) => {
    return `https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/${url}/transcode=true,width=450,optimized=true/`;
};

const getUserInitials = (username) => {
    if (!username) return '?';
    return username.charAt(0).toUpperCase();
};

const isPremiumContent = (item) => {
    // Check if content has premium indicators
    return item.availability === 'Premium' ||
        (item.stats && item.stats.tippedAmountCountAllTime > 0);
};

// ===== API FUNCTIONS =====
window.fetchVideos = async (cursor = null) => {
    if (state.videos.loading) return;

    state.videos.loading = true;
    const loadingEl = document.getElementById('videos-loading');
    const galleryEl = document.getElementById('videos-gallery');
    const loadMoreBtn = document.getElementById('load-more-videos');

    if (loadingEl) loadingEl.style.display = 'flex';
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';

    try {
        // Deep clone the params to avoid modifying the original
        const params = JSON.parse(JSON.stringify(API.videos.params));

        // Add cursor (null for first request, or nextCursor for pagination)
        params.cursor = cursor || null;

        // Wrap params in the exact format Civitai expects
        const input = {
            json: params,
            meta: {
                values: {
                    cursor: [cursor ? "defined" : "undefined"]
                }
            }
        };

        const apiUrl = `${API.videos.base}?input=${encodeURIComponent(JSON.stringify(input))}`;
        const proxyUrl = `${getProxyUrl()}/?url=${encodeURIComponent(apiUrl)}`;

        console.log('Fetching videos with cursor:', cursor);
        console.log('API URL:', apiUrl);

        const response = await fetch(proxyUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        if (data.result && data.result.data && data.result.data.json) {
            const { items, nextCursor } = data.result.data.json;

            console.log('✅ Received items:', items.length, 'Next cursor:', nextCursor);

            state.videos.items = cursor ? [...state.videos.items, ...items] : items;
            state.videos.cursor = nextCursor;

            renderVideos();
            renderVipVideos();

            if (nextCursor && loadMoreBtn) {
                loadMoreBtn.style.display = 'flex';
            }
        } else {
            console.error('❌ Unexpected API response structure:', data);
            throw new Error('Invalid API response structure');
        }
    } catch (error) {
        console.error('Error fetching videos:', error);
        if (galleryEl) {
            galleryEl.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity: 0.5; margin-bottom: 1rem;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p>Failed to load videos</p>
                    <p style="font-size: 0.875rem; opacity: 0.7; margin-top: 0.5rem;">${error.message}</p>
                    <button onclick="fetchVideos()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    } finally {
        state.videos.loading = false;
        if (loadingEl) loadingEl.style.display = 'none';
    }
};

window.fetchImages = async (cursor = null) => {
    if (state.images.loading) return;

    state.images.loading = true;
    const loadingEl = document.getElementById('images-loading');
    const galleryEl = document.getElementById('images-gallery');
    const loadMoreBtn = document.getElementById('load-more-images');

    if (loadingEl) loadingEl.style.display = 'flex';
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';

    try {
        // Deep clone the params to avoid modifying the original
        const params = JSON.parse(JSON.stringify(API.images.params));

        // Add cursor (null for first request, or nextCursor for pagination)
        params.cursor = cursor || null;

        // Wrap params in the exact format Civitai expects
        const input = {
            json: params,
            meta: {
                values: {
                    cursor: [cursor ? "defined" : "undefined"]
                }
            }
        };

        const apiUrl = `${API.images.base}?input=${encodeURIComponent(JSON.stringify(input))}`;
        const proxyUrl = `${getProxyUrl()}/?url=${encodeURIComponent(apiUrl)}`;

        console.log('Fetching images with cursor:', cursor);
        console.log('API URL:', apiUrl);

        const response = await fetch(proxyUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        if (data.result && data.result.data && data.result.data.json) {
            const { items, nextCursor } = data.result.data.json;

            console.log('✅ Received items:', items.length, 'Next cursor:', nextCursor);

            state.images.items = cursor ? [...state.images.items, ...items] : items;
            state.images.cursor = nextCursor;

            renderImages();

            if (nextCursor && loadMoreBtn) {
                loadMoreBtn.style.display = 'flex';
            }
        } else {
            console.error('❌ Unexpected API response structure:', data);
            throw new Error('Invalid API response structure');
        }
    } catch (error) {
        console.error('Error fetching images:', error);
        if (galleryEl) {
            galleryEl.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity: 0.5; margin-bottom: 1rem;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p>Failed to load images</p>
                    <p style="font-size: 0.875rem; opacity: 0.7; margin-top: 0.5rem;">${error.message}</p>
                    <button onclick="fetchImages()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    } finally {
        state.images.loading = false;
        if (loadingEl) loadingEl.style.display = 'none';
    }
};

const injectInFeedAds = (galleryEl, positions, prefix) => {
    if (!galleryEl || !positions?.length) return;

    const run = (manager) => {
        positions.forEach(position => {
            manager.addInContentAd(galleryEl, position, {
                adType: 'in-feed',
                adId: `${prefix}-infeed-${position}-${++adInjectionSeed}`
            });
        });
    };

    onAdManagerReady(run);
};

// ===== AUTH & USER EXPERIENCE =====
const focusAuthEntry = () => {
    const target = document.getElementById('google-signin-button');
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
};

const requireAuth = () => {
    if (state.user) return true;
    alert('Sign in with Google to use this feature.');
    focusAuthEntry();
    return false;
};

const decodeCredential = (credential) => {
    const payload = credential.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized);
    return JSON.parse(decoded);
};

const handleCredentialResponse = (response) => {
    if (!response?.credential) return;
    try {
        const payload = decodeCredential(response.credential);
        const user = {
            name: payload.name || payload.email,
            email: payload.email,
            picture: payload.picture,
            sub: payload.sub
        };

        state.user = user;
        saveStoredUser(user);
        syncUserData();
        updateUserUI();
        renderSavedVideos();
        renderVideos();
        renderVipVideos();
    } catch (error) {
        console.error('Failed to process Google credential', error);
    }
};

const logoutUser = () => {
    state.user = null;
    saveStoredUser(null);
    state.userData = defaultUserData();
    updateUserUI();
    renderSavedVideos();
    renderVideos();
    renderVipVideos();
};

const setupGoogleAuth = () => {
    updateUserUI();
    renderSavedVideos();

    if (!GOOGLE_CLIENT_ID) {
        console.warn('Missing Google Client ID. Update data-google-client-id on <body>.');
        return;
    }

    const renderButton = () => {
        if (!(window.google && window.google.accounts?.id)) {
            return false;
        }

        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse
        });

        const buttonParent = document.getElementById('google-signin-button');
        if (buttonParent) {
            buttonParent.innerHTML = '';
            window.google.accounts.id.renderButton(buttonParent, {
                theme: 'outline',
                size: 'medium',
                type: 'standard',
            });
        }

        return true;
    };

    if (!renderButton()) {
        const interval = setInterval(() => {
            if (renderButton()) {
                clearInterval(interval);
            }
        }, 400);
    }
};

const getItemId = (item) => item.id || item.hash || item.uuid || item.url || String(item.createdAt || Math.random());

const getItemTitle = (item) => item.title || item.name || item.meta?.name || `Video by ${item.user?.username || 'Unknown'}`;

const toggleLike = (item) => {
    if (!requireAuth()) return;
    const itemId = getItemId(item);

    if (state.userData.likes.has(itemId)) {
        state.userData.likes.delete(itemId);
    } else {
        state.userData.likes.add(itemId);
    }

    persistUserData();
    renderVideos();
    renderVipVideos();
};

const toggleSave = (item) => {
    if (!requireAuth()) return;
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
    renderVideos();

    injectInFeedAds(galleryEl, [4], 'images');
};

// ===== MODAL FUNCTIONS =====
const openVideoModal = (item) => {
    const modal = document.getElementById('video-modal');
    const video = document.getElementById('modal-video');
    const reactions = document.getElementById('modal-reactions');
    const comments = document.getElementById('modal-comments');
    const collected = document.getElementById('modal-collected');
    const userAvatar = document.getElementById('modal-user-avatar');
    const userName = document.getElementById('modal-user-name');

    if (!modal || !video) return;

    const videoUrl = getVideoUrl(item.url);
    const username = item.user?.username || 'Unknown';
    const userImage = item.user?.image;

    video.src = videoUrl;
    reactions.textContent = formatNumber(item.reactionCount);
    comments.textContent = formatNumber(item.commentCount);
    collected.textContent = formatNumber(item.collectedCount);
    userName.textContent = username;

    if (userImage) {
        userAvatar.innerHTML = `<img src="${userImage}" alt="${username}">`;
    } else {
        userAvatar.textContent = getUserInitials(username);
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closeVideoModal = () => {
    const modal = document.getElementById('video-modal');
    const video = document.getElementById('modal-video');

    if (!modal || !video) return;

    modal.classList.remove('active');
    video.pause();
    video.src = '';
    document.body.style.overflow = '';
};

const openImageModal = (item) => {
    const modal = document.getElementById('image-modal');
    const image = document.getElementById('modal-image');
    const reactions = document.getElementById('modal-image-reactions');
    const comments = document.getElementById('modal-image-comments');
    const collected = document.getElementById('modal-image-collected');
    const userAvatar = document.getElementById('modal-image-user-avatar');
    const userName = document.getElementById('modal-image-user-name');

    if (!modal || !image) return;

    const imageUrl = getImageUrl(item.url, 1200);
    const username = item.user?.username || 'Unknown';
    const userImage = item.user?.image;

    image.src = imageUrl;
    reactions.textContent = formatNumber(item.reactionCount);
    comments.textContent = formatNumber(item.commentCount);
    collected.textContent = formatNumber(item.collectedCount);
    userName.textContent = username;

    if (userImage) {
        userAvatar.innerHTML = `<img src="${userImage}" alt="${username}">`;
    } else {
        userAvatar.textContent = getUserInitials(username);
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

const closeImageModal = () => {
    const modal = document.getElementById('image-modal');
    const image = document.getElementById('modal-image');

    if (!modal || !image) return;

    modal.classList.remove('active');
    image.src = '';
    document.body.style.overflow = '';
};

// ===== RENDER FUNCTIONS =====
const renderVideos = () => {
    const galleryEl = document.getElementById('videos-gallery');
    if (!galleryEl) return;

    if (state.videos.items.length === 0) {
        return; // Loading spinner will show
    }

    const isLoggedIn = !!state.user;

    galleryEl.innerHTML = state.videos.items.map(item => {
        const itemId = getItemId(item);
        const isLiked = isLoggedIn && state.userData.likes.has(itemId);
        const isSaved = isLoggedIn && state.userData.saved.some(s => s.id === itemId);
        const isPremium = isPremiumContent(item);
        const itemJson = JSON.stringify(item).replace(/'/g, "\\'").replace(/"/g, '&quot;');

        return `
            <div class="gallery-item" data-id="${itemId}">
                <div class="gallery-item-media" onclick='openVideoModal(${itemJson})' style="cursor: pointer;"> 
                    <video 
                        src="${getVideoUrl(item.url)}" 
                        poster="${getImageUrl(item.url)}"
                        loop
                        muted
                        playsinline
                        onmouseenter="this.play()"
                        onmouseleave="this.pause()"
                        style="width: 100%; height: 100%; object-fit: cover;"
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
                            <button class="stat-btn ${isLiked ? 'active' : ''}" onclick='event.stopPropagation(); toggleLike(${itemJson}); renderVideos();'>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                            </button>
                            <button class="stat-btn ${isSaved ? 'active' : ''}" onclick='event.stopPropagation(); toggleSave(${itemJson}); renderVideos();'>
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

    console.log('✅ Rendered', state.videos.items.length, 'videos');
};

const renderImages = () => {
    const galleryEl = document.getElementById('images-gallery');
    if (!galleryEl) return;

    if (state.images.items.length === 0) {
        return; // Loading spinner will show
    }

    const isLoggedIn = !!state.user;

    galleryEl.innerHTML = state.images.items.map(item => {
        const itemId = getItemId(item);
        const isLiked = isLoggedIn && state.userData.likes.has(itemId);
        const isSaved = isLoggedIn && state.userData.saved.some(s => s.id === itemId);
        const isPremium = isPremiumContent(item);
        const itemJson = JSON.stringify(item).replace(/'/g, "\\'").replace(/"/g, '&quot;');

        return `
            <div class="gallery-item" data-id="${itemId}">
                <div class="gallery-item-media" onclick='openImageModal(${itemJson})' style="cursor: pointer;"> 
                    <img src="${getImageUrl(item.url)}" alt="${getItemTitle(item)}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;">
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
                            <button class="stat-btn ${isLiked ? 'active' : ''}" onclick='event.stopPropagation(); toggleLike(${itemJson}); renderImages();'>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                            </button>
                            <button class="stat-btn ${isSaved ? 'active' : ''}" onclick='event.stopPropagation(); toggleSave(${itemJson}); renderImages();'>
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

    console.log('✅ Rendered', state.images.items.length, 'images');
};

const renderVipVideos = () => {
    console.log('VIP videos rendered');
};

const renderSavedVideos = () => {
    console.log('Saved videos:', state.userData.saved.length);
};

const updateUserUI = () => {
    const authPrompt = document.getElementById('vip-auth-prompt');
    const userChip = document.querySelector('.user-chip');
    const signInButton = document.getElementById('google-signin-button');

    if (state.user) {
        // User is signed in
        if (authPrompt) authPrompt.style.display = 'none';

        if (userChip) {
            userChip.style.display = 'flex';
        }

        if (signInButton && signInButton.parentElement) {
            signInButton.parentElement.style.display = 'none';
        }

        console.log('✅ User signed in:', state.user.name);
    } else {
        // User is not signed in
        if (userChip) {
            userChip.style.display = 'none';
        }

        if (signInButton && signInButton.parentElement) {
            signInButton.parentElement.style.display = 'block';
        }

        console.log('ℹ️ User not signed in');
    }

    // Re-render galleries to update like/save buttons
    if (state.videos.items.length > 0) renderVideos();
    if (state.images.items.length > 0) renderImages();
};

// ===== THEME FUNCTIONS =====
const setTheme = (theme) => {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
};

const toggleTheme = () => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
};

// ===== NAVIGATION FUNCTIONS =====
const switchSection = (section) => {
    state.currentSection = section;

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === section);
    });

    // Update sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.toggle('active', sec.id === `${section}-section`);
    });

    // Load data if needed
    if (section === 'videos' && state.videos.items.length === 0) {
        fetchVideos();
    } else if (section === 'images' && state.images.items.length === 0) {
        fetchImages();
    } else if (section === 'terabox' && (!state.megaVideos || state.megaVideos.items.length === 0)) {
        fetchMegaVideos();
    }
};

// ===== VIP FUNCTIONS =====
const handleVipUpgrade = () => {
    alert('VIP upgrade feature coming soon!');
};

// ===== STREAM PLAYER =====
const initStreamPlayer = () => {
    const input = document.getElementById('stream-url-input');
    const btn = document.getElementById('stream-play-btn');
    const wrapper = document.getElementById('stream-player-wrapper');

    if (!input || !btn || !wrapper) return;

    const playVideo = () => {
        const url = input.value.trim();
        if (!url) return;

        // Extract Google Drive ID
        let videoId = null;

        // Patterns
        // https://drive.google.com/file/d/VIDEO_ID/view
        // https://drive.google.com/open?id=VIDEO_ID

        const patterns = [
            /file\/d\/([a-zA-Z0-9_-]+)/,
            /id=([a-zA-Z0-9_-]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                videoId = match[1];
                break;
            }
        }

        if (videoId) {
            // Google Drive Video
            wrapper.innerHTML = `
                <iframe 
                    src="https://drive.google.com/file/d/${videoId}/preview" 
                    class="stream-iframe" 
                    allow="autoplay; encrypted-media" 
                    allowfullscreen>
                </iframe>
            `;
        } else {
            // Try generic video tag for direct links
            wrapper.innerHTML = `
                <video controls autoplay class="stream-iframe" style="object-fit: contain; background: black;">
                    <source src="${url}">
                    Your browser does not support the video tag.
                </video>
            `;

            // Handle error
            const video = wrapper.querySelector('video');
            video.onerror = () => {
                wrapper.innerHTML = `
                    <div class="player-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1" style="opacity: 0.8;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <p style="color: #ef4444; text-align: center;">Could not play video.<br>Please ensure the URL is a direct link or a valid Google Drive link.</p>
                    </div>
                `;
            };
        }
    };

    btn.addEventListener('click', playVideo);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') playVideo();
    });
};

// ===== MEGA VIDEO SECTION =====
// Fetches videos from MEGA folder and displays them in a grid
// Set your MEGA folder URL here or via environment variable MEGA_FOLDER_URL
const MEGA_FOLDER_URL = 'https://mega.nz/folder/tvciAKjS#Qp3AqmE93ntkOnggUa7vqg';

const getMegaApiUrl = () => {
    // Check if running on localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000/api/mega/resolve';
    }
    // Use current domain for production (Vercel)
    return `${window.location.origin}/api/mega/resolve`;
};

const getMegaStreamUrl = (megaUrl, nodeId) => {
    const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : window.location.origin;
    return `${baseUrl}/api/mega-stream?megaUrl=${encodeURIComponent(megaUrl)}&nodeId=${encodeURIComponent(nodeId)}`;
};

const fetchMegaVideos = async () => {
    if (state.megaVideos.loading) return;

    state.megaVideos.loading = true;
    const loadingEl = document.getElementById('mega-loading');
    const galleryEl = document.getElementById('mega-gallery');

    if (loadingEl) loadingEl.style.display = 'flex';
    if (galleryEl) galleryEl.innerHTML = '';

    // Check if MEGA folder URL is configured
    if (MEGA_FOLDER_URL.includes('YOUR_FOLDER_ID') || !MEGA_FOLDER_URL.includes('mega.nz')) {
        state.megaVideos.loading = false;
        if (loadingEl) loadingEl.style.display = 'none';
        if (galleryEl) {
            galleryEl.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity: 0.5; margin-bottom: 1rem;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p>MEGA folder URL not configured</p>
                    <p style="font-size: 0.875rem; opacity: 0.7; margin-top: 0.5rem;">
                        Please set your MEGA folder URL in app.js (line 866) or set the MEGA_FOLDER_URL environment variable.
                    </p>
                    <p style="font-size: 0.75rem; opacity: 0.6; margin-top: 0.5rem;">
                        Format: https://mega.nz/folder/FOLDER_ID#KEY
                    </p>
                </div>
            `;
        }
        return;
    }

    try {
        const response = await fetch(getMegaApiUrl(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ megaUrl: MEGA_FOLDER_URL })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.videos || data.videos.length === 0) {
            throw new Error('No videos found in MEGA folder');
        }

        // Store videos in state
        state.megaVideos.items = data.videos.map(video => ({
            id: video.id,
            name: video.name,
            size: video.size,
            streamUrl: video.streamUrl,
            thumbnail: video.thumbnail,
            url: video.streamUrl, // For compatibility with existing functions
            megaUrl: MEGA_FOLDER_URL,
            nodeId: video.id
        }));

        renderMegaVideos();

    } catch (error) {
        console.error('MEGA fetch error:', error);
        if (galleryEl) {
            galleryEl.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity: 0.5; margin-bottom: 1rem;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p>Failed to load MEGA videos</p>
                    <p style="font-size: 0.875rem; opacity: 0.7; margin-top: 0.5rem;">${error.message}</p>
                </div>
            `;
        }
    } finally {
        state.megaVideos.loading = false;
        if (loadingEl) loadingEl.style.display = 'none';
    }
};

const renderMegaVideos = () => {
    const galleryEl = document.getElementById('mega-gallery');
    if (!galleryEl) return;

    if (state.megaVideos.items.length === 0) {
        return;
    }

    const isLoggedIn = !!state.user;

    galleryEl.innerHTML = state.megaVideos.items.map(item => {
        const itemId = getItemId(item);
        const isLiked = isLoggedIn && state.userData.likes.has(itemId);
        const isSaved = isLoggedIn && state.userData.saved.some(s => s.id === itemId);
        const itemJson = JSON.stringify(item).replace(/'/g, "\\'").replace(/"/g, '&quot;');

        // Use MEGA stream URL for video source
        const videoSrc = item.streamUrl?.proxy 
            ? getMegaStreamUrl(item.megaUrl, item.nodeId)
            : item.streamUrl;

        return `
            <div class="gallery-item" data-id="${itemId}">
                <div class="gallery-item-media" onclick='openMegaVideoModal(${itemJson})' style="cursor: pointer;">
                    <video 
                        src="${videoSrc}" 
                        poster="${item.thumbnail || ''}"
                        loop
                        muted
                        playsinline
                        onmouseenter="this.play()"
                        onmouseleave="this.pause()"
                        style="width: 100%; height: 100%; object-fit: cover;"
                    ></video>
                    <div class="premium-badge">MEGA</div>
                </div>
                <div class="gallery-item-info">
                    <div class="gallery-item-stats">
                        <span class="stat-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            <span>${item.name || 'Video'}</span>
                        </span>
                        ${isLoggedIn ? `
                            <button class="stat-btn ${isLiked ? 'active' : ''}" onclick='event.stopPropagation(); toggleLike(${itemJson}); renderMegaVideos();'>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                            </button>
                            <button class="stat-btn ${isSaved ? 'active' : ''}" onclick='event.stopPropagation(); toggleSave(${itemJson}); renderMegaVideos();'>
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

    console.log('✅ Rendered', state.megaVideos.items.length, 'MEGA videos');
};

// Open MEGA video in modal
window.openMegaVideoModal = (item) => {
    const modal = document.getElementById('video-modal');
    const video = document.getElementById('modal-video');
    const reactions = document.getElementById('modal-reactions');
    const comments = document.getElementById('modal-comments');
    const collected = document.getElementById('modal-collected');
    const userAvatar = document.getElementById('modal-user-avatar');
    const userName = document.getElementById('modal-user-name');

    if (!modal || !video) return;

    const videoSrc = item.streamUrl?.proxy 
        ? getMegaStreamUrl(item.megaUrl, item.nodeId)
        : item.streamUrl;

    // Set video source and ensure it plays
    video.src = videoSrc;
    video.load(); // Reload the video element
    
    reactions.textContent = '0';
    comments.textContent = '0';
    collected.textContent = '0';
    userName.textContent = item.name || 'MEGA Video';

    if (userAvatar) {
        userAvatar.textContent = 'M';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Try to play the video when modal opens
    video.play().catch(err => {
        console.log('Autoplay blocked, user will need to click play:', err);
    });
};

const initMegaVideos = () => {
    // MEGA videos state is already initialized in state object
    // This function is kept for consistency with other init functions
};

// ===== INITIALIZATION =====
const init = () => {
    // Set initial theme
    setTheme(state.theme);
    setupGoogleAuth();
    initStreamPlayer();
    initMegaVideos();

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchSection(btn.dataset.section);
        });
    });

    // Load more buttons
    const loadMoreVideos = document.getElementById('load-more-videos');
    if (loadMoreVideos) {
        loadMoreVideos.addEventListener('click', () => {
            if (state.videos.cursor) {
                window.fetchVideos(state.videos.cursor);
            } else {
                console.warn('No cursor available for loading more videos');
            }
        });
    }

    const loadMoreImages = document.getElementById('load-more-images');
    if (loadMoreImages) {
        loadMoreImages.addEventListener('click', () => {
            fetchImages(state.images.cursor);
        });
    }

    // Modal close buttons
    const closeVideoBtn = document.getElementById('close-video-modal');
    if (closeVideoBtn) {
        closeVideoBtn.addEventListener('click', closeVideoModal);
    }

    const closeImageBtn = document.getElementById('close-image-modal');
    if (closeImageBtn) {
        closeImageBtn.addEventListener('click', closeImageModal);
    }

    // Modal backdrop clicks
    const videoModal = document.getElementById('video-modal');
    if (videoModal) {
        videoModal.querySelector('.modal-backdrop')?.addEventListener('click', closeVideoModal);
    }

    const imageModal = document.getElementById('image-modal');
    if (imageModal) {
        imageModal.querySelector('.modal-backdrop')?.addEventListener('click', closeImageModal);
    }

    // Auth actions
    document.querySelectorAll('[data-logout]').forEach(btn => {
        btn.addEventListener('click', logoutUser);
    });

    const vipUpgradeBtn = document.getElementById('vip-upgrade-btn');
    if (vipUpgradeBtn) {
        vipUpgradeBtn.addEventListener('click', handleVipUpgrade); // Assuming handleVipUpgrade is defined elsewhere or this line was already there
    }

    const loginCTA = document.getElementById('user-login-cta');
    if (loginCTA) {
        loginCTA.addEventListener('click', focusAuthEntry);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeVideoModal();
            closeImageModal();
        }
    });

    // Initial data load
    fetchVideos();
};

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
