import { PROXY_CONFIG } from "../config/config"
import { md5 } from "./misc";

export const getSign = async (url: string) => {
	if (!PROXY_CONFIG.PROXY_KEY) {
		return '';
	}
	const payload = `${url}_${await md5(PROXY_CONFIG.PROXY_KEY)}_${PROXY_CONFIG.ALLOW_ORIGIN}`;
	return await md5(payload);
}
