#!/bin/bash
# Arranca Mis Memorias de Oro. No necesita permisos de administrador:
# si el Mac no tiene Node.js, lo descarga dentro de esta carpeta (.node/).
# Ir siempre a la carpeta del proyecto, se ejecute como se ejecute
CARPETA="/Users/jgomezz/Claude/Projects/Mis Memorias de Oro"
cd "$(dirname "$0")" 2>/dev/null
[ -f package.json ] || cd "$CARPETA" || { echo "No encuentro la carpeta del proyecto."; exit 1; }

pausa() { read -n 1 -s -r -p "Pulsa una tecla para cerrar..."; echo; }

# 1. Localizar o descargar Node.js
if [ -x ".node/bin/node" ]; then
  export PATH="$PWD/.node/bin:$PATH"
elif ! command -v node >/dev/null 2>&1; then
  echo "Descargando lo necesario (solo la primera vez, ~1 minuto)..."
  case "$(uname -m)" in arm64) ARQ="arm64" ;; *) ARQ="x64" ;; esac
  BASE="https://nodejs.org/dist/latest-v22.x"
  ARCHIVO=$(curl -fsSL "$BASE/SHASUMS256.txt" | grep "darwin-$ARQ.tar.gz" | awk '{print $2}')
  if [ -z "$ARCHIVO" ]; then echo "No se pudo conectar para descargar. Revisa tu conexión a internet."; pausa; exit 1; fi
  mkdir -p .node
  curl -fL "$BASE/$ARCHIVO" | tar -xz -C .node --strip-components=1 || { echo "Falló la descarga."; rm -rf .node; pausa; exit 1; }
  export PATH="$PWD/.node/bin:$PATH"
fi

# 2. Preparar la aplicación en este Mac (solo la primera vez)
# Se repite si aparecen componentes nuevos (package.json más reciente que la marca)
if [ ! -f ".instalado-mac" ] || [ "package.json" -nt ".instalado-mac" ]; then
  echo "Preparando la aplicación (puede tardar unos minutos)..."
  [ -f ".instalado-mac" ] || rm -rf node_modules/better-sqlite3
  npm install --no-audit --no-fund || { echo "Error al preparar la aplicación."; pausa; exit 1; }
  touch .instalado-mac
fi

# 3. Arrancar
lsof -ti tcp:3001 | xargs kill 2>/dev/null
(sleep 2 && open "http://localhost:3001") &
echo "Aplicación en http://localhost:3001  (cierra esta ventana para pararla)"
node src/server.js
