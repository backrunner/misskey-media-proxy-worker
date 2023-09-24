import { PROXY_CONFIG } from "./config";
import { GENERAL_CORS_HEADERS } from "./constants";
import { createErrorResponse } from "./response";

const DEFAULT_USER_AGENT = 'misskey-image-proxy-worker';

export const proxyImage = async (url: string) => {
	if (!url) {
		return createErrorResponse(400, 'Invalid proxy url.');
	}

	const cached = await caches.default.match(url);
	if (cached) {
		return cached;
	}

	const fetchRes = await fetch(url, {
		cf: {
			polish: 'lossy',
			cacheEverything: true,
		},
		headers: {
			'User-Agent': PROXY_CONFIG.PROXY_USER_AGENT || DEFAULT_USER_AGENT,
			'Accept-Encoding': 'gzip, deflate, br',
			'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
		},
	});

	if (!fetchRes.headers.get('Content-Type')?.startsWith('image')) {
		return createErrorResponse(400, 'Invalid proxy target.');
	}

	const res = new Response(fetchRes.body, {
		headers: {
			...fetchRes.headers,
			...GENERAL_CORS_HEADERS,
			'Cache-Control': 'public, immutable, s-maxage=31536000, max-age=31536000, stale-while-revalidate=60',
			'Content-Security-Policy': `default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'`,
		},
	});

	caches.default.put(url, res.clone());

	return res;
};
