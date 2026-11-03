#!/bin/bash
# Abre la app con una dirección segura (https) para probarla en el móvil, incluido el micrófono.
# No necesita permisos de administrador ni cuenta: descarga una herramienta gratuita (cloudflared) dentro de esta carpeta (.tools/).
CARPETA="/Users/jgomezz/Claude/Projects/Mis Memorias de Oro"
cd "$(dirname "$0")" 2>/dev/null
[ -f package.json ] || cd "$CARPETA" || { echo "No encuentro la carpeta del proyecto."; exit 1; }
pausa() { read -n 1 -s -r -p "Pulsa una tecla para cerrar..."; echo; }

# 1. Herramienta del túnel
mkdir -p .tools
if [ ! -x ".tools/cloudflared" ]; then
  echo "Descargando lo necesario (solo la primera vez)..."
  case "$(uname -m)" in arm64) ARQ="arm64" ;; *) ARQ="amd64" ;; esac
  curl -fL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-$ARQ.tgz" | tar -xz -C .tools \
    || { echo "No se pudo descargar. Es probable que la red de la empresa lo bloquee: prueba desde la WiFi del móvil o de casa."; rm -f .tools/cloudflared; pausa; exit 1; }
  chmod +x .tools/cloudflared
  xattr -d com.apple.quarantine .tools/cloudflared 2>/dev/null
fi

# 2. La aplicación
if [ -x ".node/bin/node" ]; then export PATH="$PWD/.node/bin:$PATH"; fi
if ! command -v node >/dev/null 2>&1; then echo "Abre antes 'Iniciar Memorias' una vez (prepara todo)."; pausa; exit 1; fi
lsof -ti tcp:3001 | xargs kill 2>/dev/null
node src/server.js > /tmp/memorias-app.log 2>&1 &
APP=$!
trap 'kill $APP 2>/dev/null; kill $TUN 2>/dev/null' EXIT
sleep 3

# 3. El túnel seguro
LOG=$(mktemp)
.tools/cloudflared tunnel --no-autoupdate --url http://localhost:3001 > "$LOG" 2>&1 &
TUN=$!
echo "Creando la dirección segura..."
URL=""
for i in $(seq 1 30); do
  URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$LOG" | head -1)
  [ -n "$URL" ] && break
  sleep 1
done
if [ -z "$URL" ]; then echo "No se pudo crear la dirección. Probablemente la red lo bloquea; prueba desde otra WiFi."; pausa; exit 1; fi

echo
echo "=============================================="
echo " Abre esto en tu móvil:"
echo
echo "   $URL"
echo
echo " (Se abre también un código QR en el navegador del Mac)"
echo " Cierra esta ventana para parar. La dirección cambia cada vez."
echo "=============================================="
open "https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=$URL"
wait $TUN
