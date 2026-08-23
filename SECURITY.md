# Security

## Reporting

Email seanmotanya@gmail.com with a reproduction and impact. Do not open a public issue for vulnerabilities.

## Secrets

- Never commit `.env`, keystores, or API tokens.
- `scripts/.spotify-token-cache.json` was removed from the tree. Rotate that Spotify token immediately; historical git revisions may still contain it.
- Firebase config and debug keystores stay out of the public tree. Treat them as contributor-local.
- Authorization decisions must use `app_metadata` or a trusted profile query, never `user_metadata`.

## Client boundaries

The published app uses the Supabase anon key only. Service-role keys must never ship in the client.
