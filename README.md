# Taprail Platform

NFC payment infrastructure for Africa. Tap-to-pay, phone-to-phone, and card-present contactless payments powered by Interswitch.

## Architecture

```
platform/
  server/       Rust API server (Actix-web, PostgreSQL)
  dashboard/    React admin dashboard (Vite, Tailwind CSS)
```

**Server** handles authentication, payment sessions, NFC transaction processing, KYB verification, webhooks, and the Interswitch integration. Exposes two API tiers:

- **Infra** — Direct NFC card-present payments (EMV contactless via Interswitch)
- **Platform** — Token-based payment flow via SwitchService

**Dashboard** is the merchant admin panel for managing transactions, API keys, webhooks, team members, KYB onboarding, and analytics.

## Quick Start

### Docker Compose (recommended)

```bash
cp .env.example .env   # configure secrets
docker compose up
```

| Service   | URL                    |
|-----------|------------------------|
| Dashboard | http://localhost:3000   |
| Server    | http://localhost:8082   |
| Postgres  | localhost:5432          |

### Local Development

**Server** (requires Rust 1.88+ and PostgreSQL):

```bash
cd server
cp .env.example .env
cargo run
```

**Dashboard** (requires Node.js 20+):

```bash
cd dashboard
npm install
npm run dev
```

## Environment Variables

### Server

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_SECRET` | Secret for signing auth tokens | — |
| `HOST` | Bind address | `0.0.0.0` |
| `PORT` | Server port | `8082` |
| `DEFAULT_FEE_PERCENT` | Transaction fee percentage | `1.5` |
| `DEFAULT_FEE_CAP` | Maximum fee in Naira | `2000.0` |
| `RUST_LOG` | Log level | `info` |
| `ISW_PASSPORT_URL` | Interswitch OAuth endpoint | — |
| `ISW_BASE_URL` | Interswitch API base URL | — |
| `ISW_CLIENT_ID` | Interswitch client ID | — |
| `ISW_CLIENT_SECRET` | Interswitch client secret | — |
| `ISW_MERCHANT_CODE` | Merchant code | — |
| `ISW_PAY_ITEM_ID_CARD` | Payment item ID for card transactions | — |
| `ISW_RSA_MODULUS` | RSA public key modulus for authData encryption | — |
| `ISW_RSA_EXPONENT` | RSA exponent | `010001` |

## API Endpoints

### Authentication
- `POST /api/auth/register` — Create merchant account
- `POST /api/auth/login` — Authenticate and receive JWT

### Payment Sessions (Infra)
- `POST /api/infra/sessions` — Create NFC payment session
- `POST /api/infra/sessions/:id/verify` — Verify session (nonce + signature)
- `POST /api/infra/sessions/:id/complete` — Submit card data and process payment
- `POST /api/infra/sessions/:id/otp` — Submit OTP for 3D Secure

### Transactions
- `GET /api/transactions` — List transactions
- `GET /api/transactions/:id` — Transaction details

### API Keys
- `GET /api/keys` — List API keys
- `POST /api/keys` — Create API key
- `DELETE /api/keys/:id` — Revoke API key

### Webhooks
- `GET /api/webhooks` — List webhook endpoints
- `POST /api/webhooks` — Register webhook endpoint

### KYB Verification
- `POST /api/kyb/submit` — Submit KYB application
- `GET /api/kyb/status` — Check verification status

### Team Management
- `GET /api/team` — List team members
- `POST /api/team/invite` — Invite team member

## Docker Images

Images are published to GitHub Container Registry:

```bash
docker pull ghcr.io/taprail/server:latest
docker pull ghcr.io/taprail/dashboard:latest
```

## Database Migrations

Migrations run automatically on server startup via sqlx. To run manually:

```bash
cd server
sqlx migrate run
```

## Related Repositories

- [`Taprail/react-native`](https://github.com/Taprail/react-native) — React Native SDK (`@taprail/react-native`) with full EMV contactless NFC reading
- [`Taprail/demo-app`](https://github.com/Taprail/demo-app) — Expo demo app

## License

Proprietary. All rights reserved.
