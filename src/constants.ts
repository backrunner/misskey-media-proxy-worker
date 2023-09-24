import { PROXY_CONFIG } from "./config";

export const GENERAL_CORS_HEADERS = {
	'Access-Control-Allow-Origin': PROXY_CONFIG.ALLOW_ORIGIN || '*',
	'Access-Control-Allow-Methods': 'GET,OPTIONS',
};
