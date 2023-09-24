import { PROXY_CONFIG } from "./config";
import { GENERAL_CORS_HEADERS } from "./constants";
import { proxyImage } from "./proxy";
import { createErrorResponse } from "./response";
import { getSign } from "./sign";
import { isNullable } from "./utils";

export interface Env {}

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
			'Access-Control-Allow-Headers': accessControlRequestHeaders!,
		}
	});
};

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return handleOptions(request);
		}

		if (request.method !== 'GET') {
			return createErrorResponse(405, 'Unsupported request method.');
		}

		if (!(request.headers.get('referer') || '').startsWith(PROXY_CONFIG.ALLOW_ORIGIN)) {
			return createErrorResponse(400, 'Invalid request.');
		}

		try {
			const url = new URL(request.url);
			if (!url.pathname.startsWith('/proxy')) {
				return createErrorResponse(404, 'Invalid request.');
			}
			const target = url.searchParams.get('url');
			if (!target) {
				return createErrorResponse(400, 'Invalid proxy target.');
			}
			const sign = url.searchParams.get('sign');
			if (sign !== await getSign(target)) {
				return createErrorResponse(400, 'Invalid proxy request.');
			}
			const targetURL = decodeURIComponent(target);
			return proxyImage(targetURL);
		} catch (err) {
			return createErrorResponse(500, (err as Error).message);
		}
	},
};
