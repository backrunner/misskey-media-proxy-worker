# CHANGELOG

## 0.4.1

- feat: prevent loop proxy from official misskey media proxy
- fix: incorrect default values in the toml file

## 0.4.0

- feat: configurable user agent validation and cf polish param
- feat: support to send the proxy request to another transparent http proxy
- feat: add optional validation for url length
- feat: support via headers in the proxy request and response
- feat: loop proxy protection
- fix: correct the wrong implementation of proxy response cache

## 0.3.3

- fix: support some strange content-type headers like `binary/octet-stream`

## 0.3.2

- feat: allow to set the cache max age
- feat: support adding extra headers for specific domains

## 0.3.1

- feat: expose body of proxy fetch in the error log

## 0.3.0

- breaking: support config worker by environment variables
- feat: more detailed error handling
- feat: support HEAD method
