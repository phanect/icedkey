# YOUR_ICEDKEY_INSTANCE

This is an instance of IcedKey identity server.

## Set up

### Google

Put the JSON file acquired from the Google API Console as secrets/google-service-account.json.
It will be automatically registered as a secret `GOOGLE_SERVICE_ACCOUNT_JSON` on `icedkey postdeploy`.

### GitHub

Set the following secrets on the platform.

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
