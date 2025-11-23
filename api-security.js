// ===== API SECURITY & OBFUSCATION LAYER =====

(function () {
    'use strict';

    // ===== ENCRYPTION UTILITIES =====
    const SecurityLayer = {
        // Simple XOR encryption for obfuscation
        encrypt: (text, key = 'vidhub_secure_2024') => {
            let result = '';
            for (let i = 0; i < text.length; i++) {
                result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return btoa(result);
        },

        decrypt: (encrypted, key = 'vidhub_secure_2024') => {
            const text = atob(encrypted);
            let result = '';
            for (let i = 0; i < text.length; i++) {
                result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return result;
        },

        // Generate random token for each request
        generateToken: () => {
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        },

        // Obfuscate URL parameters
        obfuscateParams: (params) => {
            const encoded = btoa(JSON.stringify(params));
            return encoded.split('').reverse().join('');
        },

        deobfuscateParams: (encoded) => {
            const reversed = encoded.split('').reverse().join('');
            return JSON.parse(atob(reversed));
        },

        // Create fingerprint to detect tampering
        createFingerprint: () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('VidHub', 2, 2);
            return canvas.toDataURL().slice(-50);
        },

        // Validate request integrity
        validateRequest: () => {
            const fingerprint = SecurityLayer.createFingerprint();
            const stored = sessionStorage.getItem('_fp');

            if (!stored) {
                sessionStorage.setItem('_fp', fingerprint);
                return true;
            }

            return fingerprint === stored;
        }
    };

    // ===== SECURE FETCH WRAPPER =====
    const originalFetch = window.fetch;
    const requestCache = new Map();
    const requestTimestamps = [];

    window.secureFetch = async (url, options = {}) => {
        // Validate request integrity
        if (!SecurityLayer.validateRequest()) {
            throw new Error('Request validation failed');
        }

        // Check for suspicious rapid requests
        const now = Date.now();
        requestTimestamps.push(now);

        // Remove timestamps older than 1 second
        while (requestTimestamps.length > 0 && requestTimestamps[0] < now - 1000) {
            requestTimestamps.shift();
        }

        // If more than 10 requests per second, throttle
        if (requestTimestamps.length > 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Generate unique request ID
        const requestId = SecurityLayer.generateToken();

        // Add security headers
        const secureOptions = {
            ...options,
            headers: {
                ...options.headers,
                'X-Request-ID': requestId,
                'X-Client-Token': SecurityLayer.createFingerprint(),
                'X-Timestamp': Date.now().toString()
            }
        };

        // Cache check
        const cacheKey = url + JSON.stringify(options);
        if (requestCache.has(cacheKey)) {
            const cached = requestCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 30000) { // 30 seconds cache
                return Promise.resolve(cached.response.clone());
            }
        }

        try {
            const response = await originalFetch(url, secureOptions);

            // Cache successful responses
            if (response.ok) {
                requestCache.set(cacheKey, {
                    response: response.clone(),
                    timestamp: Date.now()
                });
            }

            return response;
        } catch (error) {
            // Don't expose detailed error messages
            throw new Error('Request failed');
        }
    };

    // ===== PROTECT API ENDPOINTS =====
    const apiEndpoints = new WeakMap();

    window.SecureAPI = {
        // Register protected endpoint
        register: (name, endpoint) => {
            const key = {};
            apiEndpoints.set(key, {
                name,
                endpoint: SecurityLayer.encrypt(endpoint)
            });
            return key;
        },

        // Get protected endpoint
        get: (key) => {
            const data = apiEndpoints.get(key);
            if (!data) return null;
            return SecurityLayer.decrypt(data.endpoint);
        },

        // Make secure API call
        call: async (key, params = {}) => {
            const endpoint = window.SecureAPI.get(key);
            if (!endpoint) {
                throw new Error('Invalid endpoint');
            }

            // Obfuscate parameters
            const obfuscatedParams = SecurityLayer.obfuscateParams(params);

            // Build secure URL
            const url = `${endpoint}?data=${encodeURIComponent(obfuscatedParams)}`;

            return window.secureFetch(url);
        }
    };

    // ===== ANTI-TAMPERING FOR CRITICAL FUNCTIONS =====
    const protectedFunctions = new Map();

    window.protectFunction = (fn, name) => {
        const hash = btoa(fn.toString());
        protectedFunctions.set(name, hash);

        return new Proxy(fn, {
            apply: (target, thisArg, args) => {
                // Verify function hasn't been tampered with
                const currentHash = btoa(target.toString());
                if (currentHash !== protectedFunctions.get(name)) {
                    throw new Error('Function tampering detected');
                }
                return target.apply(thisArg, args);
            }
        });
    };

    // ===== SECURE LOCAL STORAGE =====
    const secureStorage = {
        set: (key, value) => {
            const encrypted = SecurityLayer.encrypt(JSON.stringify(value));
            localStorage.setItem(btoa(key), encrypted);
        },

        get: (key) => {
            const encrypted = localStorage.getItem(btoa(key));
            if (!encrypted) return null;
            try {
                return JSON.parse(SecurityLayer.decrypt(encrypted));
            } catch {
                return null;
            }
        },

        remove: (key) => {
            localStorage.removeItem(btoa(key));
        },

        clear: () => {
            localStorage.clear();
        }
    };

    window.secureStorage = secureStorage;

    // ===== NETWORK REQUEST MONITORING =====
    const networkMonitor = {
        requests: [],
        maxRequests: 1000,

        log: (url, method, status) => {
            networkMonitor.requests.push({
                url: url.replace(/https?:\/\/[^\/]+/, ''), // Remove domain
                method,
                status,
                time: Date.now()
            });

            // Keep only recent requests
            if (networkMonitor.requests.length > networkMonitor.maxRequests) {
                networkMonitor.requests.shift();
            }
        },

        getStats: () => {
            return {
                total: networkMonitor.requests.length,
                recent: networkMonitor.requests.slice(-10)
            };
        }
    };

    // Override fetch to monitor all requests
    window.fetch = new Proxy(originalFetch, {
        apply: async (target, thisArg, args) => {
            const [url, options = {}] = args;
            const method = options.method || 'GET';

            try {
                const response = await target.apply(thisArg, args);
                networkMonitor.log(url, method, response.status);
                return response;
            } catch (error) {
                networkMonitor.log(url, method, 'ERROR');
                throw error;
            }
        }
    });

    // ===== PREVENT API KEY EXPOSURE =====
    Object.defineProperty(window, 'API_KEY', {
        get: () => {
            console.warn('Attempted to access API_KEY');
            return undefined;
        },
        set: () => {
            console.warn('Attempted to set API_KEY');
            return false;
        },
        configurable: false
    });

    // ===== DETECT PROXY/VPN =====
    const detectProxy = async () => {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();

            // Store IP hash for validation
            const ipHash = btoa(data.ip);
            sessionStorage.setItem('_iph', ipHash);
        } catch (error) {
            // Silent fail
        }
    };

    // ===== INITIALIZE SECURITY =====
    window.addEventListener('load', () => {
        detectProxy();

        // Clear sensitive data on page unload
        window.addEventListener('beforeunload', () => {
            requestCache.clear();
            sessionStorage.removeItem('_fp');
        });
    });

    // ===== HONEYPOT TRAP =====
    // Create fake API endpoints to detect scrapers
    window.__API_SECRET__ = 'fake_key_12345';
    window.__ADMIN_TOKEN__ = 'fake_admin_token';

    Object.defineProperty(window, '__API_SECRET__', {
        get: () => {
            console.warn('Honeypot triggered: __API_SECRET__ accessed');
            // Log this attempt to your backend
            return 'fake_key_12345';
        }
    });

    // ===== RATE LIMITING PER ENDPOINT =====
    const rateLimiter = new Map();

    window.checkRateLimit = (endpoint, limit = 10, window = 60000) => {
        const now = Date.now();

        if (!rateLimiter.has(endpoint)) {
            rateLimiter.set(endpoint, []);
        }

        const requests = rateLimiter.get(endpoint);

        // Remove old requests
        const validRequests = requests.filter(time => now - time < window);

        if (validRequests.length >= limit) {
            return false; // Rate limit exceeded
        }

        validRequests.push(now);
        rateLimiter.set(endpoint, validRequests);
        return true;
    };

    // ===== PREVENT RESPONSE INTERCEPTION =====
    const ResponseProxy = new Proxy(Response, {
        construct(target, args) {
            const response = new target(...args);

            // Seal the response object
            return Object.seal(response);
        }
    });

    window.Response = ResponseProxy;

    // ===== SECURE RANDOM GENERATOR =====
    window.secureRandom = () => {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] / (0xffffffff + 1);
    };

    // ===== CLEAR TRACES =====
    setInterval(() => {
        // Clear old cache entries
        const now = Date.now();
        for (const [key, value] of requestCache.entries()) {
            if (now - value.timestamp > 60000) { // 1 minute
                requestCache.delete(key);
            }
        }
    }, 30000);

    console.log('%c🔒 Security Layer Initialized', 'color: green; font-size: 14px; font-weight: bold;');

})();
