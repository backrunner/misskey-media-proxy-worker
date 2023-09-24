import { PROXY_CONFIG } from "./config"
import { md5 } from "./utils";

export const getSign = async (url: string) => {
	const payload = `${url}_${await md5(PROXY_CONFIG.PROXY_KEY)}_${PROXY_CONFIG.ALLOW_ORIGIN}`;
	return await md5(payload);
}
