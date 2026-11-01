# AI Mystery Investigation Game (The Detective's Desk)

> A responsive, AI-powered mystery investigation web application where players investigate procedurally generated cases with strict server-side secrecy, verifiable evidence, and authoritative scoring.

Built in accordance with the project specification [`SPEC.md`](./SPEC.md).

---

## 🔍 Features & Highlights

- **Gemini AI Mystery Generation**: Dynamically crafts rich detective puzzles from any player premise with consistent timelines, suspect alibis, forensic clues, and progressive hints.
- **Server-Enforced Secrecy**: The solution, culprit ID, undiscovered clue details, and unused hints are never exposed in client bundles, DOM markup, or active API responses before an accusation is made.
- **Three Distinct Difficulties**:
  - **Easy**: 3 suspects, 5 clues, 2 hints (+100 correct accusation bonus)
  - **Medium**: 4 suspects, 7 clues, 3 hints (+150 correct accusation bonus)
  - **Hard**: 5 suspects, 9 clues, 3 hints (+200 correct accusation bonus)
- **Authoritative Progress & Scoring**:
  - Clue discovery awards `+5 pts` per unique piece of evidence (idempotent, no double-counting).
  - Detective hints incur a `-10 pts` penalty each.
  - Final score formula: `max(0, bonus + cluePoints - hintPenalty)`.
  - Score is calculated and validated entirely on the backend and cannot drop below zero.
- **Atmospheric Noir Interface**: Detective case file aesthetic with dark slate tones, gold/amber badge accents, real-time character counters, evidence discovery cards, and victory celebrations.
- **Automated Fallback & In-Memory Mode**: If MongoDB or a Gemini API key is not yet configured, the system gracefully boots using in-memory MongoDB and a procedural puzzle generator for instant local testing.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite | Single-page reactive UI with client routing |
| **Styling** | Tailwind CSS, PostCSS | Responsive noir design tokens and mobile-first layouts |
| **Icons & FX** | Lucide React, Canvas Confetti | Visual iconography and case solved celebration |
| **Backend** | Node.js (LTS), Express | RESTful API, security middleware, and rate limiting |
| **Database** | MongoDB, Mongoose | Case persistence, audit trail, and schema validation |
| **AI Engine** | Google Gemini API (`@google/generative-ai`) | Structured JSON case generation with bounded retries |
| **Validation** | Zod | Strict schema validation for user input and AI responses |
| **Testing** | Node.js Test Runner, Supertest | Unit & integration tests for secrecy, scoring, and lifecycle |

---

## 📂 Repository Layout

```text
mystery-investigation/
├── client/                      # React / Vite frontend
│   ├── src/
│   │   ├── api/client.js        # API service with error handling
│   │   ├── components/          # Navbar, Footer, Badges, Modals, Loaders
│   │   ├── pages/               # Home, CreateCase, InvestigationRoom, Results
│   │   ├── App.jsx              # Client routes
│   │   ├── main.jsx             # React entry point
│   │   └── index.css            # Tailwind & noir theme styling
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── server/                      # Node.js / Express backend
│   ├── src/
│   │   ├── config/              # Environment config and DB connection
│   │   ├── controllers/         # Case lifecycle controller
│   │   ├── middleware/          # Rate limiting, helmet, and error handlers
│   │   ├── models/Case.js       # Mongoose Case model
│   │   ├── routes/caseRoutes.js # REST endpoints
│   │   ├── services/            # Gemini AI service and scoring logic
│   │   ├── utils/serializers.js # Strict public response serializers
│   │   ├── validators/          # Zod validation schemas
│   │   ├── app.js               # Express application setup
│   │   └── server.js            # Server entry point
│   ├── tests/
│   │   ├── unit/                # Scoring, validation, and secrecy unit tests
│   │   └── integration/         # Full investigation lifecycle integration tests
│   ├── .env.example
│   └── package.json
├── .env.example                 # Root environment template
├── README.md                    # Project documentation
└── SPEC.md                      # Complete system specification
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v20 and v26)
- **npm**: v9+
- *(Optional)* **MongoDB**: Local MongoDB instance or MongoDB Atlas URI (falls back to memory server automatically in dev/test)
- *(Optional)* **Google Gemini API Key**: [Get a Gemini API Key](https://aistudio.google.com/app/apikey)

### 2. Install Dependencies
From the repository root:
```bash
npm run install:all
```
Or individually:
```bash
cd server && npm install
cd ../client && npm install
```

### 3. Environment Configuration
Copy the sample environment file into `server/.env`:
```bash
cp server/.env.example server/.env
```

Configure your variables in `server/.env`:
```dotenv
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/mystery_investigation
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
CLIENT_ORIGIN=http://localhost:5173
```
> **Note**: If `GEMINI_API_KEY` is omitted, the app will run in **Procedural Fallback Mode**, generating compliant mystery puzzles instantly for zero-cost testing.

### 4. Running Locally

#### Development Mode (Concurrent)
In two separate terminals:
```bash
# Terminal 1: Start Backend API (runs on http://localhost:5000)
npm run dev:server

# Terminal 2: Start Frontend Dev Server (runs on http://localhost:5173)
npm run dev:client
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

#### Production Build & Monolithic Preview
Build the React frontend and run the Express server:
```bash
npm run build
npm start
```
The server will automatically serve the built client at [http://localhost:5000](http://localhost:5000).

---

## 🧪 Automated Testing

The project includes unit and integration tests covering:
- Exact suspect, clue, and hint counts per difficulty.
- Referential integrity of culprits and supporting clue IDs.
- Deterministic scoring math and zero floor constraints.
- Idempotent clue discovery (no duplicate points).
- Strict server-side secrecy (verifying active cases do NOT leak solutions or hidden clue text).
- Complete investigation lifecycle from case creation to accusation and results.

Run the test suite:
```bash
npm test
```
Or directly in the server directory:
```bash
npm test --prefix server
```

---

## 📡 API Specification

All endpoints are prefixed with `/api`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health status probe (`{ status: "ok" }`) |
| `POST` | `/api/cases` | Generate a new mystery (`premise`, `difficulty`) |
| `GET` | `/api/cases/:id` | Retrieve active case (sanitized, excludes solution) |
| `POST` | `/api/cases/:id/clues/:clueId/discover` | Inspect and discover a clue (+5 pts) |
| `POST` | `/api/cases/:id/hints` | Request next hint (-10 pts penalty) |
| `POST` | `/api/cases/:id/accuse` | Submit final suspect accusation and seal case |
| `GET` | `/api/cases/:id/result` | Retrieve final verdict, culprit, and score breakdown |

### Standard Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Premise must be at least 20 characters long.",
    "details": []
  }
}
```

---

## ⚖️ Scoring Rules

| Event | Score Impact |
|---|---|
| Correct Accusation — Easy | **+100 pts** |
| Correct Accusation — Medium | **+150 pts** |
| Correct Accusation — Hard | **+200 pts** |
| Incorrect Accusation | **+0 bonus pts** |
| Each Unique Clue Discovered | **+5 pts** |
| Each Detective Hint Used | **-10 pts** |
| Minimum Final Score | **0 pts** (never negative) |

---

## 🌐 Deployment

### Frontend (e.g., Vercel, Netlify)
1. Set the root build directory to `client`.
2. Build command: `npm run build`.
3. Output directory: `dist`.
4. Environment variable: `VITE_API_BASE_URL=https://your-backend-api.com` (if hosted on a separate domain).

### Backend (e.g., Render, Railway, Fly.io)
1. Set the working directory to `server` or repository root.
2. Build command: `npm install --prefix server`.
3. Start command: `node server/src/server.js`.
4. Configure environment variables (`MONGODB_URI`, `GEMINI_API_KEY`, `CLIENT_ORIGIN`, `NODE_ENV=production`).

---

## 📜 License
MIT License. Created for the AI Mystery Investigation Game project.

