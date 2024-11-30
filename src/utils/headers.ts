import { PROXY_CONFIG } from "../config/config";

export const getCorsHeader = (request: Request) => {
	if (Array.isArray(PROXY_CONFIG.ALLOW_ORIGIN)) {
		const origin = request.headers.get('Origin');
		if (PROXY_CONFIG.ALLOW_ORIGIN.includes(origin)) {
			return {
				'Access-Control-Allow-Origin': origin || '*',
			}
		} else {
			return {
				'Access-Control-Allow-Origin': '*',
			};
		}
	} else {
		return {
			'Access-Control-Allow-Origin': PROXY_CONFIG.ALLOW_ORIGIN || '*',
		}
	}
}

export const getExtraHeaders = (targetUrl: string): Record<string, string> => {
  try {
    const targetDomain = new URL(targetUrl).hostname;
    const extraHeaders: Record<string, string> = {};

    for (const [pattern, headers] of Object.entries(PROXY_CONFIG.EXTRA_PROXY_HEADERS)) {
      try {
        if (targetDomain.match(new RegExp(pattern.replace(/\*/g, '.*')))) {
          Object.assign(extraHeaders, headers);
        }
      } catch (regexError) {
        console.error(`Regex error (pattern: ${pattern}):`, regexError);
      }
    }

    return extraHeaders;
  } catch (error) {
    console.error('Error while getting extra headers:', error);
    return {};
  }
};

export const validateViaHeader = (request: Request): boolean => {
  const viaHeader = request.headers.get('Via');
  if (!viaHeader) return true;

  const viaEntries = viaHeader.split(',').map(v => v.trim());

  for (const entry of viaEntries) {
    const match = entry.match(/^\d\.\d\s+([^(\s]+)(?:\s+\([^)]*\))?$/);
    if (match) {
      const pseudonym = match[1];
      if (PROXY_CONFIG.BLOCKED_VIA_PSEUDO_NAMES?.includes(pseudonym)) {
        return false;
      }
    }
  }

  return true;
};
