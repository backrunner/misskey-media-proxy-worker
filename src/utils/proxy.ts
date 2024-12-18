import { DEFAULT_CACHE_MAX_AGE, DEFAULT_CF_POLISH, DEFAULT_USER_AGENT, PROXY_CONFIG } from '../config/config';
import { GENERAL_CORS_HEADERS } from '../constants';
import { createErrorResponse } from './response';
import { getExtraHeaders } from './headers';

const getTransparentProxyUrl = (url: string): string => {
	const urlObj = new URL(url);

	for (const [key, value] of Object.entries(PROXY_CONFIG.TRANSPARENT_PROXY)) {
		if (urlObj.hostname.includes(key)) {
			let prefix = value;

			if (!/^https?:\/\//i.test(prefix)) {
				prefix = `https://${prefix}`;
			}

			if (!prefix.endsWith('/')) {
				prefix += '/';
			}

			const targetUrl = urlObj.toString();

			if (PROXY_CONFIG.TRANSPARENT_PROXY_MODE === 'path') {
				return `${prefix}${targetUrl}`;
			} else {
				return `${prefix}?${PROXY_CONFIG.TRANSPARENT_PROXY_QUERY}=${encodeURIComponent(targetUrl)}`;
			}
		}
	}

	return url;
};

export const proxyImage = async (url: string, request: Request, ctx: ExecutionContext): Promise<Response> => {
	if (!url) {
		return createErrorResponse(400, 'Invalid proxy url: URL is empty or undefined.', request);
	}

	const cached = await caches.default.match(request);
	if (cached) {
		return cached;
	}

	const extraHeaders = getExtraHeaders(url);

	const via = `1.1 misskey/media-proxy-worker`;
	const targetUrl = PROXY_CONFIG.TRANSPARENT_PROXY ? getTransparentProxyUrl(url) : url;

	try {
		const fetchRes = await fetch(targetUrl, {
			// only available when the account enabled Cloudflare Images
			method: request.method,
			cf: {
				polish: PROXY_CONFIG.CF_POLISH ?? DEFAULT_CF_POLISH,
				cacheKey: url,
				cacheTtlByStatus: {
					"200-299": PROXY_CONFIG.CACHE_MAX_AGE ?? DEFAULT_CACHE_MAX_AGE,
					"400-499": 0,
					"500-599": 0,
				},
			},
			headers: {
				'Accept-Encoding': 'gzip, deflate, br',
				Accept: request.headers.get('Accept') || 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
				'User-Agent': PROXY_CONFIG.PASS_USER_AGENT_FROM_REQUEST ? request.headers.get('User-Agent') || PROXY_CONFIG.PROXY_USER_AGENT! : PROXY_CONFIG.PROXY_USER_AGENT!,
				Via: request.headers.get('Via') ? `${request.headers.get('Via')}, ${via}` : via,
				...extraHeaders,
			},
			redirect: 'follow',
		});

		if (!fetchRes.ok) {
			let fetchBody = '';
			try {
				fetchBody = await fetchRes.text();
			} catch (error) {
				fetchBody = 'Failed to read response body';
			}
			console.error(`Failed to fetch ${url}:`, fetchRes.status, fetchRes.statusText, JSON.stringify(PROXY_CONFIG), fetchBody);
			return createErrorResponse(
				fetchRes.status,
				`Failed to fetch target file. Status: ${fetchRes.status}, StatusText: ${fetchRes.statusText}`,
				request
			);
		}

		if (request.method !== 'HEAD') {
			const contentLength = fetchRes.headers.get('Content-Length');
			if (contentLength !== null && PROXY_CONFIG.MAX_CONTENT_LENGTH && Number(contentLength) > PROXY_CONFIG.MAX_CONTENT_LENGTH) {
				return createErrorResponse(
					413,
					`The response content length (${contentLength} bytes) exceeds the maximum allowed size (${PROXY_CONFIG.MAX_CONTENT_LENGTH} bytes).`,
					request
				);
			}
		}

		const contentType = fetchRes.headers.get('Content-Type');
		if (!/^(((image|video|audio)\/)|(application|binary\/octet-stream))/.test(contentType || '')) {
			return createErrorResponse(
				415,
				`Invalid returned content type: ${contentType}. Expected image, video, audio, or application/octet-stream.`,
				request
			);
		}

		const userAgent = request.headers.get('User-Agent') || '';
		const shouldStripVia = PROXY_CONFIG.STRIP_VIA_FOR_USER_AGENTS?.some(agent => userAgent.includes(agent));

		const responseHeaders: HeadersInit = {
			...Object.fromEntries(fetchRes.headers.entries()),
			...GENERAL_CORS_HEADERS,
			'Cache-Control': `public, immutable, s-maxage=${PROXY_CONFIG.CACHE_MAX_AGE}, max-age=${PROXY_CONFIG.CACHE_MAX_AGE}, stale-while-revalidate=60`,
			'Content-Security-Policy': `default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'`,
		};

		// if there's some clients cannot handle the `Via` header, we can strip it by configuration
		if (!shouldStripVia) {
			const proxyVia = fetchRes.headers.get('Via');
			responseHeaders['Via'] = proxyVia ? `${proxyVia}, ${via}` : via;
		}

		if (request.method === 'HEAD') {
			return new Response(null, { headers: responseHeaders });
		}

		if (!fetchRes.body) {
			return createErrorResponse(500, `Failed to fetch target file: Response body is null or undefined (status: ${fetchRes.status}).`, request);
		}

		const res = new Response(fetchRes.body as ReadableStream<Uint8Array>, {
			headers: responseHeaders,
		});

		ctx.waitUntil(caches.default.put(request, res.clone()));

		return res;
	} catch (error) {
		console.error(`Error while proxy image from ${url}:`, error);
		return createErrorResponse(
			500,
			`Internal server error while proxy image: ${error instanceof Error ? error.message : 'Unknown error'}`,
			request
		);
	}
};
