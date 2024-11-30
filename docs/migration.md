# Migration Guide

## v0.3.0

Previous `config.ts` is deprecated now, you should move the config to the environment variables of the worker, you can configure them at Cloudflare's dashboard or in the `wrangler.toml` file.

You can still modify the `config.ts` to make things work, but it's not recommended.
