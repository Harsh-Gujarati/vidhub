// Initialize Ad Manager
let adManager = null;

const instantiateAdManager = () => {
    if (adManager) return;
    adManager = new AdManager();
    window.adManager = adManager;
    document.dispatchEvent(new CustomEvent('adManagerReady', { detail: adManager }));
};

// Start loading ads when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', instantiateAdManager);
} else {
    instantiateAdManager();
}

// ===== AD MANAGER =====
// Manages Adsterra ads
class AdManager {
    constructor() {
        this.adContainers = new Map();
        this.isMobile = window.innerWidth <= 768;
        this.socialBarLoaded = false;

        // Track which ads have been initialized
        this.initializedAds = new Set();

        // Initialize
        this.init();
    }

    init() {
        // Load popunder & social bar immediately (works for both desktop and mobile)
        this.loadPopunder();
        this.loadSocialBar();

        // Load initial ads
        this.loadHeaderAd();

        // Listen for scroll to lazy load ads
        this.setupLazyLoading();
    }

    markContainerSafe(container) {
        if (!container) return;
        container.setAttribute('data-allow-scripts', 'true');
    }

    // Load popunder ad (Adsterra only)
    loadPopunder() {
        if (this.initializedAds.has('popunder')) return;

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://warhealthy.com/87/11/5a/87115acd9552baa3c90beda2f274dc8e.js';
        script.setAttribute('data-allowed', '');
        document.body.appendChild(script);

        this.initializedAds.add('popunder');
        console.log('Popunder ad loaded');
    }

    // Load Adsterra social bar (desktop & mobile)
    loadSocialBar() {
        if (this.socialBarLoaded) return;

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = 'https://warhealthy.com/6e/25/4b/6e254b551a00fbe395397862809d8b31.js';
        script.setAttribute('data-allowed', '');
        document.body.appendChild(script);

        this.socialBarLoaded = true;
        console.log('Social bar loaded');
    }

    // Load header ad (desktop: 728x90, mobile: 320x50)
    loadHeaderAd() {
        const container = document.getElementById('header-ad-container');
        if (!container) return;
        this.markContainerSafe(container);

        if (this.isMobile) {
            this.loadAdsterraMobileBanner(container, 'header');
        } else {
            this.loadAdsterraDesktopBanner(container, 'header');
        }
    }

    // Load Adsterra Desktop Banner (728x90)
    loadAdsterraDesktopBanner(container, adId = 'desktop-banner') {
        const uniqueId = `adsterra-desktop-banner-${adId}`;
        if (this.initializedAds.has(uniqueId)) return;

        const adHtml = `
            <div class="adsterra-banner">
                <script type="text/javascript">
                    atOptions = {
                        'key' : '5c864e04a217fd55138f61168bcb91a9',
                        'format' : 'iframe',
                        'height' : 90,
                        'width' : 728,
                        'params' : {}
                    };
                </script>
                <script type="text/javascript" src="https://warhealthy.com/5c864e04a217fd55138f61168bcb91a9/invoke.js"></script>
            </div>
        `;

        container.innerHTML = adHtml;
        container.classList.add('ad-loaded', 'adsterra-ad');
        this.initializedAds.add(uniqueId);

        // Execute scripts
        this.executeScripts(container);
    }

    // Load Adsterra Mobile Banner (320x50)
    loadAdsterraMobileBanner(container, adId = 'mobile-banner') {
        const uniqueId = `adsterra-mobile-banner-${adId}`;
        if (this.initializedAds.has(uniqueId)) return;

        const adHtml = `
            <div class="adsterra-banner">
                <script type="text/javascript">
                    atOptions = {
                        'key' : '5dc248752b1180e6817864a61efebc1a',
                        'format' : 'iframe',
                        'height' : 50,
                        'width' : 320,
                        'params' : {}
                    };
                </script>
                <script type="text/javascript" src="https://warhealthy.com/5dc248752b1180e6817864a61efebc1a/invoke.js"></script>
            </div>
        `;

        container.innerHTML = adHtml;
        container.classList.add('ad-loaded', 'adsterra-ad');
        this.initializedAds.add(uniqueId);

        // Execute scripts
        this.executeScripts(container);
    }

    // Load Adsterra Native Banner
    loadAdsterraNative(container, adId) {
        const uniqueId = `adsterra-native-${adId}`;
        if (this.initializedAds.has(uniqueId)) return;

        const adHtml = `
            <div class="adsterra-native">
                <script async="async" data-cfasync="false" src="https://warhealthy.com/43c72195bc0c32d143a2ea7687d2c6f9/invoke.js"></script>
                <div id="container-43c72195bc0c32d143a2ea7687d2c6f9"></div>
            </div>
        `;

        container.innerHTML = adHtml;
        container.classList.add('ad-loaded', 'adsterra-ad');
        this.initializedAds.add(uniqueId);

        // Execute scripts
        this.executeScripts(container);
    }

    // Execute scripts in dynamically added content
    executeScripts(container) {
        const scripts = container.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            newScript.textContent = oldScript.textContent;
            newScript.setAttribute('data-allowed', '');
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }

    // Setup lazy loading for in-content ads
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const container = entry.target;
                        const adType = container.dataset.adType;
                        const adId = container.dataset.adId;

                        if (!container.classList.contains('ad-loaded')) {
                            this.loadAdByType(container, adType, adId);
                        }

                        observer.unobserve(container);
                    }
                });
            }, {
                rootMargin: '200px' // Load ads 200px before they come into view
            });

            // Observe all ad containers with datasets
            document.querySelectorAll('.ad-container').forEach(container => {
                if (!container.dataset.adType || !container.dataset.adId) {
                    return;
                }
                observer.observe(container);
            });
        } else {
            // Fallback: load all ads immediately
            document.querySelectorAll('.ad-container').forEach(container => {
                if (!container.dataset.adType || !container.dataset.adId) {
                    return;
                }
                const adType = container.dataset.adType;
                const adId = container.dataset.adId;
                this.loadAdByType(container, adType, adId);
            });
        }
    }

    // Load ad based on type
    loadAdByType(container, adType, adId) {
        // Always use Adsterra Native for in-content spots
        this.loadAdsterraNative(container, adId);
    }

    // Public method to add in-content ad after gallery items
    addInContentAd(galleryContainer, position, options = {}) {
        const {
            adType = 'in-feed',
            adId = `content-${position}`
        } = options;

        const adContainer = document.createElement('div');
        adContainer.className = 'ad-container in-content-ad';
        adContainer.dataset.adType = adType;
        adContainer.dataset.adId = adId;
        adContainer.setAttribute('data-allow-scripts', 'true');

        const galleryItems = galleryContainer.querySelectorAll('.gallery-item');
        if (galleryItems.length > position) {
            galleryItems[position].insertAdjacentElement('afterend', adContainer);

            // Load ad if in viewport, otherwise lazy load
            this.setupLazyLoading();
        }
    }
}
