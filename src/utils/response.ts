import { GENERAL_CORS_HEADERS, MIN_PNG_BASE64 } from '../constants';
import { getCorsHeader } from './headers';

export const createErrorResponse = (status: number, errorMessage: string) =>
	new Response(
		JSON.stringify({
			err_code: status,
			err_msg: errorMessage,
		}),
		{
			headers: {
				...GENERAL_CORS_HEADERS,
				'Content-Type': 'applicaton/json',
			},
			status,
		}
	);

export const createEmptyPicResponse = (request: Request) => {
	return new Response(
		Uint8Array.from(atob(MIN_PNG_BASE64), function (char) {
			return char.charCodeAt(0);
		}),
		{
			headers: {
				...GENERAL_CORS_HEADERS,
				...getCorsHeader(request),
				'Content-Type': 'image/png',
			},
		}
	);
};
