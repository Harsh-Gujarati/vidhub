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
    premiumVideos: []
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
const fetchVideos = async (cursor = null) => {
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

        // Add cursor if provided (for pagination)
        if (cursor) {
            params.cursor = cursor;
        }

        // Wrap params in json object for API
        const apiUrl = `${API.videos.base}?input=${encodeURIComponent(JSON.stringify({ json: params }))}`;
        const proxyUrl = `${getProxyUrl()}/?url=${encodeURIComponent(apiUrl)}`;

        console.log('Fetching videos with cursor:', cursor);
        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (data.result && data.result.data && data.result.data.json) {
            const { items, nextCursor } = data.result.data.json;

            console.log('Received items:', items.length, 'Next cursor:', nextCursor);

            state.videos.items = cursor ? [...state.videos.items, ...items] : items;
            state.videos.cursor = nextCursor;

            renderVideos();
            renderVipVideos();

            if (nextCursor && loadMoreBtn) {
                loadMoreBtn.style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Error fetching videos:', error);
        if (galleryEl) {
            galleryEl.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <p>Failed to load videos. Please try again later.</p>
                </div>
            `;
        }
    } finally {
        state.videos.loading = false;
        if (loadingEl) loadingEl.style.display = 'none';
    }
};

const fetchImages = async (cursor = null) => {
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

        // Add cursor if provided (for pagination)
        if (cursor) {
            params.cursor = cursor;
        }

        // Wrap params in json object for API
        const apiUrl = `${API.images.base}?input=${encodeURIComponent(JSON.stringify({ json: params }))}`;
        const proxyUrl = `${getProxyUrl()}/?url=${encodeURIComponent(apiUrl)}`;

        console.log('Fetching images with cursor:', cursor);
        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (data.result && data.result.data && data.result.data.json) {
            const { items, nextCursor } = data.result.data.json;

            console.log('Received items:', items.length, 'Next cursor:', nextCursor);

            state.images.items = cursor ? [...state.images.items, ...items] : items;
            state.images.cursor = nextCursor;

            renderImages();

            if (nextCursor && loadMoreBtn) {
                loadMoreBtn.style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Error fetching images:', error);
        if (galleryEl) {
            galleryEl.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <p>Failed to load images. Please try again later.</p>
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

const closeVideoModal = () => {
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
    }
};

// ===== INITIALIZATION =====
const init = () => {
    // Set initial theme
    setTheme(state.theme);
    setupGoogleAuth();

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
            fetchVideos(state.videos.cursor);
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
        vipUpgradeBtn.addEventListener('click', handleVipUpgrade);
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
