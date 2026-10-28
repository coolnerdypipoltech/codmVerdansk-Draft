#!/bin/bash
# Draft Señal Verdansk. Doble clic en Mac (primera vez: clic derecho > Abrir).
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo
  echo " No se encontró Node.js en esta Mac."
  echo " Instálalo desde https://nodejs.org (versión LTS) y abre este archivo de nuevo."
  echo
  read -n 1 -s -r -p " Pulsa una tecla para salir"
  exit 1
fi
if [ ! -f "client/build/index.html" ]; then
  echo
  echo " Falta compilar el panel (carpeta client/build)."
  echo " Dentro de la carpeta client, corre: npm install && npm run build"
  echo
  read -n 1 -s -r -p " Pulsa una tecla para salir"
  exit 1
fi
(sleep 2; open "http://localhost:8787/operador") &
node server.js "$@"
echo
echo " El servidor se detuvo. Tus datos están guardados en la carpeta datos."
read -n 1 -s -r -p " Pulsa una tecla para cerrar"
