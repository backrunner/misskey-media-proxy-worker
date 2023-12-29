# misskey-media-proxy-worker

A media files proxy worker for [Misskey](https://github.com/misskey-dev/misskey).

## Usage

1. Copy `./src/config.template.ts` to `./src/config.ts`.
2. Modify the `config.ts` file and deploy it to Cloudflare.
3. Run `npm run deploy` to deploy your worker.

## Features

- More secure than the official one, can reduce the abusing.

- Integrated cache and polish.

## Config

```ts
export const PROXY_CONFIG = {
 // The origin of your misskey instance
 ALLOW_ORIGIN: 'https://pwp.space',
 // The user agent header for proxy requests
 PROXY_USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.2109.1',
 // ⚠ NOT COMPATIBLE WITH THE OFFICIAL INSTANCE, it's only compatible with the code in this fork: https://github.com/backrunner/misskey/tree/feature/image-proxy-sign
 PROXY_KEY: '',
 // Will validate if the pathname is started with '/proxy' if set to `true`, for security reason, the default option is true.
 VALIDATE_PATHNAME: true,
 // Will validate the signature of the request if set to `true`.
 VALIDATE_SIGN: true,
 // Will validate the referer with the value of ALLOW_ORIGIN if set to `true`, not compatible with some third party clients.
 VALIDATE_REFERER: true,
}
```

## Why proxy requests need a proxy key and signature?

See this issue for more details:

https://github.com/misskey-dev/media-proxy/issues/9

## License

MIT
