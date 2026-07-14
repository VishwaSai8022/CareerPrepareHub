# CareerPrepHub

This project now uses a **full-stack setup**:

- Frontend: static HTML/CSS/JS in `frontend/`
- Backend: Node.js + Express + MongoDB in `backend/`

## Backend structure

```text
backend/
  src/
    config/
      constants.js
      db.js
    controllers/
      auth.controller.js
      question.controller.js
    middleware/
      asyncHandler.middleware.js
      auth.middleware.js
      error.middleware.js
      premium.middleware.js
    models/
      aptitudeQuestion.model.js
      codingQuestion.model.js
      otp.model.js
      progress.model.js
      user.model.js
    routes/
      auth.routes.js
      question.routes.js
    services/
      auth.service.js
      question.service.js
      user.service.js
      payment.service.js
    utils/
      generateToken.js
      otpGenerator.js
      apiResponse.js
    app.js
  scripts/
    seed.js
  server.js
  .env.example
  package.json
```

## API endpoints

### Health
- `GET /api/health`

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/forgot-password`
- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/reset-password`

### Questions
- `GET /api/aptitude`
  - Supports query params: `topic`, `difficulty`
- `GET /api/aptitude/:topic`
  - Supports query param: `difficulty`
- `GET /api/coding`
  - Supports query params: `topic`, `difficulty`
- `GET /api/questions/:id`
  - Accepts Mongo `_id` or legacy numeric ID for coding questions

> Hard-question protection (bonus): hard questions require JWT user with `role=paid/admin` or `isPremium=true`.

> Architecture flow: `Route -> Controller -> Service -> Model`

## Environment setup

1. Copy env file:

```bash
cd backend
copy .env.example .env
```

2. Update `backend/.env` values:
- `MONGODB_URI`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `CORS_ORIGINS`

## Google OAuth setup

1. Create OAuth credentials in Google Cloud Console.
2. Use a **Web application** client.
3. Add your local frontend origin, for example:
   - `http://localhost:5500`
4. Copy the generated client ID into:
   - `backend/.env` as `GOOGLE_CLIENT_ID`
   - the `<meta name="google-signin-client_id">` tag in:
     - `frontend/pages/login.html`
     - `frontend/pages/signup.html`

> Important: Google tokens are verified on the backend before a JWT is issued. In production, serve both frontend and backend over HTTPS.

## Run backend

```bash
cd backend
npm install
npm run seed
npm run dev
```

Server runs at: `http://localhost:5000`

## Run frontend

Use any static server for `frontend/` (for example VS Code Live Server), then open:

- `frontend/pages/home.html`

## Authentication behavior

- Local users sign up with email/password and passwords are hashed with bcrypt.
- Google users authenticate with Google Identity Services and do **not** store a password.
- Email is the unique account identifier, preventing duplicate accounts.
- If a Google-only account tries password login, the backend blocks it and asks the user to continue with Google.
- Successful local or Google login returns a JWT and user profile which the frontend stores in `localStorage`.

Frontend data now comes from backend APIs (not JSON files for aptitude/coding datasets).
