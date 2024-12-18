export const DEFAULT_CACHE_MAX_AGE = 31536000;
export const DEFAULT_CF_POLISH = 'off';
export const DEFAULT_USER_AGENT = 'misskey/media-proxy-worker';
export const DEFAULT_BLOCKED_VIA_PSEUDO_NAMES = ['misskey/media-proxy-worker'];

export const PROXY_CONFIG: Env & {
	EXTRA_PROXY_HEADERS: Record<string, Record<string, string>>;
	TRANSPARENT_PROXY: Record<string, string>;
} = {
	ALLOW_ORIGIN: '',
	BLACK_LIST_DOMAIN: [],
	PROXY_USER_AGENT: '',
	PROXY_KEY: '',
	THIRD_PARTY_CLIENTS_USER_AGENT: [],
	VALIDATE_PATHNAME: true,
	VALIDATE_SIGN: false,
	VALIDATE_REFERER: false,
	VALIDATE_USER_AGENT: false,
	RETURN_EMPTY_PIC_WHEN_ERROR: false,
	MAX_CONTENT_LENGTH: 0,
	CACHE_MAX_AGE: DEFAULT_CACHE_MAX_AGE,
	CF_POLISH: DEFAULT_CF_POLISH,
	EXTRA_PROXY_HEADERS: {} as Record<string, Record<string, string>>,
	TRANSPARENT_PROXY: {} as Record<string, string>,
	TRANSPARENT_PROXY_MODE: 'path',
	TRANSPARENT_PROXY_QUERY: 'url',
	BLOCKED_VIA_PSEUDO_NAMES: [],
	MAX_URL_LENGTH: 0,
	PASS_USER_AGENT_FROM_REQUEST: false,
};

export const updateProxyConfig = (env: Env) => {
	let extraProxyHeaders = {};
	if (typeof env.EXTRA_PROXY_HEADERS === 'string') {
		try {
			extraProxyHeaders = env.EXTRA_PROXY_HEADERS ? JSON.parse(env.EXTRA_PROXY_HEADERS as string || '{}') : {};
		} catch (error) {
			console.error('Error while parsing EXTRA_PROXY_HEADERS:', error);
		}
	} else if (typeof env.EXTRA_PROXY_HEADERS === 'object') {
		extraProxyHeaders = env.EXTRA_PROXY_HEADERS;
	}

	let transparentProxy = {};
	if (typeof env.TRANSPARENT_PROXY === 'string') {
		try {
			transparentProxy = env.TRANSPARENT_PROXY ? JSON.parse(env.TRANSPARENT_PROXY as string || '{}') : {};
		} catch (error) {
			console.error('Error while parsing TRANSPARENT_PROXY:', error);
		}
	} else if (typeof env.TRANSPARENT_PROXY === 'object') {
		transparentProxy = env.TRANSPARENT_PROXY;
	}

	Object.assign(PROXY_CONFIG, {
		ALLOW_ORIGIN: env.ALLOW_ORIGIN ?? '',
		BLACK_LIST_DOMAIN: env.BLACK_LIST_DOMAIN ?? [],
		PROXY_USER_AGENT: env.PROXY_USER_AGENT ?? DEFAULT_USER_AGENT,
		PROXY_KEY: env.PROXY_KEY ?? '',
		THIRD_PARTY_CLIENTS_USER_AGENT: env.THIRD_PARTY_CLIENTS_USER_AGENT ?? [],
		VALIDATE_PATHNAME: env.VALIDATE_PATHNAME ?? true,
		VALIDATE_SIGN: env.VALIDATE_SIGN ?? false,
		VALIDATE_REFERER: env.VALIDATE_REFERER ?? false,
		VALIDATE_USER_AGENT: env.VALIDATE_USER_AGENT ?? false,
		RETURN_EMPTY_PIC_WHEN_ERROR: env.RETURN_EMPTY_PIC_WHEN_ERROR ?? false,
		MAX_CONTENT_LENGTH: env.MAX_CONTENT_LENGTH ?? 0,
		CACHE_MAX_AGE: env.CACHE_MAX_AGE ?? DEFAULT_CACHE_MAX_AGE,
		CF_POLISH: env.CF_POLISH ?? DEFAULT_CF_POLISH,
		EXTRA_PROXY_HEADERS: extraProxyHeaders,
		TRANSPARENT_PROXY: transparentProxy,
		TRANSPARENT_PROXY_MODE: env.TRANSPARENT_PROXY_MODE ?? 'path',
		TRANSPARENT_PROXY_QUERY: env.TRANSPARENT_PROXY_QUERY ?? 'url',
		BLOCKED_VIA_PSEUDO_NAMES: env.BLOCKED_VIA_PSEUDO_NAMES ?? DEFAULT_BLOCKED_VIA_PSEUDO_NAMES,
		MAX_URL_LENGTH: env.MAX_URL_LENGTH ?? 0,
		PASS_USER_AGENT_FROM_REQUEST: env.PASS_USER_AGENT_FROM_REQUEST ?? false,
	});
}
