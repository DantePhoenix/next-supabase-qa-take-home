#!/usr/bin/env bash
# One-command setup for the QA exercise.
# Configuración en un solo comando para el ejercicio de QA.
#
# Usage / Uso:  ./setup.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

bold() { printf "\n\033[1m%s\033[0m\n" "$*"; }
ok()   { printf "  \033[32m✔\033[0m %s\n" "$*"; }
fail() { printf "\n  \033[31m✘ %s\033[0m\n\n" "$*" >&2; exit 1; }

# ---------------------------------------------------------------------------
bold "1/6  Checking requirements / Verificando requisitos"

command -v node >/dev/null 2>&1 || fail "Node.js is not installed (need 24+) / Node.js no está instalado (se requiere 24+)"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[[ "$NODE_MAJOR" -ge 24 ]] || fail "Node.js 24+ required, found $(node -v) / Se requiere Node.js 24+, se encontró $(node -v)"
ok "Node.js $(node -v)"

if ! command -v pnpm >/dev/null 2>&1; then
  fail "pnpm is not installed. Run: corepack enable && corepack prepare pnpm@latest --activate / pnpm no está instalado. Ejecuta: corepack enable && corepack prepare pnpm@latest --activate"
fi
PNPM_MAJOR="$(pnpm -v | cut -d. -f1)"
[[ "$PNPM_MAJOR" -ge 10 ]] || fail "pnpm 10+ required, found $(pnpm -v) / Se requiere pnpm 10+, se encontró $(pnpm -v)"
ok "pnpm $(pnpm -v)"

command -v docker >/dev/null 2>&1 || fail "Docker is not installed / Docker no está instalado"
docker info >/dev/null 2>&1 || fail "Docker is installed but not running. Start Docker Desktop and retry / Docker está instalado pero no se está ejecutando. Inicia Docker Desktop y vuelve a intentarlo"
ok "Docker is running / Docker está en ejecución"

command -v curl >/dev/null 2>&1 || fail "curl is not installed / curl no está instalado"

# ---------------------------------------------------------------------------
bold "2/6  Installing dependencies / Instalando dependencias"
pnpm install
ok "Dependencies installed / Dependencias instaladas"

# ---------------------------------------------------------------------------
bold "3/6  Generating seed data from CSV / Generando datos de seed desde el CSV"
node scripts/generate-seed.mjs
ok "Seed file ready / Archivo de seed listo"

# ---------------------------------------------------------------------------
bold "4/6  Starting Supabase containers / Iniciando contenedores de Supabase"
echo "  (First run downloads Docker images and can take several minutes)"
echo "  (La primera ejecución descarga imágenes de Docker y puede tardar varios minutos)"
pnpm exec supabase start
ok "Supabase is running / Supabase está en ejecución"

# ---------------------------------------------------------------------------
bold "5/6  Loading data into the database / Cargando datos en la base de datos"
pnpm exec supabase db reset --local
bash scripts/setup-env.sh >/dev/null
ok "Migrations applied, data loaded, .env.local written / Migraciones aplicadas, datos cargados, .env.local escrito"

# ---------------------------------------------------------------------------
bold "6/6  Verifying row count / Verificando el número de filas"
set -a; source .env.local; set +a
COUNT_HEADER="$(curl -s -o /dev/null -D - \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/coffee_health?select=id" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Prefer: count=exact" \
  -H "Range: 0-0" | tr -d '\r' | grep -i '^content-range:' || true)"
ROW_COUNT="${COUNT_HEADER##*/}"
[[ "$ROW_COUNT" == "10000" ]] || fail "Expected 10000 rows, got '${ROW_COUNT:-none}' / Se esperaban 10000 filas, se obtuvo '${ROW_COUNT:-ninguna}'"
ok "coffee_health has 10000 rows / coffee_health tiene 10000 filas"

# ---------------------------------------------------------------------------
cat <<'EOF'

────────────────────────────────────────────────────────────────────────
 Setup complete! / ¡Configuración completa!

 Start the app / Inicia la aplicación:

     pnpm dev:next

 Then open / Luego abre:  http://localhost:3000

 Supabase Studio (database UI / interfaz de la base de datos):
     http://localhost:64323

 Stop containers when done / Detén los contenedores al terminar:

     pnpm stop
────────────────────────────────────────────────────────────────────────
EOF
