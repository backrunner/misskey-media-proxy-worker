import { PROXY_CONFIG, updateProxyConfig } from './config/config';
import { GENERAL_CORS_HEADERS } from './constants';
import { getCorsHeader } from './utils/headers';
import { proxyImage } from './utils/proxy';
import { createErrorResponse } from './utils/response';
import { getSign } from './utils/sign';
import { isNullable } from './utils/misc';
import { validateViaHeader } from './utils/headers';

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
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		updateProxyConfig(env);

		if (request.method === 'OPTIONS') {
			return handleOptions(request);
		}

		if (!['GET', 'HEAD'].includes(request.method)) {
			return createErrorResponse(405, 'Unsupported request method.', request);
		}

		const userAgent = request.headers.get('User-Agent');

		if (PROXY_CONFIG.VALIDATE_USER_AGENT) {
			if (!userAgent) {
				return createErrorResponse(400, 'Invalid headers.', request);
			}
			if (userAgent?.startsWith('misskey/')) {
				return createErrorResponse(403, 'Loop proxy is not allowed.', request);
			}
		}

		if (!validateViaHeader(request)) {
			return createErrorResponse(403, 'Invalid via header in the request.', request);
		}

		const isThirdPartyClient = (PROXY_CONFIG.THIRD_PARTY_CLIENTS_USER_AGENT || []).some((id) => userAgent?.includes(id));

		try {
			const url = new URL(request.url);

			if (PROXY_CONFIG.VALIDATE_PATHNAME && !url.pathname.startsWith('/proxy')) {
				return createErrorResponse(404, 'Invalid request.', request);
			}

			const target = url.searchParams.get('url');
			if (!target) {
				return createErrorResponse(400, 'Invalid proxy target.', request);
			}

			// loose the validation limits for third-party clients like kimis
			if (!isThirdPartyClient) {
				if (PROXY_CONFIG.VALIDATE_REFERER && PROXY_CONFIG.ALLOW_ORIGIN && !(request.headers.get('Referer') || '').startsWith(PROXY_CONFIG.ALLOW_ORIGIN)) {
					return createErrorResponse(400, 'Invalid request.', request);
				}
				if (PROXY_CONFIG.VALIDATE_SIGN) {
					const sign = url.searchParams.get('sign');
					const targetSign = await getSign(target);
					if (targetSign && sign !== targetSign) {
						return createErrorResponse(400, 'Invalid proxy request.', request);
					}
				}
			}

			const targetURL = decodeURIComponent(target)

			// validate the url length
			if (PROXY_CONFIG.MAX_URL_LENGTH && targetURL.length > PROXY_CONFIG.MAX_URL_LENGTH) {
				return createErrorResponse(
					400,
					`URL length (${targetURL.length}) exceeds the maximum allowed length (${PROXY_CONFIG.MAX_URL_LENGTH}).`,
					request
				);
			}

			let finalTargetURL = '';

			try {
				const parsedTargetURL = new URL(targetURL);
				if (!['http:', 'https:'].includes(parsedTargetURL.protocol)) {
					return createErrorResponse(400, 'Invalid URL protocol. Only HTTP and HTTPS are allowed.', request);
				}
				if (PROXY_CONFIG.ALLOW_ORIGIN && !targetURL.includes(PROXY_CONFIG.ALLOW_ORIGIN) && parsedTargetURL.searchParams.has('sign')) {
					// remote target url doesn't accept sign, remove it
					parsedTargetURL.searchParams.delete('sign');
				}
				finalTargetURL = parsedTargetURL.toString();
			} catch (error) {
				return createErrorResponse(400, 'Invalid proxy target.', request);
			}

			if (Array.isArray(PROXY_CONFIG.BLACK_LIST_DOMAIN) && PROXY_CONFIG.BLACK_LIST_DOMAIN.some((domain) => targetURL.includes(domain))) {
				return createErrorResponse(403, 'Forbidden.', request);
			}

			return await proxyImage(finalTargetURL, request, ctx);
		} catch (error) {
			const errorMessage = error instanceof Error
				? error.message
				: typeof error === 'string'
					? error
					: 'Unknown error';
			return createErrorResponse(500, errorMessage, request);
		}
	},
};
