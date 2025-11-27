// Initialize Ad Manager
let adManager = null;

const instantiateAdManager = () => {
    if (adManager) return;
    adManager = new AdManager();
    window.adManager = adManager;
    document.dispatchEvent(new CustomEvent('adManagerReady', { detail: adManager }));
};

// Load AdSense script first
const loadAdSenseScript = () => {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9258235332675012';
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-allowed', '');
    script.onerror = () => {
        console.log('AdSense script failed to load');
        instantiateAdManager();
    };
    script.onload = () => {
        console.log('AdSense script loaded');
        instantiateAdManager();
    };
    document.head.appendChild(script);
};

// Start loading ads when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAdSenseScript);
} else {
    loadAdSenseScript();
}
// ===== AD MANAGER =====
// Manages AdSense (primary) and Adsterra (fallback) ads with smart detection

class AdManager {
    constructor() {
        this.adSenseLoaded = false;
        this.adSenseTimeout = 3000; // 3 seconds timeout for AdSense
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

        // Check if AdSense is available
        this.checkAdSense().then(isAvailable => {
            this.adSenseLoaded = isAvailable;
            console.log('AdSense available:', isAvailable);

            // Load initial ads
            this.loadHeaderAd();
            this.loadInContentAds();
        });

        // Listen for scroll to lazy load ads
        this.setupLazyLoading();
    }

    markContainerSafe(container) {
        if (!container) return;
        container.setAttribute('data-allow-scripts', 'true');
    }

    // Check if AdSense is loaded and working
    async checkAdSense() {
        return new Promise((resolve) => {
            // Set timeout
            const timeout = setTimeout(() => {
                console.log('AdSense timeout - using fallback');
                resolve(false);
            }, this.adSenseTimeout);

            // Check if adsbygoogle is available
            if (typeof window.adsbygoogle !== 'undefined') {
                clearTimeout(timeout);
                resolve(true);
            } else {
                // Wait a bit and check again
                setTimeout(() => {
                    if (typeof window.adsbygoogle !== 'undefined') {
                        clearTimeout(timeout);
                        resolve(true);
                    } else {
                        clearTimeout(timeout);
                        resolve(false);
                    }
                }, 1000);
            }
        });
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

        if (this.adSenseLoaded) {
            // Try AdSense first
            this.loadAdSenseDisplay(container, 'header');
        } else {
            // Use Adsterra
            if (this.isMobile) {
                this.loadAdsterraMobileBanner(container, 'header');
            } else {
                this.loadAdsterraDesktopBanner(container, 'header');
            }
        }
    }

    // Load in-content ads (between gallery items)
    loadInContentAds() {
        // These will be loaded dynamically as content loads
        // Called from app.js after rendering gallery items
    }

    // Load AdSense Display Ad
    loadAdSenseDisplay(container, adId) {
        if (this.initializedAds.has(`adsense-${adId}`)) return;

        const adHtml = `
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="ca-pub-9258235332675012"
                 data-ad-slot="9026742119"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
        `;

        container.innerHTML = adHtml;
        container.classList.add('ad-loaded');
        this.markContainerSafe(container);

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            this.initializedAds.add(`adsense-${adId}`);

            // Check if ad loaded successfully after 2 seconds
            setTimeout(() => {
                this.checkAdLoaded(container, adId);
            }, 2000);
        } catch (e) {
            console.error('AdSense error:', e);
            this.loadFallbackAd(container, adId);
        }
    }

    // Load AdSense In-Article Ad
    loadAdSenseInArticle(container, adId) {
        if (this.initializedAds.has(`adsense-article-${adId}`)) return;

        const adHtml = `
            <ins class="adsbygoogle"
                 style="display:block; text-align:center;"
                 data-ad-layout="in-article"
                 data-ad-format="fluid"
                 data-ad-client="ca-pub-9258235332675012"
                 data-ad-slot="5195292409"></ins>
        `;

        container.innerHTML = adHtml;
        container.classList.add('ad-loaded');
        this.markContainerSafe(container);

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            this.initializedAds.add(`adsense-article-${adId}`);

            setTimeout(() => {
                this.checkAdLoaded(container, adId);
            }, 2000);
        } catch (e) {
            console.error('AdSense error:', e);
            this.loadFallbackAd(container, adId);
        }
    }

    // Load AdSense In-Feed Ad
    loadAdSenseInFeed(container, adId) {
        if (this.initializedAds.has(`adsense-feed-${adId}`)) return;

        const adHtml = `
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-format="fluid"
                 data-ad-layout-key="-73+ed+2i-1n-4w"
                 data-ad-client="ca-pub-9258235332675012"
                 data-ad-slot="7629884051"></ins>
        `;

        container.innerHTML = adHtml;
        container.classList.add('ad-loaded');
        this.markContainerSafe(container);

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            this.initializedAds.add(`adsense-feed-${adId}`);

            setTimeout(() => {
                this.checkAdLoaded(container, adId);
            }, 2000);
        } catch (e) {
            console.error('AdSense error:', e);
            this.loadFallbackAd(container, adId);
        }
    }

    // Load AdSense Multiplex Ad
    loadAdSenseMultiplex(container, adId) {
        if (this.initializedAds.has(`adsense-multiplex-${adId}`)) return;

        const adHtml = `
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-format="autorelaxed"
                 data-ad-client="ca-pub-9258235332675012"
                 data-ad-slot="8731939089"></ins>
        `;

        container.innerHTML = adHtml;
        container.classList.add('ad-loaded');
        this.markContainerSafe(container);

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            this.initializedAds.add(`adsense-multiplex-${adId}`);

            setTimeout(() => {
                this.checkAdLoaded(container, adId);
            }, 2000);
        } catch (e) {
            console.error('AdSense error:', e);
            this.loadFallbackAd(container, adId);
        }
    }

    // Check if AdSense ad loaded successfully
    checkAdLoaded(container, adId) {
        const ins = container.querySelector('ins.adsbygoogle');
        if (!ins) {
            this.loadFallbackAd(container, adId);
            return;
        }

        // Check if ad has been filled
        const isAdFilled = ins.getAttribute('data-ad-status') === 'filled' ||
            ins.offsetHeight > 0;

        if (!isAdFilled) {
            console.log(`AdSense ad ${adId} not filled, loading fallback`);
            this.loadFallbackAd(container, adId);
        }
    }

    // Load fallback ad (Adsterra)
    loadFallbackAd(container, adId) {
        // Clear AdSense ad
        container.innerHTML = '';
        this.markContainerSafe(container);

        // Load appropriate Adsterra ad based on position
        if (adId && adId.includes('header')) {
            if (this.isMobile) {
                this.loadAdsterraMobileBanner(container, adId);
            } else {
                this.loadAdsterraDesktopBanner(container, adId);
            }
        } else {
            // Use native banner for in-content
            this.loadAdsterraNative(container, adId);
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
        if (this.adSenseLoaded) {
            switch (adType) {
                case 'display':
                    this.loadAdSenseDisplay(container, adId);
                    break;
                case 'in-article':
                    this.loadAdSenseInArticle(container, adId);
                    break;
                case 'in-feed':
                    this.loadAdSenseInFeed(container, adId);
                    break;
                case 'multiplex':
                    this.loadAdSenseMultiplex(container, adId);
                    break;
                default:
                    this.loadAdSenseDisplay(container, adId);
            }
        } else {
            // Use Adsterra fallback
            this.loadAdsterraNative(container, adId);
        }
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

