import { GENERAL_CORS_HEADERS } from "./constants"

export const createErrorResponse = (status: number, errorMessage: string) =>
	new Response(JSON.stringify({
		err_code: status,
		err_msg: errorMessage,
	}), {
		headers: {
			...GENERAL_CORS_HEADERS,
			'Content-Type': 'applicaton/json',
		},
		status,
	});
