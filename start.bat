// filepath: start.bat
@echo off
echo Iniciando Hawaii Snacks...
echo.

echo Iniciando servidor backend...
start "Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo Iniciando frontend...
start "Frontend" cmd /k "cd frontend && npm start"

echo.
echo ✅ Aplicacion iniciada!
echo 🏝️ Backend: http://localhost:3001
echo 🎨 Frontend: http://localhost:3000
echo.
pause