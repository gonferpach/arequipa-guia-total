# 2braind Landing Factory 🚀

Fábrica de landings con IA: scrapea tus redes sociales → la IA (RAG con pgvector) elige la plantilla → extrae paleta de colores → genera SEO → tu landing está lista y se publica con OpenShip.

Creado para Gonzalo (Arequipa, Perú) 🇵🇪

## Estructura

```
2braind-landing-factory/
├── frontend/              # Next.js 14 (App Router) + Tailwind
│   ├── app/admin/         # Formulario + scraper + palette/SEO preview + publicar
│   └── app/p/[slug]/      # Preview de la landing generada
├── backend/
│   └── src/
│       ├── server.js      # Express API
│       ├── aiSelector.js  # Selector keyword (fallback del RAG)
│       ├── templates.js   # Catálogo de plantillas (+ keywords para RAG)
│       └── lib/
│           ├── rag.js         # Embeddings (OpenAI text-embedding-3-small / hash fallback) + pgvector
│           ├── scraper.js     # Instagram / Facebook / TikTok con fetch + cheerio
│           ├── palette.js     # Paleta dominante (node-vibrant si está, o por categoría)
│           ├── seo.js          # title, description, og/twitter tags (LLM mock → real si hay API key)
│           └── openship.js    # Deploy: OpenShip API o HTML estático en /opt/landings
├── templates/             # Plantillas base
│   ├── template-clinica/
│   └── template-restaurante/
├── docker-compose.yml      # frontend + backend + landing_pg (pgvector/pgvector:pg17) + landings_nginx
├── .env.example
└── README.md
```

## Arquitectura

- **Frontend**: Next.js 14 con App Router, Tailwind CSS
- **Backend**: Express, landings en JSON file (data/landings.json)
- **RAG**: embeddings de plantillas con OpenAI `text-embedding-3-small` + pgvector
  (`landing_pg` en docker-compose, imagen `pgvector/pgvector:pg17`). Sin `OPENAI_API_KEY`
  usa un fallback determinista por hashing (modo demo) y guarda en memoria.
- **Scraper social**: Instagram público (parsea `window._sharedData` / ld+json / og:meta),
  Facebook (og:meta) y TikTok (rehydration JSON / og:meta) con fetch + cheerio.
  Si la red bloquea (login wall / 429), devuelve **datos mock marcados** para que la demo fluya.
- **Palette**: scraper IG → foto principal (node-vibrant, opcional) → categoría → default
- **SEO**: LLM mock con template strings; si hay `OPENAI_API_KEY` usa un LLM real
- **Deploy**: OpenShip API (`POST /api/apps`) o fallback HTML estático en `/opt/landings/{slug}`
  servido por el nginx del docker-compose

## Variables de entorno

Copia `.env.example` a `.env`:

| Variable | Descripción |
|----------|-------------|
| `OPENAI_API_KEY` | Embeddings reales + SEO con LLM (sin ella: fallbacks demo) |
| `DATABASE_URL` | Postgres con pgvector para RAG (default del compose) |
| `SCRAPER_ENABLED` | `true`/`false` — scraper de redes |
| `OPENSHIP_URL` | URL de OpenShip (ej: `http://164.68.126.30:4100`) |
| `OPENSHIP_TOKEN` | Token interno de OpenShip (también acepta `INTERNAL_TOKEN`) |
| `OPENSHIP_LANDINGS_DIR` | Directorio HTML estático fallback (default `/opt/landings`) |
| `PUBLIC_LANDINGS_BASE` | URL pública de landings estáticas (ej: `http://164.68.126.30:8080`) |

## Desarrollo local

```bash
# Backend (puerto 4005)
cd backend && npm install && npm run dev

# Frontend (puerto 3005)
cd frontend && npm install && npm run dev
```

## Deploy en Hermes (164.68.126.30) con Docker

```bash
git clone https://github.com/gonferpach/2braind-landing-factory.git
cd 2braind-landing-factory
cp .env.example .env  # rellena OPENAI_API_KEY / OPENSHIP_TOKEN si los tienes

docker compose up -d --build

# Frontend:        http://164.68.126.30:3005
# Backend:         http://164.68.126.30:4005/api/health
# Landings estáticas (nginx): http://164.68.126.30:8080/{slug}/
# Postgres pgvector: landing_pg:5432 (db 2braind)
```

## Flujo de uso

1. Entra a `http://<host>:3005/admin`
2. Pon tu Instagram / Facebook / TikTok / Website y pulsa **"Scrapear y pre-rellenar"**:
   extrae bio, fotos y paleta de tus redes
3. Completa el resto del formulario (la bio scrapeada pre-rellena la descripción)
4. **"Generar mi landing ✨"**: el RAG elige plantilla, extrae palette y genera SEO
5. Verás el preview de **paleta** 🎨 y **SEO** 🔍
6. **"Publicar con OpenShip"** 🚀 → deploya la landing (API o HTML estático + nginx)

## Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/landings` | Crea landing: scraper → RAG → palette → SEO |
| GET | `/api/landings` | Lista todas |
| GET | `/api/landings/:slug` | Obtiene una landing por slug |
| POST | `/api/landings/:slug/deploy` | Deploya vía OpenShip o HTML estático |
| GET | `/api/templates` | Lista plantillas disponibles |
| POST | `/api/rag/query` | RAG: top plantilla con score |
| POST | `/api/scrape` | Scrapea IG/FB/TikTok → `{bio, posts, photos, palette}` |
| POST | `/api/scrape/instagram` | Scraper IG individual (debug) |
| POST | `/api/scrape/facebook` | Scraper FB individual (debug) |
| POST | `/api/scrape/tiktok` | Scraper TikTok individual (debug) |
| GET | `/api/health` | Health check (+ modo RAG) |

### Ejemplos curl

```bash
# Scrapear redes sociales
curl -X POST localhost:4005/api/scrape \
  -H 'Content-Type: application/json' \
  -d '{"instagram":"nike","facebook":"https://facebook.com/nike"}'

# Consulta RAG
curl -X POST localhost:4005/api/rag/query \
  -H 'Content-Type: application/json' \
  -d '{"name":"Pollería La Rural","description":"pollería brasa delivery","category":"comida"}'

# Crear landing (con scraper + RAG + palette + SEO)
curl -X POST localhost:4005/api/landings \
  -H 'Content-Type: application/json' \
  -d '{"name":"Pollería La Rural","description":"La mejor brasa de Arequipa","redes":{"instagram":"la.rural.arequipa"}}'

# Publicar con OpenShip
curl -X POST localhost:4005/api/landings/polleria-la-rural/deploy
```

## Notas

- El scraper de Instagram funciona con perfiles públicos sin login cuando Instagram
  no bloquea; hoy en día la mayoría de respuestas son login-wall → se devuelve mock
  marcado con `mocks: ["instagram"]` para que la UX no se rompa.
- El RAG hace seed de las plantillas al arrancar el backend (tabla `template_embeddings`).
- `node-vibrant` es opcional: si lo instalas (`npm i node-vibrant`) la palette se extrae
  de la foto principal; si no, se usa palette por categoría.

## Postgres (opcional)

El backend funciona con `data/landings.json`. El RAG usa pgvector si `DATABASE_URL`
está configurado y el paquete `pg` está instalado (ya incluido en backend/package.json).