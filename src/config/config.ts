import { env } from 'node:process';

export const PROXY_CONFIG = {
	ALLOW_ORIGIN: env.ALLOW_ORIGIN ?? '',
	BLACK_LIST_DOMAIN: env.BLACK_LIST_DOMAIN ? (env.BLACK_LIST_DOMAIN || '').split(',').map((item) => item.trim()) : [],
	PROXY_USER_AGENT: env.PROXY_USER_AGENT ?? '',
	PROXY_KEY: env.PROXY_KEY ?? '',
	THIRD_PARTY_CLIENTS_USER_AGENT: env.THIRD_PARTY_CLIENTS_USER_AGENT ? (env.THIRD_PARTY_CLIENTS_USER_AGENT || '').split(',').map((item) => item.trim()) : [],
	VALIDATE_PATHNAME: env.VALIDATE_PATHNAME ? env.VALIDATE_PATHNAME === 'true' : true,
	VALIDATE_SIGN: env.VALIDATE_SIGN ? env.VALIDATE_SIGN === 'true' : false,
	VALIDATE_REFERER: env.VALIDATE_REFERER ? env.VALIDATE_REFERER === 'true' : false,
	RETURN_EMPTY_PIC_WHEN_ERROR: env.RETURN_EMPTY_PIC_WHEN_ERROR ? env.RETURN_EMPTY_PIC_WHEN_ERROR === 'true' : false,
  MAX_CONTENT_LENGTH: (Number(env.MAX_CONTENT_LENGTH) || 0) ?? 0,
};
