# BMS Detail Repo Structure

This repository is now split into two clearly separated parts:

- `main-website/` holds the public website assets (`app.js` and `styles.css`).
- `client-files-app/` holds the separate React client portal.

## Entry Points

- `index.html` is the public website entry point.
- `client-files-app/` is the client portal project and can be run or deployed independently.

## Supporting Files

- `images/` contains shared public assets such as the logo.
- `scripts/` contains helper scripts for the public website assets.

## Notes

- The public site still opens from the repo root, but its code now lives under `main-website/`.
- The client portal remains isolated so it can be deployed separately, such as on a `clients.` subdomain.
