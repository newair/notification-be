# notification-be

Push notification service for end users of a given app. Stores FCM device tokens per `appId` + `userId` in MongoDB and delivers push notifications through Firebase Cloud Messaging (firebase-admin).

This is an independent NestJS service, structured the same way as the sibling services (`user-be`, `chat-be`, `square-be`).

## API

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/notifications/device-token` | Register/update an FCM device token for a user of an app (upsert by token) |
| `POST` | `/notifications/send` | Send a push notification to all devices of a user within an app |
| `GET` | `/health` | Health check (`{ status: 'ok', service: 'notification-be' }`) |
| `GET` | `/api` | Swagger UI (`/api-json` for the raw spec) |

All notification requests are scoped by `appId`, consistent with the multi-tenant pattern used across the other services.

### Register device token

```bash
curl -X POST http://localhost:3001/notifications/device-token \
  -H 'Content-Type: application/json' \
  -d '{
    "appId": "app-12345",
    "userId": "507f1f77bcf86cd799439011",
    "token": "<FCM_DEVICE_TOKEN>",
    "platform": "android"
  }'
```

Response: `{ "registered": true }`

### Send push notification

```bash
curl -X POST http://localhost:3001/notifications/send \
  -H 'Content-Type: application/json' \
  -d '{
    "appId": "app-12345",
    "userId": "507f1f77bcf86cd799439011",
    "title": "Hello",
    "body": "Test push notification",
    "data": { "screen": "orders", "id": "123" }
  }'
```

Response: `{ "sent": 2, "failed": 0, "invalidTokens": [] }`

Invalid/unregistered tokens reported by FCM are removed from the database automatically and returned in `invalidTokens`.

`400` is returned when no device tokens exist for the user/app, or when Firebase credentials are not configured.

## Setup

```bash
npm install
cp .env.example .env   # then fill in values
npm run start:dev
```

The service listens on port `3001` locally by default (`PORT` to override). In production containers it runs on `3000` behind the shared nginx gateway, same as the other services.

### Firebase credentials

Provide one of:

- `FIREBASE_SERVICE_ACCOUNT` – inline service account JSON (raw or base64-encoded)
- `FIREBASE_SERVICE_ACCOUNT_PATH` – path to a service account JSON file
- `GOOGLE_APPLICATION_CREDENTIALS` – standard Google ADC file path

Without credentials the service still boots (token registration works), but `POST /notifications/send` returns `400 Firebase is not configured`.

## Scripts

```bash
npm run build             # compile
npm run start:dev         # watch mode
npm test                  # unit tests
npm run test:e2e          # e2e tests (requires MongoDB)
npm run lint              # eslint --fix
npm run swagger:generate  # write docs/swagger-spec.json without starting the server
```

The Swagger spec is also written to `docs/swagger-spec.json` automatically on every boot.

## Docker

```bash
docker build -t notification-be .
docker run -p 3000:3000 --env-file .env notification-be
```

## CI/CD

- `.github/workflows/ci.yml` – build + unit tests on pushes/PRs to `main`
- `.github/workflows/deploy-ecs.yml` – after a successful CI run on `main`, builds the Docker image, pushes it to ECR, and deploys the `notification-be` compose service on the Lightsail host (same pipeline shape as `chat-be`/`user-be`)

Deploy expects the same GitHub secrets as the sibling services (`AWS_*`, `ECR_REPOSITORY`, `LIGHTSAIL_*`, `MONGODB_URI`) plus `FIREBASE_SERVICE_ACCOUNT` / `FIREBASE_PROJECT_ID`.

Note: the gateway (`infra`) does not route to this service yet; adding the `/notification/` nginx route and compose service entry is a separate infra change.
