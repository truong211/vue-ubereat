@echo off
echo Starting Spring Boot backend and Vue.js frontend...

echo.
echo === Building Spring Boot backend ===
cd backend
call mvn clean install -DskipTests
if %ERRORLEVEL% NEQ 0 (
    echo Failed to build Spring Boot backend
    exit /b %ERRORLEVEL%
)

echo.
echo === Starting Spring Boot backend (in new window) ===
start cmd /k "cd backend && mvn spring-boot:run"

echo.
echo === Starting Vue.js frontend (in new window) ===
timeout 5
start cmd /k "cd frontend && npm run dev"

echo.
echo === Development environment started ===
echo.
echo Spring Boot backend: http://localhost:8080
echo Vue.js frontend: http://localhost:5173
echo.
echo Press Ctrl+C to exit this console (this will not stop the servers)
pause
