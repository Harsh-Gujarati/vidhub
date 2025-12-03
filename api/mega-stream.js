const { File } = require('megajs');

/**
 * MEGA Streaming Proxy Endpoint
 * 
 * Streams MEGA files directly to the client for video playback
 */

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed. Use GET.' });
        return;
    }

    try {
        const { megaUrl, nodeId } = req.query;

        if (!megaUrl) {
            res.status(400).json({ error: 'megaUrl is required' });
            return;
        }

        // Get file/folder from MEGA
        let megaFile = File.fromURL(megaUrl);
        await megaFile.loadAttributes();

        // If it's a folder and we have a nodeId, find the specific file
        if (megaFile.directory && nodeId) {
            const targetFile = megaFile.children?.find(child => child.nodeId === nodeId || child.name === nodeId);
            if (!targetFile) {
                res.status(404).json({ error: 'File not found in folder' });
                return;
            }
            megaFile = targetFile;
            await megaFile.loadAttributes();
        }

        // Support range requests for video seeking
        const range = req.headers.range;
        const fileSize = megaFile.size;

        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            });

            // Stream the requested range
            const stream = megaFile.download({ start, end });
            stream.pipe(res);
        } else {
            // Stream entire file
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            });

            const stream = megaFile.download();
            stream.pipe(res);
        }

    } catch (error) {
        console.error('MEGA stream error:', error);
        res.status(500).json({ 
            error: 'Failed to stream MEGA file',
            message: error.message 
        });
    }
};

