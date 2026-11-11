@echo off
set "PATH=%~dp0..\node;%PATH%"
echo ========================================================
echo Starting Backend Server (Datayug Society)...
echo ========================================================
cd /d "%~dp0backend"
call "%~dp0..\node\npm.cmd" start
pause
