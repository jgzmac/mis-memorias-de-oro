#!/bin/bash
# Comprueba si este Mac llega a los sitios que necesita GitHub Codespaces. No cambia nada.
pausa() { read -n 1 -s -r -p "Pulsa una tecla para cerrar..."; echo; }
prueba() {
  local nombre="$1" url="$2"
  local codigo
  codigo=$(curl -s -o /dev/null -m 10 -w "%{http_code}" "$url" 2>/dev/null)
  if [ -n "$codigo" ] && [ "$codigo" != "000" ]; then echo "  [OK]     $nombre"; else echo "  [BLOQUEADO] $nombre"; fi
}
echo "Comprobando conexión (10 segundos máximo por sitio)..."
echo
prueba "GitHub (web)"                    "https://github.com"
prueba "GitHub (servicios)"              "https://api.github.com"
prueba "Codespaces (entorno)"            "https://github.dev"
prueba "Codespaces (direcciones de la app)" "https://app.github.dev"
prueba "Tu repositorio"                  "https://github.com/jgzmac/mis-memorias-de-oro"
echo
echo "Si todo sale [OK], se puede seguir con Codespaces."
echo "Si algo sale [BLOQUEADO], haz una foto a esta ventana y me la pasas."
echo
pausa
