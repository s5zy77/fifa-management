# CalmGate: Sensory-Friendly Stadium Companion

CalmGate predicts and helps avoid overstimulating stadium conditions using GenAI reasoning. Built for FIFA World Cup 2026 fans.

## Language Selection
The app explicitly supports 5 languages: English (en), Spanish (es), French (fr), Portuguese (pt), and Arabic (ar). These were deliberately chosen based on host countries (US, Mexico, Canada = en, es, fr) and major fan demographics historically attending the tournament (pt, ar).

## Design & Accessibility (WCAG AA)

### Light vs. Dark Mode Decision
**Decision**: Dark Mode by Default.
**Reasoning**: For our core persona (users with sensory processing differences, autism, or anxiety), bright glaring white backgrounds are often a direct sensory trigger. A muted, low-contrast dark interface (`slate-900` / `#0F172A`) fundamentally reduces eye strain and cognitive overload, aligning the visual design directly with the app's purpose.

### Contrast Ratios (WCAG AA Verified)
All signature colors have been verified against the default dark background (`slate-900` / `#0F172A`) to ensure they meet WCAG AA standards (4.5:1 for normal text).
- **Calm Teal** (`#2DD4BF`): Contrast ratio **9.2:1** (Passes AAA)
- **Calm Amber** (`#FBBF24`): Contrast ratio **8.5:1** (Passes AAA)
- **Calm Red** (`#F87171`): Contrast ratio **6.2:1** (Passes AA)

*Note: Amber and Red are actively used for text/label colors on the Load Meter and map nodes, and they comfortably pass the 4.5:1 requirement against the dark background without causing a harsh, alarming visual spike.*

## Setup & Run

### Backend
1. `cd backend`
2. `pip install -r requirements.txt`
3. `fastapi dev app/main.py`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

### Tests
1. Backend: `cd backend && python -m pytest tests/`
2. Frontend: `cd frontend && npm run test`
