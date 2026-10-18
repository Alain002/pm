#!/usr/bin/env sh
set -e
cd "$(dirname "$0")/.."

# Ensure Docker engine is running (start Docker Desktop on macOS if needed)
if ! docker version >/dev/null 2>&1; then
  echo "Starting Docker Desktop..."
  if ! open -a Docker 2>/dev/null; then
    echo "ERROR: Docker engine not running. Start it manually (e.g. Docker Desktop or the docker service)."
    exit 1
  fi
  tries=0
  while ! docker version >/dev/null 2>&1; do
    sleep 5
    tries=$((tries + 1))
    if [ "$tries" -ge 36 ]; then
      echo "ERROR: Docker engine did not start within 3 minutes."
      exit 1
    fi
  done
fi

docker build -t pm-app .
docker rm -f pm-app 2>/dev/null || true

if [ -f .env ]; then
  docker run -d --name pm-app -p 8000:8000 --env-file .env pm-app
else
  docker run -d --name pm-app -p 8000:8000 pm-app
fi

echo "Running at http://localhost:8000"
