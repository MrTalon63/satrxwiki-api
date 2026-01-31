# satrxwiki-api

This thingmabober scrapes SatRX Wiki for satellite data and serves it via a RESTful API.
It's specially built for satrx.wiki, so parsing is very hardcoded. You probably don't want to use this for anything else.

### API Endpoints

- `GET /` - Test endpoint to check if the API is running, also returns available API versions.

- `GET /v1/satellites/leo` - Fetches a list of Low Earth Orbit (LEO) satellites from SatRX Wiki.

### Environment Variables

Most settings can be configured via environment variables. Below are the available options (values presented are defaults):

```toml
# Sets the base URL for Wiki to fetch satellite data from
SATRX_URL=https://satrx.wiki/
# Time interval (in seconds) to refresh the satellite data
FETCH_TIME=86400
# Port number on which the API server will run
PORT=3000
# Sets the logging level for the application (e.g., debug, verbose, info, warn, error)
LOG_LEVEL=info
```
