# AgriMarket Backend

API del MVP de AgriMarket (autenticación, productos y solicitudes de compra).

## Requisitos

- Node.js 18+ (o Bun)

## Configuración

```bash
cp .env.example .env
npm install
npm run dev
```

No subas el archivo `.env`. Usa solo variables del `.env.example`.

## Endpoints principales

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products`
- `POST /api/products` (productor)
- `POST /api/requests` (consumidor)
- `GET /api/me/requests`
- `PATCH /api/requests/:id/status` (productor)
