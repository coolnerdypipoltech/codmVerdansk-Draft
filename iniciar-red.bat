@echo off
title Draft Senal Verdansk - modo red (no cierres esta ventana)
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
echo.
echo  MODO RED: otras computadoras de la misma red podran abrir el panel y la salida.
echo  Elige un PIN para operar el panel ^(la pantalla de salida para OBS no lo necesita^).
echo.
set /p PIN= PIN (4 a 8 caracteres):
if "%PIN%"=="" (
  echo  Necesitas un PIN en modo red.
  pause
  exit /b 1
)
echo.
echo  Si Windows pregunta por el Firewall, elige "Permitir" en redes privadas.
echo.
start "" cmd /c "timeout /t 2 >nul & start http://localhost:8787/operador"
node server.js --host 0.0.0.0 --pin %PIN%
echo.
echo  El servidor se detuvo. Tus datos estan guardados en la carpeta "datos".
pause
