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
    theme: localStorage.getItem('theme') || 'dark'
};

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

// ===== RENDER FUNCTIONS =====
const renderVideos = () => {
    const galleryEl = document.getElementById('videos-gallery');
    if (!galleryEl) return;

    galleryEl.innerHTML = state.videos.items.map((item, index) => {
        const videoUrl = getVideoUrl(item.url);
        const username = item.user?.username || 'Unknown';
        const userImage = item.user?.image;
        const isPremium = isPremiumContent(item);

        return `
            <div class="gallery-item" data-index="${index}" style="animation-delay: ${(index % 12) * 0.05}s">
                ${isPremium ? '<div class="premium-badge">Premium</div>' : ''}
                <div class="gallery-item-media">
                    <video 
                        src="${videoUrl}" 
                        muted 
                        loop 
                        playsinline
                        onmouseenter="this.play()" 
                        onmouseleave="this.pause()"
                        preload="metadata"
                    ></video>
                    <div class="gallery-item-overlay">
                        <div class="play-icon">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="gallery-item-info">
                    <div class="gallery-item-stats">
                        <span class="stat">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            ${formatNumber(item.reactionCount)}
                        </span>
                        <span class="stat">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            ${formatNumber(item.commentCount)}
                        </span>
                        <span class="stat">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                            </svg>
                            ${formatNumber(item.collectedCount)}
                        </span>
                    </div>
                    <div class="gallery-item-user">
                        <div class="user-avatar">
                            ${userImage ? `<img src="${userImage}" alt="${username}">` : getUserInitials(username)}
                        </div>
                        <span class="user-name">${username}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers
    galleryEl.querySelectorAll('.gallery-item').forEach((el) => {
        el.addEventListener('click', () => {
            const index = parseInt(el.dataset.index);
            openVideoModal(state.videos.items[index]);
        });
    });
};

const renderImages = () => {
    const galleryEl = document.getElementById('images-gallery');
    if (!galleryEl) return;

    galleryEl.innerHTML = state.images.items.map((item, index) => {
        const imageUrl = getImageUrl(item.url);
        const username = item.user?.username || 'Unknown';
        const userImage = item.user?.image;
        const isPremium = isPremiumContent(item);

        return `
            <div class="gallery-item" data-index="${index}" style="animation-delay: ${(index % 12) * 0.05}s">
                ${isPremium ? '<div class="premium-badge">Premium</div>' : ''}
                <div class="gallery-item-media">
                    <img 
                        src="${imageUrl}" 
                        alt="Image by ${username}"
                        loading="lazy"
                    >
                </div>
                <div class="gallery-item-info">
                    <div class="gallery-item-stats">
                        <span class="stat">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            ${formatNumber(item.reactionCount)}
                        </span>
                        <span class="stat">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            ${formatNumber(item.commentCount)}
                        </span>
                        <span class="stat">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                            </svg>
                            ${formatNumber(item.collectedCount)}
                        </span>
                    </div>
                    <div class="gallery-item-user">
                        <div class="user-avatar">
                            ${userImage ? `<img src="${userImage}\" alt="${username}">` : getUserInitials(username)}
                        </div>
                        <span class="user-name">${username}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers
    galleryEl.querySelectorAll('.gallery-item').forEach((el) => {
        el.addEventListener('click', () => {
            const index = parseInt(el.dataset.index);
            openImageModal(state.images.items[index]);
        });
    });
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
