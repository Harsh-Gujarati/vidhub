import { inject } from '@vercel/analytics';

if (typeof window !== 'undefined') {
    inject({
        debug: false,
        framework: 'vanilla'
    });
}

