# 2braind Landing Factory 🚀

Fábrica de landings con IA: subes fotos + datos de tu negocio → la IA elige la plantilla → tu landing está lista en 5-10 minutos.

Creado para Gonzalo (Arequipa, Perú) 🇵🇪

## Estructura

```
2braind-landing-factory/
├── frontend/          # Next.js 14 (App Router) + Tailwind
│   ├── app/admin/     # Formulario de creación de landing
│   └── app/p/[slug]/  # Preview de la landing generada
├── backend/           # Express API + selector IA (mock)
├── templates/         # Plantillas base
│   ├── template-clinica/
│   └── template-restaurante/
├── docker-compose.yml
└── README.md
```

## Arquitectura

- **Frontend**: Next.js 14 con App Router, Tailwind CSS
- **Backend**: Express, guarda landings en JSON file (sin DB requerida, Postgres opcional)
- **Selector IA (mock)**: elige plantilla según la categoría/descripción del negocio
- **Plantillas**: componentes React por sección (hero, visión, misión, historia, quiénes somos, contacto, redes, footer)

## Desarrollo local

```bash
# Backend (puerto 4005)
cd backend && npm install && npm run dev

# Frontend (puerto 3005)
cd frontend && npm install && npm run dev
```

## Deploy en Hermes (164.68.126.30) con Docker

```bash
# 1. Copia el repo al servidor
git clone https://github.com/gonferpach/2braind-landing-factory.git
cd 2braind-landing-factory

# 2. Levanta todo
docker compose up -d --build

# Frontend: http://164.68.126.30:3005
# Backend:  http://164.68.126.30:4005/api/templates
```

### Deploy vía OpenShip
Configura el proyecto en OpenShip apuntando al repo, con build `docker compose build` y release `docker compose up -d`.

## Flujo de uso

1. Entra a `http://<host>:3005/admin`
2. Llena el formulario: nombre, descripción, categoría, visión, misión, historia, quiénes somos, contacto, redes sociales (WhatsApp, Facebook, Instagram, TikTok, YouTube)
3. Sube fotos (mock: URLs o placeholders)
4. La IA elige la plantilla (clínica, restaurante, genérica)
5. Tu landing queda en `http://<host>:3005/p/<slug>`

## Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/landings` | Crea landing (JSON), IA elige plantilla |
| GET | `/api/templates` | Lista plantillas disponibles |
| GET | `/api/landings/:slug` | Obtiene una landing por slug |
| GET | `/api/landings` | Lista todas |

## Postgres (opcional)

El backend funciona con `data/landings.json`. Para producción con Postgres, setea:

```env
DATABASE_URL=postgres://user:pass@host:5432/2braind
```

y descomenta la conexión en `backend/src/db.js`.