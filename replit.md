# Replit setup

This project runs as a Node.js/Express web app.

## Run

The `Start application` workflow runs:

```text
PORT=5000 npm start
```

The teacher attendance page is served at `/` and the admin page at `/admin.html`.

## Required environment values

Set these in Replit Secrets/environment variables:

- `ADMIN_PASSWORD` — password for the admin page
- `SESSION_SECRET` — session signing secret
- `SEKOLAH_LAT` — school latitude in decimal degrees
- `SEKOLAH_LNG` — school longitude in decimal degrees

`RADIUS_METER` is optional and defaults to `150`.

Attendance data is stored in `data/db.json`, which is created automatically the first time the app reads the database.