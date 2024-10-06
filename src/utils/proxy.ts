import { PROXY_CONFIG } from '../config/config';
import { GENERAL_CORS_HEADERS } from '../constants';
import { createEmptyPicResponse, createErrorResponse } from './response';

const DEFAULT_USER_AGENT = 'misskey-image-proxy-worker';

export const proxyImage = async (url: string, request: Request) => {
	if (!url) {
		return createErrorResponse(400, 'Invalid proxy url.', request);
	}

	const cached = await caches.default.match(request);
	if (cached) {
		return cached;
	}

	const fetchRes = await fetch(url, {
		// only available when the account enabled Cloudflare Images
		cf: {
			polish: 'lossy',
			cacheKey: url,
		},
		headers: {
			'Accept-Encoding': 'gzip, deflate, br',
			Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
			...request.headers,
			'User-Agent': PROXY_CONFIG.PROXY_USER_AGENT || request.headers.get('User-Agent') || DEFAULT_USER_AGENT,
		},
	});

	if (!fetchRes?.ok) {
		console.error(`Failed to fetch ${url}:`, fetchRes);
		return createErrorResponse(500, 'Failed to fetch target file.', request);
	}

	const contentLength = fetchRes.headers.get('Content-Length')
	if (contentLength !== null && PROXY_CONFIG.MAX_CONTENT_LENGTH && Number(contentLength) > PROXY_CONFIG.MAX_CONTENT_LENGTH) {
		return createErrorResponse(403, 'The response content length is too big.', request);
	}

	const contentType = fetchRes.headers.get('Content-Type');
	if (!/^(((image|video|audio)\/)|(application\/octet-stream))/.test(contentType || '')) {
		return createErrorResponse(500, 'Invalid returned content type.', request);
	}

	if (!fetchRes.body) {
		return createErrorResponse(500, 'Failed to fetch target file.', request);
	}

	const res = new Response(fetchRes.body as ReadableStream<Uint8Array>, {
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
