# misskey-media-proxy-worker

A media files proxy worker for [Misskey](https://github.com/misskey-dev/misskey).

## Usage

1. Set your config items via environment variables in the ".env"
2. Run `npm run deploy` to deploy your worker.

or you can run `npm run build` to build the worker without deploying, and deploy it manually.

## Features

- More secure than the official one, can reduce the abusing.

- Integrated cache and polish.

## Config

Please use the environment variable to configure the proxy, you can configure them at Cloudflare's dashboard or in the `wrangler.toml` file.

```toml
[vars]
ALLOW_ORIGIN = "https://pwp.space"
PROXY_USER_AGENT = ""
THIRD_PARTY_CLIENTS_USER_AGENT = ""
VALIDATE_PATHNAME = true
VALIDATE_SIGN = false
VALIDATE_REFERER = false
RETURN_EMPTY_PIC_WHEN_ERROR = false
BLACK_LIST_DOMAIN = ""
STRIP_VIA_FOR_USER_AGENTS = ""
BLOCKED_VIA_PSEUDO_NAMES = ["misskey/media-proxy-worker"]
```

To set the `PROXY_KEY`, you can use the `wrangler secret put` command.

```bash
wrangler secret put PROXY_KEY [YOUR_PROXY_KEY]
```

### Options

- `ALLOW_ORIGIN`: The allowed origin for CORS requests
- `PROXY_USER_AGENT`: The User-Agent header to use when proxying requests
- `THIRD_PARTY_CLIENTS_USER_AGENT`: Array of User-Agent strings for third-party clients
- `VALIDATE_PATHNAME`: Whether to validate the pathname starts with '/proxy'
- `VALIDATE_SIGN`: Whether to validate request signatures
- `VALIDATE_REFERER`: Whether to validate the referer header
- `VALIDATE_USER_AGENT`: Whether to validate the User-Agent header
- `RETURN_EMPTY_PIC_WHEN_ERROR`: Whether to return an empty image on error
- `BLACK_LIST_DOMAIN`: Array of blocked domains
- `CACHE_MAX_AGE`: Maximum cache age in seconds
- `CF_POLISH`: Cloudflare Polish setting ('lossy', 'lossless', or 'off')
- `EXTRA_PROXY_HEADERS`: JSON object of additional headers to add to proxied requests
- `TRANSPARENT_PROXY`: JSON object for transparent proxy configuration
- `TRANSPARENT_PROXY_MODE`: Mode for transparent proxy ('path' or 'query')
- `TRANSPARENT_PROXY_QUERY`: Query parameter name for transparent proxy
- `STRIP_VIA_FOR_USER_AGENTS`: Array of User-Agent strings to strip Via header for
- `BLOCKED_VIA_PSEUDO_NAMES`: Array of blocked Via header pseudo names

## Why proxy requests need a proxy key and signature?

See this issue for more details:

https://github.com/misskey-dev/media-proxy/issues/9

## License

MIT
