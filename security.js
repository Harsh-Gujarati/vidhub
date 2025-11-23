// ===== SECURITY & ANTI-DEBUGGING PROTECTION =====

(function () {
    'use strict';

    // ===== DISABLE DEVELOPER TOOLS =====

    // Detect DevTools opening
    const devtools = {
        isOpen: false,
        orientation: null
    };

    const threshold = 160;
    const emitEvent = (isOpen, orientation) => {
        window.dispatchEvent(new CustomEvent('devtoolschange', {
            detail: { isOpen, orientation }
        }));
    };

    const main = ({ emitEvents = true } = {}) => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        const orientation = widthThreshold ? 'vertical' : 'horizontal';

        if (!(heightThreshold && widthThreshold) &&
            ((window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) || widthThreshold || heightThreshold)) {
            if ((!devtools.isOpen || devtools.orientation !== orientation) && emitEvents) {
                emitEvent(true, orientation);
            }
            devtools.isOpen = true;
            devtools.orientation = orientation;
        } else {
            if (devtools.isOpen && emitEvents) {
                emitEvent(false, null);
            }
            devtools.isOpen = false;
            devtools.orientation = null;
        }
    };

    main({ emitEvents: false });
    setInterval(main, 500);

    // ===== DISABLE RIGHT CLICK =====
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showSecurityAlert();
        return false;
    });

    // ===== DISABLE KEYBOARD SHORTCUTS =====
    document.addEventListener('keydown', (e) => {
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+Shift+C
        if (
            e.keyCode === 123 || // F12
            (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
            (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
            (e.ctrlKey && e.keyCode === 85) || // Ctrl+U
            (e.ctrlKey && e.shiftKey && e.keyCode === 67) // Ctrl+Shift+C
        ) {
            e.preventDefault();
            showSecurityAlert();
            return false;
        }
    });

    // ===== DISABLE TEXT SELECTION & COPY =====
    document.addEventListener('selectstart', (e) => {
        e.preventDefault();
        return false;
    });

    document.addEventListener('copy', (e) => {
        e.preventDefault();
        showSecurityAlert();
        return false;
    });

    // ===== DETECT DEBUGGER =====
    const detectDebugger = () => {
        const start = new Date();
        debugger;
        const end = new Date();
        if (end - start > 100) {
            document.body.innerHTML = '<h1 style="color: red; text-align: center; margin-top: 50px;">Debugging Detected! Access Denied.</h1>';
            window.location.href = 'about:blank';
        }
    };

    setInterval(detectDebugger, 1000);

    // ===== DETECT CONSOLE =====
    let consoleCheck = setInterval(() => {
        const before = new Date();
        debugger;
        const after = new Date();
        if (after - before > 100) {
            window.location.href = 'about:blank';
        }
    }, 1000);

    // ===== OVERRIDE CONSOLE METHODS =====
    const noop = () => { };
    const consoleProxy = new Proxy(console, {
        get(target, prop) {
            if (typeof target[prop] === 'function') {
                return noop;
            }
            return target[prop];
        }
    });

    try {
        Object.defineProperty(window, 'console', {
            get() {
                return consoleProxy;
            }
        });
    } catch (e) { }

    // ===== DETECT DEVTOOLS CHANGE =====
    window.addEventListener('devtoolschange', (e) => {
        if (e.detail.isOpen) {
            // Redirect or show warning
            document.body.innerHTML = '<h1 style="color: red; text-align: center; margin-top: 50px;">Developer Tools Detected! Please close to continue.</h1>';
            setTimeout(() => {
                window.location.href = 'about:blank';
            }, 2000);
        }
    });

    // ===== SHOW SECURITY ALERT =====
    function showSecurityAlert() {
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem 3rem;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 999999;
            font-family: 'Inter', sans-serif;
            text-align: center;
            animation: slideIn 0.3s ease-out;
        `;
        alertDiv.innerHTML = `
            <h2 style="margin: 0 0 1rem 0; font-size: 1.5rem;">⚠️ Security Alert</h2>
            <p style="margin: 0; font-size: 1rem;">This action is not allowed for security reasons.</p>
        `;
        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.remove();
        }, 2000);
    }

    // ===== OBFUSCATE SOURCE CODE =====
    // Prevent viewing page source
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && (e.keyCode === 85 || e.keyCode === 83)) {
            e.preventDefault();
            showSecurityAlert();
            return false;
        }
    });

    // ===== ANTI-SCREENSHOT =====
    document.addEventListener('keyup', (e) => {
        if (e.key === 'PrintScreen') {
            navigator.clipboard.writeText('');
            showSecurityAlert();
        }
    });

    // ===== DETECT IFRAME EMBEDDING =====
    if (window.top !== window.self) {
        window.top.location = window.self.location;
    }

    // ===== WATERMARK OVERLAY (OPTIONAL) =====
    const createWatermark = () => {
        const watermark = document.createElement('div');
        watermark.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999998;
            opacity: 0.03;
            background-image: repeating-linear-gradient(
                45deg,
                transparent,
                transparent 100px,
                rgba(255,255,255,0.1) 100px,
                rgba(255,255,255,0.1) 200px
            );
        `;
        watermark.setAttribute('data-watermark', 'protected');
        document.body.appendChild(watermark);
    };

    // ===== DETECT AUTOMATION TOOLS =====
    const detectAutomation = () => {
        // Check for common automation indicators
        if (navigator.webdriver) {
            window.location.href = 'about:blank';
        }

        // Check for headless browsers
        if (!navigator.plugins.length && !navigator.mimeTypes.length) {
            window.location.href = 'about:blank';
        }
    };

    // ===== INITIALIZE PROTECTION =====
    window.addEventListener('load', () => {
        createWatermark();
        detectAutomation();

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translate(-50%, -60%);
                    opacity: 0;
                }
                to {
                    transform: translate(-50%, -50%);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    });

    // ===== PROTECT AGAINST TAMPERING =====
    Object.freeze(Object.prototype);
    Object.freeze(Array.prototype);
    Object.freeze(Function.prototype);

    // ===== CLEAR CONSOLE PERIODICALLY =====
    setInterval(() => {
        if (window.console && window.console.clear) {
            try {
                console.clear();
            } catch (e) { }
        }
    }, 2000);

    // ===== MONITOR DOM CHANGES =====
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        // Check for suspicious scripts or iframes
                        if (node.tagName === 'SCRIPT' || node.tagName === 'IFRAME') {
                            if (!node.hasAttribute('data-allowed')) {
                                node.remove();
                            }
                        }
                    }
                });
            }
        });
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    // ===== PREVENT DRAG & DROP =====
    document.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
    });

    // ===== LOG SECURITY EVENTS (OPTIONAL) =====
    const logSecurityEvent = (eventType) => {
        // You can send this to your analytics or logging service
        const event = {
            type: eventType,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        // console.log('Security Event:', event);
        // Send to your backend if needed
    };

    // ===== ANTI-SCRAPING: RATE LIMITING =====
    let requestCount = 0;
    const requestLimit = 100;
    const timeWindow = 60000; // 1 minute

    setInterval(() => {
        requestCount = 0;
    }, timeWindow);

    const originalFetch = window.fetch;
    window.fetch = function (...args) {
        requestCount++;
        if (requestCount > requestLimit) {
            logSecurityEvent('rate_limit_exceeded');
            return Promise.reject(new Error('Rate limit exceeded'));
        }
        return originalFetch.apply(this, args);
    };

    // ===== PROTECT AGAINST MEMORY DUMPS =====
    const sensitiveData = new WeakMap();

    // Store sensitive data in WeakMap instead of regular objects
    window.secureStorage = {
        set: (key, value) => {
            const obj = {};
            sensitiveData.set(obj, { key, value });
            return obj;
        },
        get: (obj) => {
            return sensitiveData.get(obj);
        }
    };

    console.log('%c⚠️ SECURITY WARNING', 'color: red; font-size: 24px; font-weight: bold;');
    console.log('%cThis is a browser feature intended for developers.', 'font-size: 16px;');
    console.log('%cIf someone told you to copy-paste something here, it is a scam.', 'font-size: 16px;');
    console.log('%cPasting anything here can give attackers access to your data.', 'font-size: 16px; color: red;');

})();
