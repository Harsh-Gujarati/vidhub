const { File } = require('megajs');

/**
 * MEGA Resolver API Endpoint
 * 
 * Accepts a MEGA folder or file URL and returns video file information
 * including direct download URLs for streaming.
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
            const { megaUrl } = JSON.parse(body);

            if (!megaUrl) {
                res.status(400).json({ error: 'megaUrl is required' });
                return;
            }

            // Validate MEGA URL format
            if (!megaUrl.includes('mega.nz')) {
                res.status(400).json({ error: 'Invalid MEGA URL' });
                return;
            }

            // Create MEGA file/folder object from URL
            const megaFile = File.fromURL(megaUrl);

            // Load attributes
            await megaFile.loadAttributes();

            const videos = [];

            // Check if it's a folder
            if (megaFile.directory) {
                // It's a folder - get all video files
                const children = megaFile.children || [];

                for (const child of children) {
                    // Check if it's a video file
                    const isVideo = child.name && /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv|m4v)$/i.test(child.name);

                    if (isVideo && !child.directory) {
                        try {
                            // Get download URL for streaming
                            const downloadUrl = await getDownloadUrl(child);

                            videos.push({
                                id: child.nodeId || child.name,
                                name: child.name,
                                size: child.size,
                                streamUrl: downloadUrl,
                                thumbnail: null, // MEGA doesn't provide thumbnails
                                duration: null
                            });
                        } catch (error) {
                            console.error(`Error processing ${child.name}:`, error.message);
                            // Continue with other files
                        }
                    }
                }
            } else {
                // It's a single file - check if it's a video
                const isVideo = megaFile.name && /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv|m4v)$/i.test(megaFile.name);

                if (isVideo) {
                    try {
                        const downloadUrl = await getDownloadUrl(megaFile);

                        videos.push({
                            id: megaFile.nodeId || megaFile.name,
                            name: megaFile.name,
                            size: megaFile.size,
                            streamUrl: downloadUrl,
                            thumbnail: null,
                            duration: null
                        });
                    } catch (error) {
                        console.error(`Error processing ${megaFile.name}:`, error.message);
                    }
                } else {
                    res.status(400).json({ error: 'The provided MEGA link is not a video file' });
                    return;
                }
            }

            if (videos.length === 0) {
                res.status(404).json({ error: 'No video files found in the MEGA link' });
                return;
            }

            res.status(200).json({
                videos: videos,
                count: videos.length
            });

        } catch (error) {
            console.error('MEGA resolver error:', error);
            res.status(500).json({ 
                error: 'Failed to resolve MEGA link',
                message: error.message 
            });
        }
    });
};

/**
 * Get download URL for a MEGA file
 * Returns metadata needed for streaming through our proxy endpoint
 */
async function getDownloadUrl(megaFile) {
    // Return metadata that the frontend will use to construct the stream URL
    return {
        proxy: true,
        nodeId: megaFile.nodeId,
        name: megaFile.name,
        size: megaFile.size
    };
}

