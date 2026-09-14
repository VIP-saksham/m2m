# Mitti to Market (M2M)

Mitti to Market is a full-stack agricultural marketplace for farmers, buyers/processors, FPOs, and administrators. It helps farmers list produce, receive procurement opportunities, inspect market and storage options, and get AI-assisted crop guidance. Buyers and processors can post requirements, discover supply, create procurement lots, and communicate with sellers.

## Main capabilities

- Phone and email based registration with one account per phone and email
- Password login with email or phone identifier
- Optional Google Sign-In
- Farmer produce batches with images, pricing, description, dates, and quality information
- Farmer actions: assess produce, generate a decision, publish produce for sale, accept or decline lots
- AI-assisted crop image assessment using OpenCV signals and optional PyTorch preprocessing
- M2M Sahayak assistant with local fallback and optional server-side LLM configuration
- Buyer & Processor portal for requirements, matching, procurement lots, and confirmations
- Buy & Sell community with anonymous listing labels, search, likes, and direct messages
- Notifications and live/polling refresh on important dashboards
- Market intelligence and storage discovery
- Admin dashboard, account management, verification, moderation review, soft removal, notifications, and audit logs
- English/Hindi interface toggle

## Project structure

```text
frm/
├── backend/
│   ├── app/
│   │   ├── routes/       Flask API blueprints
│   │   ├── models/       SQLAlchemy database models
│   │   ├── services/     Assessment, matching, decisions, assistant, moderation
│   │   ├── providers/    Market and storage data providers
│   │   ├── ai/           Optional AI provider abstractions
│   │   ├── utils/        Shared validation/helpers
│   │   ├── config.py     Environment-backed configuration
│   │   └── __init__.py   Flask application factory
│   ├── tests/             Backend tests
│   ├── instance/m2m.db   Development SQLite database
│   ├── uploads/           Uploaded crop/listing images
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── pages/         Public, auth, farmer, buyer, and admin pages
│   │   ├── layouts/       Role-specific navigation layouts
│   │   ├── components/    Reusable UI and domain components
│   │   ├── context/       Authentication and notification state
│   │   ├── services/      Axios API client
│   │   └── App.jsx        Routes and protected-route rules
│   ├── public/
│   ├── package.json
│   └── .env
└── README.md
```

## Requirements

- Windows, macOS, or Linux
- Python 3.11+ recommended
- Node.js 18+ recommended
- npm
- A Python virtual environment for the backend

## Local setup

### 1. Backend

```powershell
cd C:\Users\user\Pictures\frm\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

The API runs on `http://localhost:5000`.

Useful checks:

```text
http://localhost:5000/health
http://localhost:5000/api/auth/config
```

### 2. Frontend

Open a second terminal:

```powershell
cd C:\Users\user\Pictures\frm\frontend
npm install
npm run dev
```

The web app runs on `http://localhost:5173`.

For a production build:

```powershell
npm run build
npm run preview
```

## Environment configuration

Backend configuration is read from `backend/.env`. Keep this file local and never commit real secrets.

Common settings:

```env
DATABASE_URL=sqlite:///m2m.db
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216
DEMO_MODE=true
GOOGLE_CLIENT_ID=your-google-web-client-id
GOOGLE_CLIENT_IDS=
LLM_API_URL=
LLM_API_KEY=
LLM_MODEL=
GEMINI_API_KEY=
```

The frontend uses `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

After changing an environment file, restart the affected dev server.

### Google Sign-In

Google Sign-In uses the Google Identity Services browser SDK and sends the ID token to the backend for verification. Set `GOOGLE_CLIENT_ID` in the backend environment, then add these origins to the same OAuth Web Client in Google Cloud Console:

```text
http://localhost:5173
http://127.0.0.1:5173
```

The backend exposes only the public client ID through `/api/auth/config`. A Google Client Secret is not placed in the frontend.

## Roles and important flows

### Farmer

1. Register with name, phone, email, role, and password.
2. Create a produce batch.
3. Add quantity, dates, price range, description, and optional image.
4. Run assessment and review the estimated grade, maturity, risk, selling window, and price range.
5. Generate a SELL, STORE, or PROCESS decision.
6. Use **Sell now** to publish the batch to Buy & Sell.
7. Review opportunities and procurement lots.
8. Accept or decline a lot; the buyer/process owner receives a notification.

### Buyer & Processor

1. Register as **Buyer & Processor**.
2. Post a buying requirement with crop, quantity, price, region, and deadline.
3. Review matching farmer supply.
4. Create or review procurement lots.
5. Confirm or reject lots.
6. Message or like eligible community listings.

The old backend `processor` role is still supported for compatibility, but the public UI presents it as the combined Buyer & Processor portal.

### Admin

Admins can:

- View platform statistics
- Verify accounts
- Suspend and reinstate accounts
- Soft-remove accounts, batches, or demands
- Notify affected users
- Review suspicious marketplace content
- Review reports, audit logs, users, lots, batches, and demands

Removal is intentionally soft rather than destructive so the owner can be notified and the audit trail remains available.

## Route overview

### Public and authentication

- `/`
- `/how-it-works`
- `/for-farmers`
- `/for-processors`
- `/about`
- `/login`
- `/register`
- `/forgot-password`

### Farmer

- `/farmer/dashboard`
- `/farmer/batches`
- `/farmer/batches/new`
- `/farmer/decision-center`
- `/farmer/opportunities`
- `/farmer/lots`
- `/farmer/market`
- `/farmer/storage`
- `/farmer/notifications`
- `/farmer/profile`

### Buyer & Processor

- `/processor/dashboard`
- `/processor/demands/new`
- `/processor/demands`
- `/processor/lots`
- `/processor/notifications`
- `/processor/profile`

### Shared and admin

- `/community`
- `/network`
- `/surplus-radar`
- `/value-recovery`
- `/admin/dashboard`
- `/admin/users`
- `/admin/batches`
- `/admin/demands`
- `/admin/lots`
- `/admin/verification`
- `/admin/reports`
- `/admin/audit-logs`
- `/admin/notifications`
- `/admin/profile`

## Testing

Run the backend suite:

```powershell
cd C:\Users\user\Pictures\frm\backend
python -m pytest
```

Run the frontend build:

```powershell
cd C:\Users\user\Pictures\frm\frontend
npm run build
```

The current backend test suite covers authentication, Google auth, batches, decisions, procurement lots, and matching.

## Data and safety notes

- The local SQLite database is stored in `backend/instance/m2m.db`.
- Uploaded images are stored under `backend/uploads`.
- Do not delete the database or uploads unless you have a backup and explicitly want to remove local data.
- AI crop grading is an estimate, not a certified laboratory result.
- Moderation flags suspicious content for admin review instead of automatically deleting legitimate listings.
- Real API keys must be rotated if they have ever been exposed and then stored only in backend environment variables.

## Troubleshooting

### "Cannot reach the server"

Start the backend and check:

```text
http://localhost:5000/health
```

Confirm `frontend/.env` contains:

```env
VITE_API_URL=http://localhost:5000
```

Restart Vite after changing it.

### Google origin error

If Google shows `The given origin is not allowed for the given client ID`, add both localhost origins listed in the Google Sign-In section to the OAuth Web Client and hard-refresh the browser.

### Existing SQLite schema

The development app adds compatible columns when needed. Old unused columns can remain in an existing SQLite file; they are not used by the active registration flow.
