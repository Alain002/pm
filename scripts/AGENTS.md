# Scripts

Start/stop scripts for the Dockerized app (image name `pm-app`, container name `pm-app`, port 8000).

- start.sh / stop.sh — Mac/Linux (POSIX sh)
- start.bat / stop.bat — Windows

Start builds the image from the repo root Dockerfile, replaces any existing `pm-app` container, and runs it on port 8000 with `--env-file .env` when present (provides `OPENROUTER_API_KEY`).

Start first ensures the Docker engine is up: if `docker version` fails, it launches Docker Desktop (both install paths on Windows, `open -a Docker` on macOS) and polls up to 3 minutes for readiness, aborting with an error otherwise. On Linux without a running engine it exits with a message to start docker manually.

Stop force-removes the `pm-app` container.

Note: the SQLite database lives inside the container (`/app/data/app.db`), so stopping the container resets the data. Acceptable for the MVP.