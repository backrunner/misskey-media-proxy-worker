# misskey-media-proxy-worker

A media files proxy worker for [Misskey](https://github.com/misskey-dev/misskey).

## Usage

1. Set your config items via environment variables in the ".env"
2. Run `npm run deploy` to deploy your worker.

## Features

- More secure than the official one, can reduce the abusing.

- Integrated cache and polish.

## Config

Please use the environment variable to configure the proxy.

```ini
ALLOW_ORIGIN="https://pwp.space"
PROXY_USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.2109.1"
PROXY_KEY=""
THIRD_PARTY_CLIENTS_USER_AGENT=""
VALIDATE_PATHNAME=true
VALIDATE_SIGN=false
VALIDATE_REFERER=false
RETURN_EMPTY_PIC_WHEN_ERROR=false
BLACK_LIST_DOMAIN=""
```

## Why proxy requests need a proxy key and signature?

See this issue for more details:

https://github.com/misskey-dev/media-proxy/issues/9

## License

MIT
