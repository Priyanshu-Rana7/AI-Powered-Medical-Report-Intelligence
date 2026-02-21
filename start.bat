@echo off
echo Starting MedClare AI System...

:: Start Backend in a new window
start "MedClare Backend" /d "%~dp0backend" cmd /k "call .\venv\Scripts\activate && python main.py"

:: Start Frontend in a new window
start "MedClare Frontend" /d "%~dp0frontend" cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173 (usually)
echo.
echo Close the command windows to stop the servers.
pause
