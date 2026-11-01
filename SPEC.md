# Mystery Investigation Game --- Project Specification

**Document:** `SPEC.md`\
**Status:** Implementation blueprint\
**Version:** 1.0\
**Primary stack:** React, Vite, Tailwind CSS, Node.js, Express, MongoDB,
Mongoose, Gemini API

------------------------------------------------------------------------

## 1. Project Overview

### 1.1 Purpose

Build a responsive, AI-powered mystery investigation web application. A
player supplies a short premise, chooses a difficulty, investigates a
generated case by examining suspects and discovering clues, optionally
requests hints, and finally accuses one suspect. The server evaluates
the accusation and reveals the culprit, reasoning, and score only after
submission.

### 1.2 Problem Statement

Mystery games can be repetitive, linear, or limited to a fixed
collection of stories. This application uses Gemini to generate
replayable mysteries while enforcing a consistent solution, meaningful
evidence, fair scoring, and server-side secrecy.

### 1.3 Product Goals

-   Make starting a mystery simple and engaging.
-   Generate cases that match the chosen difficulty and requested
    premise.
-   Provide a fair investigation loop with suspects, clues, and optional
    hints.
-   Prevent the client from seeing the solution before accusation.
-   Keep all authoritative progress, validation, and scoring on the
    backend.
-   Support mobile, tablet, and desktop layouts.
-   Make the project understandable and maintainable for students and AI
    coding tools.

### 1.4 Non-goals and Limitations

-   No multiplayer, live chat, user-to-user content, or real-time
    collaboration in version 1.
-   No payment system or subscription tiers.
-   No guarantee that every AI-generated narrative is perfect; generated
    cases must pass structural and consistency checks, and generation
    should be retried or rejected when invalid.
-   No anonymous cross-device recovery unless a future authentication
    system is added.
-   No client-side authority for culprit, clue discovery, hint usage, or
    score.
-   Gemini availability, latency, quota, and output quality depend on
    the configured API and model.
-   The application is entertainment, not a real-world investigative or
    legal tool.

------------------------------------------------------------------------

## 2. Target Users and User Experience

### 2.1 Target Users

-   Students and casual players who enjoy detective stories and
    puzzle-solving.
-   Users who want short, replayable mysteries.
-   Users who prefer a selectable difficulty and optional help.

### 2.2 Desired Experience

The experience should feel like entering a detective's case file:
atmospheric but readable, focused on evidence, and easy to navigate.
Players should understand what to do next without needing instructions
outside the application. The game should never reveal the culprit in the
initial payload, page source, client state, or ordinary API responses
before an accusation is submitted.

### 2.3 UX Principles

-   **Clarity:** Show the current objective and investigation progress.
-   **Fairness:** The correct answer must be inferable from evidence.
-   **Agency:** Let players inspect evidence and decide when to use
    hints.
-   **Feedback:** Provide clear loading, success, and error states.
-   **Accessibility:** Keyboard support, visible focus, semantic
    controls, sufficient contrast, and labels for form inputs.
-   **Responsive design:** Use a single-column layout on small screens
    and multi-column cards on larger screens.

------------------------------------------------------------------------

## 3. Scope and Features

### 3.1 Core Features

1.  Home page with introduction and primary call to action.
2.  Mystery creation using a premise and difficulty.
3.  Gemini-powered generation of a title, story, suspects, clues, hints,
    and a private solution.
4.  Investigation room showing story, suspects, available clues, and
    progress.
5.  Clue discovery with persistent progress.
6.  Hint requests with a score penalty and a limited number of hints.
7.  Accusation submission with a selected suspect.
8.  Results page showing verdict, culprit, explanation, and final score.
9.  Start another mystery.
10. Backend validation, score calculation, error handling, and solution
    secrecy.
11. Persisted case state in MongoDB.
12. Responsive and accessible UI.

### 3.2 Optional Enhancements

-   Case history and replay.
-   A timer or optional timed challenge.
-   Sound effects and subtle animations with mute controls.
-   Player accounts and saved case history.
-   Difficulty-specific visual themes.
-   Shareable result summaries that do not expose active-case solutions.
-   Admin-only diagnostics for invalid AI generations.
-   Automated tests and basic observability.

Optional features must not delay or weaken the core security and
acceptance requirements.

------------------------------------------------------------------------

## 4. Technology Stack and Architecture

### 4.1 Required Stack

  Layer              Technology           Responsibility
  ------------------ -------------------- --------------------------------------------
  Frontend           React                Page and component UI
  Frontend tooling   Vite                 Development server and production build
  Styling            Tailwind CSS         Responsive styling and design tokens
  Backend runtime    Node.js              Server runtime
  API                Express              HTTP routes, middleware, validation
  Database           MongoDB              Persistent case records
  ODM                Mongoose             Schemas, validation, database operations
  AI                 Gemini API           Generate case content and private solution
  HTTP client        Fetch API or Axios   Frontend-to-backend requests

Use a supported Node.js LTS release. Keep the frontend and backend
independently configurable, for example `/client` and `/server`, or
clearly separated at the repository root.

### 4.2 Suggested Repository Layout

``` text
mystery-investigation/
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   └── package.json
├── .gitignore
├── README.md
└── SPEC.md
```

### 4.3 Environment Configuration

Backend environment variables:

``` dotenv
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/mystery_investigation
GEMINI_API_KEY=replace_with_real_secret
GEMINI_MODEL=replace_with_supported_model_name
CLIENT_ORIGIN=http://localhost:5173
```

-   Never commit `.env`.
-   Never expose `GEMINI_API_KEY` through a `VITE_` variable or frontend
    bundle.
-   Provide `.env.example` with placeholders only.
-   Validate required environment variables at server startup and fail
    with a clear server-side message if missing.
-   Configure CORS to allow only the deployed frontend origin(s).
-   Use a deployment-provided MongoDB URI and HTTPS in production.

------------------------------------------------------------------------

## 5. User Flow

1.  **Open website:** The Home page explains the game and displays
    "Start a Mystery."
2.  **Create mystery:** The player enters a premise and selects Easy,
    Medium, or Hard. Validate the input before sending it.
3.  **Generate case:** The frontend displays a loading state while the
    backend asks Gemini for structured case data. The backend validates
    the output and stores the case.
4.  **Enter investigation:** The player sees the title, opening story,
    suspects, clue list, and progress. Private solution fields are not
    returned.
5.  **Investigate:** The player selects a clue to discover it. The
    server marks it discovered and returns its text and updated
    progress.
6.  **Request a hint:** The player requests a hint. The server returns
    the next available hint, records its use, and recalculates the
    score.
7.  **Accuse:** The player selects a suspect and submits the accusation.
    The server verifies the case is active and the suspect belongs to
    the case, then locks the case as completed and calculates the final
    score.
8.  **Results:** The results page shows whether the accusation was
    correct, the actual culprit, the explanation, evidence-based
    reasoning, and final score.
9.  **Play again:** The player returns to Create Mystery and starts a
    new case.

### 5.1 Navigation and State Rules

-   Routes may be `/`, `/create`, `/case/:id`, and `/case/:id/result`.
-   A case ID is an opaque identifier, not an authorization secret.
-   Refreshing an active case must restore the current public state from
    the server.
-   If a case does not exist, show a not-found message and a link to
    start again.
-   If an active case is already completed, redirect to its result view.
-   The results endpoint must reject requests for active cases without
    revealing the culprit or explanation.
-   Do not put private solution data in URL parameters, browser storage,
    HTML comments, or frontend state.

------------------------------------------------------------------------

## 6. UI and Page Specifications

### 6.1 Home Page

**Purpose:** Explain the game and invite the user to begin.

**Required elements:** - Product name and short tagline. - Brief
explanation of how to play. - Primary "Start a Mystery" button linking
to `/create`. - Three concise steps: create, investigate, accuse. -
Optional sample case artwork or decorative detective-themed elements.

**States:** Normal, and a recoverable error state if a required
configuration or service status check is exposed.

### 6.2 Create Mystery Page

**Purpose:** Collect the premise and difficulty.

**Required elements:** - Premise text area with example placeholder. -
Character count and validation feedback. - Difficulty selector: Easy,
Medium, Hard. - Summary of suspects, clues, and hints for the selected
difficulty. - "Generate Mystery" submit button. - Back navigation to
Home.

**Validation:** - Trim whitespace. - Premise must be non-empty. -
Suggested limit: 20--500 characters. - Difficulty must be one of `easy`,
`medium`, or `hard`. - Disable duplicate submissions while generation is
in progress.

**Loading state:** Show "Building your case..." with a progress
indicator and prevent repeated requests. Do not imply an exact
completion time.

**Error state:** Show a concise message such as "We couldn't create a
valid mystery. Please try again." Offer retry without losing the entered
premise.

### 6.3 Investigation Room

**Purpose:** Let the player review the narrative and investigate
evidence.

**Required elements:** - Case title, difficulty, and opening story. -
Progress indicator for discovered clues. - Suspect cards with public
information: ID, name, description, and alibi. - Clue cards with a
title, short teaser, and state: undiscovered or discovered. - "Discover
clue" action on each undiscovered clue. - Hint panel with remaining
hints and "Request hint" action. - Current score estimate, clearly
labeled as provisional. - "Make an accusation" button.

**Clue behavior:** - Undiscovered clues must not reveal their full text
in page markup, API payloads, or client state. - Clicking "Discover
clue" calls the backend. Only after success should the full clue text
appear. - A clue may be discovered only once. Repeated requests must not
award duplicate points. - The UI must show a loading/disabled state
while discovery is in progress.

**Hint behavior:** - Hints are provided in a predefined order. - Each
hint can be used only once. - If no hints remain, disable the request
button and explain why. - Display a clear warning that using a hint
costs 10 points. - Do not include unused hint text in initial case
responses.

**Progress and errors:** - Show "X of Y clues discovered." - Keep
progress synchronized with server responses. - On network failure, show
retry and retain the last confirmed server state. - Do not mark a clue
or hint as completed optimistically unless the UI can reliably reconcile
a failed request.

### 6.4 Accusation Page or Panel

**Purpose:** Let the player make one final choice.

**Required elements:** - Short instruction reminding the player to use
evidence. - Selectable suspect cards or radio controls. - Selected-state
indication. - Confirmation step or explicit "Submit accusation"
action. - Warning that submission ends the investigation.

**Rules:** - Require exactly one suspect ID. - Reject a suspect ID that
does not belong to the case. - Prevent duplicate submissions. - Once the
accusation is accepted, the case is completed and the accusation cannot
be changed in version 1.

### 6.5 Results Page

**Purpose:** Explain the outcome and reward the investigation.

**Required elements:** - Verdict: correct or incorrect. - Culprit's name
and public suspect details. - Final score and score breakdown. -
Explanation of the solution and how the evidence supports it. - List of
relevant discovered and undiscovered clues, as appropriate after
completion. - "Play Again" and "Back to Home" actions.

**Security rule:** Reveal the culprit and full solution only after the
server accepts an accusation. The client must retrieve the result from
`GET /api/cases/:id/result`.

### 6.6 Shared UI Requirements

-   Responsive at approximately 320 px through wide desktop screens.
-   Mobile: single-column cards, large touch targets, no horizontal page
    overflow.
-   Tablet: two-column content where useful.
-   Desktop: investigation story and evidence can use a two- or
    three-column layout.
-   All forms have labels, validation messages, keyboard access, and
    visible focus states.
-   Buttons communicate disabled and loading states.
-   Use consistent typography, spacing, and color tokens.
-   Respect reduced-motion preferences.
-   Provide a clear empty state when there are no cases or clues to
    display.

------------------------------------------------------------------------

## 7. API Design

### 7.1 API Conventions

-   Base path: `/api`.
-   Request and response bodies use JSON unless otherwise stated.
-   Use consistent status codes and an error format.
-   Never return Mongoose internal fields or private solution data in
    active-case responses.
-   Use server-side validation even when the frontend validates the same
    fields.
-   Apply request size limits, rate limiting, and sensible generation
    timeouts.
-   Suggested standard error shape:

``` json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Choose a valid difficulty.",
    "details": []
  }
}
```

`details` may be omitted when no field-level details are useful. Do not
return stack traces, API keys, raw provider responses, or database
internals to clients.

### 7.2 `POST /api/cases` --- Generate a Mystery

**Request:**

``` json
{
  "premise": "A priceless watch disappears during a locked-room dinner.",
  "difficulty": "medium"
}
```

**Success (`201 Created`) --- public response only:**

``` json
{
  "case": {
    "id": "case_id",
    "title": "The Last Chime",
    "premise": "A priceless watch disappears during a locked-room dinner.",
    "story": "Opening narrative shown to the player.",
    "difficulty": "medium",
    "suspects": [
      {
        "id": "suspect_1",
        "name": "Mira Vale",
        "description": "A concise public description.",
        "alibi": "A public alibi."
      }
    ],
    "clues": [
      {
        "id": "clue_1",
        "title": "The Dining Room Clock",
        "teaser": "Something about the clock seems unusual.",
        "discovered": false,
        "text": null
      }
    ],
    "progress": {
      "discoveredClueIds": [],
      "usedHintCount": 0,
      "remainingHints": 3,
      "score": 0
    },
    "status": "active"
  }
}
```

Arrays in this example are illustrative; actual lengths must match the
selected difficulty. Do not return `solution`, `culpritId`, hidden clue
text, or unused hint text.

**Validation:** `premise` is a trimmed string of 20--500 characters;
`difficulty` is an allowed enum.

**Errors:** `400 VALIDATION_ERROR`, `429 RATE_LIMITED`,
`502 AI_GENERATION_FAILED`, `503 AI_SERVICE_UNAVAILABLE`,
`500 INTERNAL_ERROR`.

### 7.3 `GET /api/cases/:id` --- Retrieve Active Mystery

**Success (`200 OK`):** Return the same public case structure as above,
including only discovered clue text and only hints already used. Omit
all private solution fields.

**Errors:** `400 INVALID_CASE_ID`, `404 CASE_NOT_FOUND`,
`500 INTERNAL_ERROR`.

If the case is completed, the response may include a
`status: "completed"` marker and a result URL, but must not reveal the
culprit or explanation in this endpoint. The frontend should navigate to
the results route.

### 7.4 `POST /api/cases/:id/clues/:clueId/discover` --- Discover a Clue

**Request:** Empty JSON body.

**Success (`200 OK`):**

``` json
{
  "clue": {
    "id": "clue_1",
    "title": "The Dining Room Clock",
    "text": "The full clue text is returned only after discovery."
  },
  "progress": {
    "discoveredClueIds": ["clue_1"],
    "discoveredClueCount": 1,
    "totalClueCount": 7,
    "score": 5
  }
}
```

**Rules:** - Case must be active. - Clue must belong to the case. -
First discovery records the clue and awards +5. - Repeated discovery
returns the already discovered clue without additional points. - The
response must never include the hidden solution.

**Errors:** `400 INVALID_ID`, `404 CASE_OR_CLUE_NOT_FOUND`,
`409 CASE_COMPLETED`, `500 INTERNAL_ERROR`.

### 7.5 `POST /api/cases/:id/hints` --- Request a Hint

**Request:**

``` json
{}
```

**Success (`200 OK`):**

``` json
{
  "hint": {
    "index": 1,
    "text": "Pay close attention to the timing of the alibis."
  },
  "progress": {
    "usedHintCount": 1,
    "remainingHints": 2,
    "score": 0
  }
}
```

The score is never negative. Return only the next unused hint, not the
complete hints array.

**Rules:** - Case must be active. - A hint must remain. - Each hint
request consumes exactly one hint. - If the request is retried, avoid
accidental duplicate consumption where practical; use an idempotency key
for robust production behavior.

**Errors:** `404 CASE_NOT_FOUND`, `409 CASE_COMPLETED` or
`NO_HINTS_REMAINING`, `500 INTERNAL_ERROR`.

### 7.6 `POST /api/cases/:id/accuse` --- Submit an Accusation

**Request:**

``` json
{
  "suspectId": "suspect_2"
}
```

**Success (`200 OK`):**

``` json
{
  "result": {
    "correct": false,
    "accusedSuspectId": "suspect_2",
    "culprit": {
      "id": "suspect_1",
      "name": "Mira Vale"
    },
    "score": 0,
    "scoreBreakdown": {
      "correctAccusationPoints": 0,
      "discoveredCluePoints": 5,
      "hintPenalty": 10,
      "finalScore": 0
    },
    "explanation": "The culprit's timeline conflicts with the physical evidence...",
    "supportingClueIds": ["clue_1", "clue_4"]
  }
}
```

This is the first endpoint allowed to reveal the solution, because it is
called when the player submits the accusation. The response should be
persisted as the completed result and reused by subsequent result
requests.

**Rules:** - Require a valid suspect ID belonging to the case. - Only
active cases can be accused. - Score is calculated on the server from
persisted progress. - Correct accusation bonus: Easy 100, Medium 150,
Hard 200. - Clue points: +5 per unique discovered clue. - Hint penalty:
−10 per used hint. - Final score:
`max(0, correctAccusationPoints + cluePoints - hintPenalty)`. -
Incorrect accusation receives no correct-answer bonus. - Lock the case
as completed and persist the accusation, result, and score atomically
where possible. - Duplicate submissions must not create a new result or
change the score. Return the persisted result or `409 CASE_COMPLETED`.

**Errors:** `400 INVALID_SUSPECT`, `404 CASE_NOT_FOUND`,
`409 CASE_COMPLETED`, `500 INTERNAL_ERROR`.

### 7.7 `GET /api/cases/:id/result` --- Retrieve Completed Result

**Success (`200 OK`):** Return the persisted result only when the case
status is `completed`.

**Errors:** `404 CASE_NOT_FOUND`, `409 CASE_NOT_COMPLETED`,
`500 INTERNAL_ERROR`.

The result must be computed and persisted by the backend. Do not
recalculate it from client-supplied values.

### 7.8 Health Endpoint

Recommended: `GET /api/health` returns a minimal service status, for
example `{ "status": "ok" }`. Do not expose secrets, connection strings,
or detailed infrastructure information.

------------------------------------------------------------------------

## 8. Database Design

### 8.1 Mongoose `Case` Model

One document represents one generated mystery and its player progress.

``` js
{
  premise: String,             // trimmed user premise
  title: String,
  story: String,
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"]
  },
  suspects: [{
    id: String,
    name: String,
    description: String,
    alibi: String
  }],
  clues: [{
    id: String,
    title: String,
    teaser: String,
    text: String,              // private until discovered
    discovered: Boolean
  }],
  hints: [String],             // private until each hint is used
  usedHintCount: Number,
  discoveredClueIds: [String],
  solution: {
    culpritId: String,
    explanation: String,
    reasoning: String,
    supportingClueIds: [String]
  },
  accusation: {
    suspectId: String,
    submittedAt: Date
  },
  score: {
    correctAccusationPoints: Number,
    cluePoints: Number,
    hintPenalty: Number,
    finalScore: Number
  },
  status: {
    type: String,
    enum: ["active", "completed"],
    default: "active"
  },
  result: {
    correct: Boolean,
    culpritId: String,
    explanation: String,
    supportingClueIds: [String],
    scoreBreakdown: {
      correctAccusationPoints: Number,
      discoveredCluePoints: Number,
      hintPenalty: Number,
      finalScore: Number
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

This is a conceptual schema; implement timestamps with Mongoose's
`{ timestamps: true }`. Add required constraints, trimming,
minimum/maximum lengths, enum validation, and indexes as appropriate.

### 8.2 Data Integrity

-   Use stable unique IDs for suspects and clues within each case.
-   `solution.culpritId` must match one suspect.
-   `solution.supportingClueIds` must reference valid clues.
-   `discoveredClueIds` must contain no duplicates.
-   `usedHintCount` must be between zero and the configured hint count.
-   The stored final score must equal the server-calculated formula.
-   The status and result must transition from active to completed only
    once.
-   Do not accept client-supplied `solution`, `culpritId`, `score`,
    `discoveredClueIds`, or `usedHintCount` as authoritative input.

### 8.3 Access and Retention

Version 1 may use unguessable MongoDB ObjectIds, but IDs alone do not
provide strong ownership control. If users can access arbitrary case
IDs, add authentication or a separate secure case-access token before
production. Do not expose database documents directly. Consider deleting
old cases after a configurable retention period.

------------------------------------------------------------------------

## 9. Gemini AI Behavior

### 9.1 Generation Requirements

The backend sends Gemini: - The player premise. - The selected
difficulty. - Exact required counts for suspects, clues, and hints. -
Rules for a fair, logically consistent mystery. - A strict JSON output
schema. - Instructions to keep all clues and the explanation consistent
with one culprit.

Do not send API keys or other secrets in prompts. Treat the premise as
untrusted user content; explicitly instruct the model to treat it only
as story material, not as instructions to override system rules.

### 9.2 Required Counts

  Difficulty     Suspects   Clues   Hints   Correct accusation bonus
  ------------ ---------- ------- ------- --------------------------
  Easy                  3       5       2                        100
  Medium                4       7       3                        150
  Hard                  5       9       3                        200

### 9.3 Expected Gemini JSON Format

The model should return one JSON object, with no Markdown fences or
additional prose:

``` json
{
  "title": "The Last Chime",
  "story": "A concise opening narrative that introduces the mystery without revealing the culprit.",
  "suspects": [
    {
      "id": "suspect_1",
      "name": "Mira Vale",
      "description": "A public character description.",
      "alibi": "A plausible but testable account of the relevant time."
    }
  ],
  "clues": [
    {
      "id": "clue_1",
      "title": "The Stopped Clock",
      "teaser": "The clock's position raises a question.",
      "text": "A specific observation that can support or challenge a suspect's account."
    }
  ],
  "hints": [
    "Compare the timeline with the physical evidence."
  ],
  "solution": {
    "culpritId": "suspect_1",
    "explanation": "A concise explanation of how the culprit committed the act.",
    "reasoning": "A step-by-step logical explanation connecting the evidence to the culprit.",
    "supportingClueIds": ["clue_1", "clue_2"]
  }
}
```

Array sizes in the example are illustrative. The actual output must
match the selected difficulty exactly.

### 9.4 Validation Before Saving

Validate the AI output on the server before persistence:

1.  Parse valid JSON; reject unexpected extra text if it cannot be
    safely parsed.
2.  Require every field and verify each field's type and length.
3.  Verify exact suspect, clue, and hint counts for the selected
    difficulty.
4.  Require unique, stable IDs and non-empty names, titles,
    descriptions, alibis, teasers, and clue text.
5.  Verify `culpritId` references an existing suspect.
6.  Verify all supporting clue IDs reference existing clues and are
    unique.
7.  Require enough evidence to justify the culprit and challenge
    plausible alternatives.
8.  Ensure the opening story and public suspect fields do not disclose
    the answer.
9.  Ensure hints are progressively helpful without directly stating the
    culprit.
10. Enforce maximum lengths to limit token use, UI overflow, and storage
    abuse.
11. If validation fails, retry generation a limited number of times (for
    example, up to two retries) with validation feedback. If still
    invalid, return `502 AI_GENERATION_FAILED` and do not save the case.

Use a schema validator such as Zod or Joi. Do not rely solely on the
prompt or Gemini's claimed JSON mode. If the chosen Gemini model
supports structured output/schema constraints, use them in addition to
server-side validation.

### 9.5 Logical Consistency and Fairness

A generated case is acceptable only if: - The culprit is one of the
suspects. - The evidence and timeline do not contradict the solution. -
The solution is inferable from clues rather than requiring unstated
facts. - At least two relevant pieces of evidence support the final
explanation where possible. - Suspect alibis and motives are plausible
and distinguishable. - The explanation accounts for major evidence,
including apparent contradictions. - No clue required to solve the case
is impossible to discover. - The solution does not depend on stereotypes
or arbitrary coincidence.

Structural validation can verify references and counts, but cannot fully
prove narrative logic. Use a second AI critique pass or deterministic
consistency checks where practical, with a bounded retry count. Do not
claim perfect logical verification.

### 9.6 Server-Side Secrecy

-   Store the solution in MongoDB but exclude it from every active-case
    response.
-   Keep unused hints and undiscovered clue text out of active-case
    responses.
-   Use explicit response DTOs/serializers with allowlisted public
    fields; avoid returning raw Mongoose documents.
-   Do not log full prompts, private solutions, API keys, or complete
    database documents in production logs.
-   The frontend must not contain a copy of the solution, even if hidden
    in state or styling.
-   Reveal the solution only after the server accepts the accusation and
    marks the case completed.
-   Treat client requests as untrusted; hiding an element in the UI is
    not security.

------------------------------------------------------------------------

## 10. Scoring Rules

### 10.1 Formula

Let: - `bonus` = difficulty bonus if the accusation is correct,
otherwise 0. - `discoveredClueCount` = number of unique clue IDs
recorded by the server. - `usedHintCount` = number of hints recorded by
the server.

Then:

``` text
cluePoints = discoveredClueCount * 5
hintPenalty = usedHintCount * 10
finalScore = max(0, bonus + cluePoints - hintPenalty)
```

  Event                                        Score impact
  ------------------------------- -------------------------
  Correct accusation --- Easy                          +100
  Correct accusation --- Medium                        +150
  Correct accusation --- Hard                          +200
  Each unique discovered clue                            +5
  Each hint used                                        −10
  Incorrect accusation              +0 correct-answer bonus
  Minimum final score                                     0

### 10.2 Calculation Examples

-   Easy, correct, 4 clues, 1 hint: `max(0, 100 + 20 - 10) = 110`.
-   Medium, incorrect, 5 clues, 2 hints: `max(0, 0 + 25 - 20) = 5`.
-   Hard, correct, 2 clues, 3 hints: `max(0, 200 + 10 - 30) = 180`.

### 10.3 Scoring Integrity

-   Calculate all score values on the backend from persisted case state.
-   Never trust score values or progress counts sent by the browser.
-   Award clue points once per unique clue.
-   Consume a hint and apply its penalty once per accepted hint request.
-   Persist the final score and breakdown at accusation time.
-   Return the same stored result for subsequent result retrieval.
-   Use an atomic update or transaction where available to prevent
    concurrent duplicate actions from double-counting.

------------------------------------------------------------------------

## 11. Validation, Security, and Error Handling

### 11.1 General Security

-   Keep Gemini credentials on the server.
-   Use environment variables and secret management in deployment.
-   Configure CORS with an allowlist.
-   Add rate limiting, especially to case generation and hint endpoints.
-   Limit JSON request body size and premise length.
-   Validate and normalize every path parameter and request body.
-   Use Helmet or equivalent secure HTTP headers.
-   Avoid exposing stack traces or provider error details.
-   Use HTTPS in production.
-   Avoid logging sensitive prompt content and private solution data.
-   Apply dependency updates and remove unused packages.

### 11.2 Abuse and Cost Controls

-   Limit case-generation frequency per IP or authenticated user.
-   Set a Gemini request timeout and bounded retries.
-   Do not automatically regenerate a case on every page refresh.
-   Consider a maximum number of active cases per user/session.
-   Return a clear rate-limit response and allow retry after a suitable
    delay.

### 11.3 Error Codes

  HTTP status   Code                       Meaning
  ------------- -------------------------- -------------------------------------------
  400           `VALIDATION_ERROR`         Invalid premise, difficulty, or ID format
  404           `CASE_NOT_FOUND`           Case does not exist
  404           `CLUE_NOT_FOUND`           Clue does not belong to the case
  409           `CASE_COMPLETED`           Case can no longer be changed
  409           `NO_HINTS_REMAINING`       No unused hints remain
  409           `CASE_NOT_COMPLETED`       Result requested too early
  429           `RATE_LIMITED`             Request limit exceeded
  502           `AI_GENERATION_FAILED`     AI output invalid after retries
  503           `AI_SERVICE_UNAVAILABLE`   Provider unavailable
  500           `INTERNAL_ERROR`           Unexpected server failure

The frontend should map these to plain-language messages, preserve safe
user input where possible, and provide a retry action when appropriate.

------------------------------------------------------------------------

## 12. Testing Strategy

### 12.1 Backend Unit Tests

-   Premise and difficulty validation.
-   Difficulty-to-count mapping.
-   Gemini JSON parsing and schema validation.
-   Invalid suspect and clue references.
-   Scoring formula for correct and incorrect accusations.
-   Minimum score never falls below zero.
-   Duplicate clue discovery awards points once.
-   Hint limit and duplicate action handling.
-   Result access blocked before completion.
-   Active-case serializers exclude solution, unused hints, and
    undiscovered clue text.

### 12.2 API Integration Tests

-   Generate one valid case at each difficulty.
-   Retrieve an active case without leaking private data.
-   Discover a clue and verify progress/score.
-   Request hints until exhausted and verify penalty.
-   Submit correct and incorrect accusations.
-   Verify result persistence and repeated result retrieval.
-   Reject a second accusation after completion.
-   Handle Gemini failure, malformed output, MongoDB failure, and rate
    limiting.

Mock Gemini in automated tests to keep tests deterministic and avoid API
costs. Add a small manual smoke test against the real provider.

### 12.3 Frontend Tests and Manual QA

-   Home navigation works.
-   Premise and difficulty validation is clear.
-   Loading and error states are visible.
-   Investigation progress updates from server responses.
-   Discovered clues and used hints render correctly.
-   Accusation cannot be submitted without selecting a suspect.
-   Results display the backend's verdict and score.
-   Refreshing an active case restores server state.
-   Mobile and desktop layouts remain usable.
-   Keyboard navigation and focus indicators work.

------------------------------------------------------------------------

## 13. Deployment and Operations

### 13.1 Deployment Shape

-   Deploy the React/Vite frontend to a static hosting provider.
-   Deploy the Express API to a Node-compatible hosting provider.
-   Use a managed MongoDB deployment for production.
-   Configure frontend API base URL through a public frontend
    environment variable such as `VITE_API_BASE_URL`.
-   Configure `GEMINI_API_KEY`, `MONGODB_URI`, `CLIENT_ORIGIN`, and
    other secrets only on the backend host.
-   Ensure CORS matches the actual frontend domain.
-   Run a production build and verify all API URLs use HTTPS.

### 13.2 Release Checklist

-   [ ] Production frontend build succeeds.
-   [ ] Backend starts with production environment variables.
-   [ ] MongoDB connection succeeds.
-   [ ] Gemini API call succeeds using server-side credentials.
-   [ ] All three difficulties generate exact counts.
-   [ ] Active responses do not reveal private solution data.
-   [ ] Clue and hint actions persist after refresh.
-   [ ] Score is calculated on the backend.
-   [ ] Completed result persists and can be retrieved.
-   [ ] CORS and rate limiting are configured.
-   [ ] `.env` and secrets are excluded from Git.
-   [ ] Deployed website works on mobile and desktop.

------------------------------------------------------------------------

## 14. Acceptance Criteria

The project is complete when all of the following are true:

1.  Users can generate mysteries with Easy, Medium, and Hard difficulty.
2.  Each difficulty produces exactly the required number of suspects,
    clues, and hints.
3.  Generated output is validated before it is stored.
4.  The player can view the story and public suspect details.
5.  Undiscovered clue text remains hidden until that clue is discovered.
6.  The player can discover clues and progress is saved.
7.  The player can request hints until the configured limit is reached.
8.  Each unique clue awards +5 points only once.
9.  Each used hint applies a −10 penalty only once.
10. Correct accusation bonuses match the difficulty table.
11. The score cannot be negative and is calculated only by the backend.
12. A player can accuse a suspect belonging to the case.
13. An accepted accusation completes and locks the case.
14. The culprit and solution are not present in active-case API
    responses or frontend bundles/state.
15. The result endpoint does not reveal the solution before case
    completion.
16. The results view displays the correct verdict, culprit, explanation,
    and score breakdown.
17. Invalid inputs, AI failures, rate limits, and missing cases produce
    useful error states.
18. The UI is responsive and usable with keyboard navigation.
19. The deployed frontend and backend work together with production
    environment variables.
20. No API keys or private solution data are committed to the repository
    or exposed to the browser.

------------------------------------------------------------------------

## 15. Final Deliverables

1.  `SPEC.md` --- this project blueprint.
2.  Complete React/Vite/Tailwind frontend.
3.  Complete Node.js/Express backend.
4.  Mongoose case model and MongoDB integration.
5.  Gemini integration with schema validation and bounded retries.
6.  Server-side clue, hint, accusation, result, and scoring logic.
7.  `.env.example` with placeholders only.
8.  `README.md` with setup, scripts, environment variables, testing, and
    deployment instructions.
9.  Automated tests for core validation, secrecy, API behavior, and
    scoring.
10. Deployed website and API endpoint, with setup notes for the chosen
    hosting providers.

------------------------------------------------------------------------

## 16. Implementation Order

Implement in this order to reduce rework:

1.  Initialize repository, frontend, backend, environment configuration,
    and health route.
2.  Define the Mongoose schema and public response serializers.
3.  Implement deterministic scoring and validation helpers with tests.
4.  Implement Gemini generation, output validation, and retry handling.
5.  Implement case creation and retrieval with solution secrecy.
6.  Implement clue discovery and hint consumption.
7.  Implement accusation, result persistence, and result retrieval.
8.  Build the Home and Create Mystery pages.
9.  Build the Investigation Room, accusation UI, and Results page.
10. Add loading/error states, responsive styling, accessibility, and
    tests.
11. Deploy frontend, backend, and database; run the release checklist.

**Implementation rule:** Build the backend security and scoring rules
before polishing the UI. The browser is an untrusted client; the server
and database are the source of truth.
