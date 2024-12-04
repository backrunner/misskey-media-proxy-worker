/**
 * Main entry file for the Misskey Media Proxy Worker
 * This worker acts as a secure proxy for media files, providing features like:
 * - Request validation
 * - CORS handling
 * - Security checks
 * - Caching and optimization
 */

import { PROXY_CONFIG, updateProxyConfig } from './config/config';
import { GENERAL_CORS_HEADERS } from './constants';
import { getCorsHeader } from './utils/headers';
import { proxyImage } from './utils/proxy';
import { createErrorResponse } from './utils/response';
import { getSign } from './utils/sign';
import { isNullable } from './utils/misc';
import { validateViaHeader } from './utils/headers';

/**
 * Handles OPTIONS requests for CORS preflight
 * @param request - The incoming request object
 * @returns Response with appropriate CORS headers
 */
const handleOptions = (request: Request) => {
	const origin = request.headers.get('Origin');
	const accessControlRequestHeaders = request.headers.get('Access-Control-Request-Headers');

	if (isNullable(origin) || isNullable(accessControlRequestHeaders)) {
		return new Response(null, {
			headers: {
				Allow: 'GET',
			},
		});
	}

	return new Response(null, {
		headers: {
			...GENERAL_CORS_HEADERS,
			...getCorsHeader(request),
			'Access-Control-Allow-Headers': accessControlRequestHeaders!,
		},
	});
};

export default {
	/**
	 * Main request handler for the worker
	 * @param request - The incoming request object
	 * @param env - Environment variables and bindings
	 * @param ctx - Execution context for the worker
	 * @returns Promise resolving to the response
	 */
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// Update proxy configuration with environment variables
		updateProxyConfig(env);

		// Handle CORS preflight requests
		if (request.method === 'OPTIONS') {
			return handleOptions(request);
		}

		// Validate HTTP method
		if (!['GET', 'HEAD'].includes(request.method)) {
			return createErrorResponse(405, 'Unsupported request method.', request);
		}

		const userAgent = request.headers.get('User-Agent');

		// User-Agent validation to prevent proxy loops and enforce security
		if (PROXY_CONFIG.VALIDATE_USER_AGENT) {
			if (!userAgent) {
				return createErrorResponse(400, 'Invalid headers.', request);
			}
			if (/^(misskey|misskeymediaproxy)\//i.test(userAgent)) {
				return createErrorResponse(403, 'Loop proxy is not allowed.', request);
			}
		}

		// Validate Via header to prevent proxy chains
		if (!validateViaHeader(request)) {
			return createErrorResponse(403, 'Invalid via header in the request.', request);
		}

		// Check if request is from a third-party client
		const isThirdPartyClient = (PROXY_CONFIG.THIRD_PARTY_CLIENTS_USER_AGENT || []).some((id) => userAgent?.includes(id));

		try {
			const url = new URL(request.url);

			// Validate request pathname
			if (PROXY_CONFIG.VALIDATE_PATHNAME && !url.pathname.startsWith('/proxy')) {
				return createErrorResponse(404, 'Invalid request.', request);
			}

			// Get and validate target URL
			const target = url.searchParams.get('url');
			if (!target) {
				return createErrorResponse(400, 'Invalid proxy target.', request);
			}

			// Additional security checks for non-third-party clients
			if (!isThirdPartyClient) {
				// Validate referer if enabled
				if (PROXY_CONFIG.VALIDATE_REFERER && PROXY_CONFIG.ALLOW_ORIGIN && !(request.headers.get('Referer') || '').startsWith(PROXY_CONFIG.ALLOW_ORIGIN)) {
					return createErrorResponse(400, 'Invalid request.', request);
				}
				// Validate request signature if enabled
				if (PROXY_CONFIG.VALIDATE_SIGN) {
					const sign = url.searchParams.get('sign');
					const targetSign = await getSign(target);
					if (targetSign && sign !== targetSign) {
						return createErrorResponse(400, 'Invalid proxy request.', request);
					}
				}
			}

			const targetURL = decodeURIComponent(target)

			// URL length validation
			if (PROXY_CONFIG.MAX_URL_LENGTH && targetURL.length > PROXY_CONFIG.MAX_URL_LENGTH) {
				return createErrorResponse(
					400,
					`URL length (${targetURL.length}) exceeds the maximum allowed length (${PROXY_CONFIG.MAX_URL_LENGTH}).`,
					request
				);
			}

			let finalTargetURL = '';

			// Parse and validate target URL
			try {
				const parsedTargetURL = new URL(targetURL);
				if (!['http:', 'https:'].includes(parsedTargetURL.protocol)) {
					return createErrorResponse(400, 'Invalid URL protocol. Only HTTP and HTTPS are allowed.', request);
				}
				if (PROXY_CONFIG.ALLOW_ORIGIN && !targetURL.includes(PROXY_CONFIG.ALLOW_ORIGIN) && parsedTargetURL.searchParams.has('sign')) {
					// Remote target url doesn't accept sign, remove it
					parsedTargetURL.searchParams.delete('sign');
				}
				finalTargetURL = parsedTargetURL.toString();
			} catch (error) {
				return createErrorResponse(400, 'Invalid proxy target.', request);
			}

			// Check against domain blacklist
			if (Array.isArray(PROXY_CONFIG.BLACK_LIST_DOMAIN) && PROXY_CONFIG.BLACK_LIST_DOMAIN.some((domain) => targetURL.includes(domain))) {
				return createErrorResponse(403, 'Forbidden.', request);
			}

			// Proxy the image request
			return await proxyImage(finalTargetURL, request, ctx);
		} catch (error) {
			// Error handling with detailed messages
			const errorMessage = error instanceof Error
				? error.message
				: typeof error === 'string'
					? error
					: 'Unknown error';
			return createErrorResponse(500, errorMessage, request);
		}
	},
};
