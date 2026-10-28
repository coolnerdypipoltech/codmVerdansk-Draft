#!/bin/bash
# Draft Señal Verdansk. Linux:  ./iniciar.sh   (opciones: ./iniciar.sh --host 0.0.0.0 --pin 1234)
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "No se encontró Node.js. Instala la versión LTS desde https://nodejs.org y vuelve a intentarlo."
  exit 1
fi
if [ ! -f "client/build/index.html" ]; then
  echo "Falta compilar el panel (carpeta client/build)."
  echo "Dentro de la carpeta client, corre: npm install && npm run build"
  exit 1
fi
(sleep 2; (xdg-open "http://localhost:8787/operador" || true) >/dev/null 2>&1) &
exec node server.js "$@"
