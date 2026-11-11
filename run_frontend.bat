@echo off
set "PATH=%~dp0..\node;%PATH%"
echo ========================================================
echo Starting Frontend React App (Datayug Society)...
echo ========================================================
cd /d "%~dp0frontend"

if not exist "node_modules\@tailwindcss\postcss" (
    echo Installing @tailwindcss/postcss adapter...
    call "%~dp0..\node\npm.cmd" install -D @tailwindcss/postcss
)

call "%~dp0..\node\npm.cmd" run dev
pause
