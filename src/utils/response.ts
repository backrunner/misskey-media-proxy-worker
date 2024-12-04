import { PROXY_CONFIG } from '../config/config';
import { GENERAL_CORS_HEADERS, MIN_PNG_BASE64 } from '../constants';
import { getCorsHeader } from './headers';

export const createErrorResponse = (status: number, errorMessage: string, request: Request) => {
	if (PROXY_CONFIG.RETURN_EMPTY_PIC_WHEN_ERROR) {
		return createEmptyPicResponse(request, errorMessage);
	}
	return new Response(
		JSON.stringify({
			err_code: status,
			err_msg: errorMessage,
		}),
		{
			headers: {
				...GENERAL_CORS_HEADERS,
				...getCorsHeader(request),
				'Content-Type': 'applicaton/json',
				'Cache-Control': 'no-store',
			},
			status,
		}
	);
};

export const createEmptyPicResponse = (request: Request, errorMessage: string) => {
	return new Response(
		Uint8Array.from(atob(MIN_PNG_BASE64), function (char) {
			return char.charCodeAt(0);
		}),
		{
			headers: {
				...GENERAL_CORS_HEADERS,
				...getCorsHeader(request),
				'Content-Type': 'image/png',
				'Cache-Control': 'no-store',
				'X-Error-Message': errorMessage,
			},
		}
	);
};
