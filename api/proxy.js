const https = require('https');
const http = require('http');
const { URL } = require('url');

module.exports = (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // Parse the request URL
        const requestUrl = new URL(req.url, `http://${req.headers.host}`);
        const targetUrl = requestUrl.searchParams.get('url');

        if (!targetUrl) {
            res.status(400).json({ error: 'Missing url parameter' });
            return;
        }

        // Validate URL
        let targetUrlObj;
        try {
            targetUrlObj = new URL(targetUrl);
        } catch (e) {
            res.status(400).json({ error: 'Invalid URL format' });
            return;
        }

        // Determine protocol
        const isHttps = targetUrlObj.protocol === 'https:';
        const client = isHttps ? https : http;

        // Make request to the target URL
        const options = {
            hostname: targetUrlObj.hostname,
            port: targetUrlObj.port || (isHttps ? 443 : 80),
            path: targetUrlObj.pathname + targetUrlObj.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        };

        const proxyReq = client.request(options, (apiRes) => {
            let data = '';

            // Handle different status codes
            if (apiRes.statusCode < 200 || apiRes.statusCode >= 300) {
                console.error(`Proxy error: ${apiRes.statusCode} for ${targetUrl}`);
            }

            apiRes.on('data', (chunk) => {
                data += chunk;
            });

            apiRes.on('end', () => {
                res.setHeader('Content-Type', apiRes.headers['content-type'] || 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.status(apiRes.statusCode).send(data);
            });
        });

        proxyReq.on('error', (error) => {
            console.error('Proxy request error:', error);
            res.status(500).json({ 
                error: 'Failed to fetch data',
                message: error.message 
            });
        });

        proxyReq.setTimeout(30000, () => {
            proxyReq.destroy();
            res.status(504).json({ error: 'Request timeout' });
        });

        proxyReq.end();

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};
