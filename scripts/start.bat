@echo off
cd /d %~dp0\..

rem Ensure Docker engine is running (start Docker Desktop if needed)
docker version >nul 2>&1 && goto engine_ready
echo Starting Docker Desktop...
set "DD=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
if not exist "%DD%" set "DD=%ProgramFiles(x86)%\Docker\Docker\Docker Desktop.exe"
if not exist "%DD%" (
  echo ERROR: Docker engine not running and Docker Desktop not found. Start it manually.
  exit /b 1
)
start "" "%DD%"
set /a tries=0
:wait_engine
timeout /t 5 /nobreak >nul
docker version >nul 2>&1 && goto engine_ready
set /a tries+=1
if %tries% lss 36 goto wait_engine
echo ERROR: Docker engine did not start within 3 minutes.
exit /b 1
:engine_ready

docker build -t pm-app . || exit /b 1
docker rm -f pm-app 2>nul

if exist .env (
  docker run -d --name pm-app -p 8000:8000 --env-file .env pm-app
) else (
  docker run -d --name pm-app -p 8000:8000 pm-app
)

echo Running at http://localhost:8000
