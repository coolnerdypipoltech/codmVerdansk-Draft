@echo off
title Draft Senal Verdansk (no cierres esta ventana)
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  No se encontro Node.js en esta PC.
  echo  Instalalo desde https://nodejs.org ^(version LTS^), reinicia esta ventana y abre este archivo de nuevo.
  echo.
  pause
  exit /b 1
)
if not exist "client\build\index.html" (
  echo.
  echo  Falta compilar el panel ^(carpeta client\build^).
  echo  Dentro de la carpeta "client", corre: npm install  y despues  npm run build
  echo.
  pause
  exit /b 1
)
start "" cmd /c "timeout /t 2 >nul & start http://localhost:8787/operador"
node server.js
echo.
echo  El servidor se detuvo. Si no fue a proposito, cierra esta ventana y abre iniciar.bat otra vez.
echo  Tus datos estan guardados en la carpeta "datos".
pause
