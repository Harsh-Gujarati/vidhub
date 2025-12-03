const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * TeraBox Resolver API Endpoint
 * 
 * This endpoint accepts a TeraBox share URL and resolves it to a direct video stream URL.
 * 
 * IMPORTANT: You need to plug in a working TeraBox resolver service.
 * Options:
 * 1. Use a third-party resolver API (if available and legal)
 * 2. Implement your own resolver using TeraBox's public APIs (respecting ToS)
 * 3. Use a service like Apify actors or similar
 * 
 * For now, this is a framework that expects a resolver service URL.
 */

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed. Use POST.' });
        return;
    }

    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            const { shareUrl } = JSON.parse(body);

            if (!shareUrl) {
                res.status(400).json({ error: 'shareUrl is required' });
                return;
            }

            // Validate TeraBox URL format
            if (!shareUrl.includes('terabox') && !shareUrl.includes('teraboxurl.com')) {
                res.status(400).json({ error: 'Invalid TeraBox URL' });
                return;
            }

            // TODO: Replace with your actual resolver service URL
            // Examples:
            // - Your own resolver service: process.env.TERABOX_RESOLVER_URL
            // - Third-party API: 'https://api.example.com/resolve-terabox'
            // - Apify actor: 'https://api.apify.com/v2/acts/YOUR_ACTOR_ID/run-sync'
            
            const RESOLVER_SERVICE_URL = process.env.TERABOX_RESOLVER_URL || 
                'https://your-resolver-service.com/resolve';

            // Call resolver service
            const resolvedData = await callResolverService(RESOLVER_SERVICE_URL, shareUrl);

            if (!resolvedData || !resolvedData.streamUrl) {
                res.status(502).json({ 
                    error: 'Failed to resolve TeraBox link. No stream URL returned.',
                    details: 'Please ensure your resolver service is configured correctly.'
                });
                return;
            }

            res.status(200).json({
                streamUrl: resolvedData.streamUrl,
                title: resolvedData.title || resolvedData.fileName || 'TeraBox Video',
                thumbnail: resolvedData.thumbnail || resolvedData.thumb || null,
                duration: resolvedData.duration || null,
                size: resolvedData.size || null
            });

        } catch (error) {
            console.error('TeraBox resolver error:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                message: error.message 
            });
        }
    });
};

/**
 * Calls the resolver service to get direct video URL
 * This is a placeholder - you need to implement or use an actual resolver
 */
async function callResolverService(resolverUrl, shareUrl) {
    return new Promise((resolve, reject) => {
        try {
            const urlObj = new URL(resolverUrl);
            const isHttps = urlObj.protocol === 'https:';
            const client = isHttps ? https : http;

            const postData = JSON.stringify({ 
                link: shareUrl,
                url: shareUrl 
            });

            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname + (urlObj.search || ''),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            };

            const req = client.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        if (res.statusCode !== 200) {
                            reject(new Error(`Resolver service returned ${res.statusCode}: ${data}`));
                            return;
                        }

                        const jsonData = JSON.parse(data);
                        
                        // Handle different response formats
                        if (jsonData.streamUrl) {
                            resolve(jsonData);
                        } else if (jsonData.directUrl || jsonData.url || jsonData.downloadUrl) {
                            resolve({
                                streamUrl: jsonData.directUrl || jsonData.url || jsonData.downloadUrl,
                                title: jsonData.title || jsonData.fileName,
                                thumbnail: jsonData.thumbnail || jsonData.thumb
                            });
                        } else {
                            reject(new Error('Resolver response format not recognized'));
                        }
                    } catch (parseError) {
                        reject(new Error(`Failed to parse resolver response: ${parseError.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Resolver request failed: ${error.message}`));
            });

            req.write(postData);
            req.end();

        } catch (error) {
            reject(error);
        }
    });
}

