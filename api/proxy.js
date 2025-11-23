const https = require('https');
const url = require('url');

module.exports = (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Parse the request URL
    const parsedUrl = url.parse(req.url, true);

    // Extract the target URL from query parameter
    const targetUrl = parsedUrl.query.url;

    if (!targetUrl) {
        res.status(400).json({ error: 'Missing url parameter' });
        return;
    }

    // Make request to the target URL
    https.get(targetUrl, (apiRes) => {
        let data = '';

        apiRes.on('data', (chunk) => {
            data += chunk;
        });

        apiRes.on('end', () => {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.status(apiRes.statusCode).send(data);
        });
    }).on('error', (error) => {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    });
};
