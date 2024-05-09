import { PROXY_CONFIG } from '../config/config';
import { GENERAL_CORS_HEADERS } from '../constants';
import { createEmptyPicResponse, createErrorResponse } from './response';

const DEFAULT_USER_AGENT = 'misskey-image-proxy-worker';

export const proxyImage = async (url: string, request: Request) => {
	if (!url) {
		return createErrorResponse(400, 'Invalid proxy url.');
	}

	const cached = await caches.default.match(request);
	if (cached) {
		return cached;
	}

	const fetchRes = await fetch(url, {
		cf: {
			polish: 'lossy',
			cacheKey: url,
		},
		headers: {
			'User-Agent': PROXY_CONFIG.PROXY_USER_AGENT || DEFAULT_USER_AGENT,
			'Accept-Encoding': 'gzip, deflate, br',
			Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
		},
	});

	const contentType = fetchRes.headers.get('Content-Type');
	if (!/^(((image|video|audio)\/)|(application\/octet-stream))/.test(contentType || '')) {
		if (PROXY_CONFIG.RETURN_EMPTY_PIC_WHEN_ERROR) {
			return createEmptyPicResponse(request);
		}
		return createErrorResponse(500, 'Invalid returned content type.');
	}

	const res = new Response(fetchRes.body, {
		headers: {
			...Object.fromEntries(fetchRes.headers.entries()),
			...GENERAL_CORS_HEADERS,
			'Cache-Control': 'public, immutable, s-maxage=31536000, max-age=31536000, stale-while-revalidate=60',
			'Content-Security-Policy': `default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'`,
		},
	});

	caches.default.put(request, res.clone());

	return res;
};
