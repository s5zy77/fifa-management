# 🧭 CalmGate
### A GenAI-powered sensory-accessibility companion for FIFA World Cup 2026

> *"Stadiums are built for crowds. CalmGate is built for the fan the crowd forgets."*

Every stadium in the world is optimized for one thing: throughput. Get people in, get people to their seats, get people out. Almost none of them are optimized for the fan who *wants* to be there but can't predict whether the walk from Gate 5 to Section C is going to be a 4-minute stroll or a sensory overload event.

CalmGate is a real-time, GenAI-reasoned companion that plans, monitors, and re-routes a fan's stadium visit based on their personal sensory profile — noise, light, crowd density, and unpredictable movement — not a generic accessibility checklist.

---

## Table of Contents

- [The Problem](#the-problem)
- [The Persona](#the-persona)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [What's Actually GenAI vs. Deterministic](#whats-actually-genai-vs-deterministic)
- [Tech Stack](#tech-stack)
- [Design System](#design-system)
- [Getting Started](#getting-started)
- [Uploading Your Own Data](#uploading-your-own-data)
- [Testing](#testing)
- [Scalability — Beyond the Stadium](#scalability--beyond-the-stadium)
- [Assumptions](#assumptions)
- [Known Limitations](#known-limitations)
- [What I'd Build Next](#what-id-build-next)

---

## The Problem

Sensory sensitivity isn't rare. Autistic fans, people with anxiety disorders, PTSD, ADHD, sensory processing differences, and even neurotypical fans who are simply overstimulated by 80,000 screaming voices — all of them face the same silent barrier: **unpredictability**.

Most stadiums have *responded* to this with static accommodations — a sensory room here, a pair of noise-cancelling headphones at guest services there. What's missing is **prediction**. Nobody tells a fan, in advance and in real time: *"the concourse near your gate is about to spike — here's a route that avoids it."*

That's the gap CalmGate closes.

## The Persona

**A fan who wants to attend the match but is worried they won't be able to handle it.**

Not someone who needs a wheelchair ramp. Someone who needs to know, before they leave the house, which gate to use — and who needs the plan to adapt in real time when a goal celebration turns Section D into a wall of noise.

## How It Works

CalmGate scores every zone in the stadium — gates, concourses, seating blocks, restrooms, food courts — with a live **Sensory Load Score**, built from three signals:

| Signal | What it captures |
|---|---|
| 🔊 Noise | Decibel estimate |
| 💡 Light | Lighting changes, screen density, motion |
| 👥 Crowd | People per square meter |

That score means nothing on its own. What makes CalmGate *smart* is that it never shows the fan a raw number — it reasons over that number **against their personal sensitivity profile**, using an LLM, to produce an actual plan with actual tradeoffs explained in plain language:

> *"Gate 3 is 4 minutes faster, but the LED tunnel entrance is a light trigger for you. Gate 5 avoids both your triggers."*

That sentence is not a template. It's generated live, per fan, per moment, by the reasoning engine — because two fans with different profiles standing in the same spot at the same time should get different advice.

### The Four Moments CalmGate Reasons About

1. **Before arrival** — a personalized visit plan: best arrival window, best gate, nearest reset zone
2. **In real time** — when a zone crosses *this fan's* threshold, an AI-reasoned reroute, not a generic alert
3. **When they need to step away** — the nearest quiet zone, factoring in whether the *path there* is itself calm
4. **In their language** — full profile intake and AI responses in 5 languages, because sensory needs and language barriers compound at an international tournament

## Architecture

```
CalmGate/
├─ backend/                    FastAPI service
│   ├─ app/
│   │   ├─ models/             Pydantic/SQLModel schemas
│   │   ├─ routes/             profile, plan, reroute, quiet-zone, upload, live-signals
│   │   ├─ services/
│   │   │   ├─ dataset.py      DatasetStore — in-memory, swappable at runtime
│   │   │   └─ llm.py          LLM wrapper, strict JSON output, temp=0.2
│   │   └─ database.py         SQLite (profiles persist across restarts)
│   └─ tests/
│
├─ frontend/                   React + Tailwind + Vite
│   ├─ src/
│   │   ├─ components/
│   │   │   ├─ LoadMeter.jsx       radial gauge, live sensory-load visualization
│   │   │   ├─ StadiumMap.jsx      SVG map, coordinate-driven, route highlighting
│   │   │   ├─ ProfileWizard.jsx   sensory intake
│   │   │   ├─ PlanDisplay.jsx     AI plan + reasoning explanation
│   │   │   ├─ RealTimeAlert.jsx   polls live signals, triggers reroute
│   │   │   └─ UploadDataset.jsx   evaluator dataset upload
│   │   └─ i18n/                   5-language support
│   └─ tests/
│
└─ data/                       synthetic_zones.json, synthetic_signals.json,
                                match_config.json, upload_template.json
```

### Why `DatasetStore` matters

Every reasoning endpoint reads zone, signal, and match data from a single in-memory `DatasetStore` — never from files directly. This is the architectural decision that makes the **evaluator upload feature** work without a server restart: uploading a new dataset simply overwrites what `DatasetStore` holds, and every downstream AI call sees it immediately.

## What's Actually GenAI vs. Deterministic

Because "no hardcoded logic pretending to be AI" was a hard requirement, here's the explicit breakdown — every reasoning decision below is a live LLM call with the prompt visible in code, not a lookup table:

| Task | Layer |
|---|---|
| Fetching zones, signals, match data | Deterministic |
| Storing/retrieving a fan's profile | Deterministic |
| Validating an uploaded dataset | Deterministic |
| **Choosing best arrival window + gate + reset zone** | 🤖 GenAI |
| **Reasoning about route tradeoffs** ("faster but triggers X") | 🤖 GenAI |
| **Real-time reroute decision on a sensory spike** | 🤖 GenAI |
| **Quiet-zone matching, including path-to-zone reasoning** | 🤖 GenAI |
| **Multilingual understanding + response generation** | 🤖 GenAI |
| **Surfacing conflicting sensory needs honestly** | 🤖 GenAI |
| Rendering the UI, drawing the map | Deterministic |

## Tech Stack

**Backend:** FastAPI · SQLModel/SQLite · OpenAI-compatible client (provider-agnostic — swap via `.env`) · Pydantic for strict schema validation

**Frontend:** React · Vite · Tailwind CSS · react-router-dom · i18next · Vitest + React Testing Library

**AI:** All reasoning calls run at `temperature=0.2` with enforced strict JSON output, so demo results are consistent and deterministically parseable — not a different answer on every refresh.

## Design System

CalmGate's own UI follows the same sensory principles it's built to protect:

- **No autoplay motion, no flashing.** Full `prefers-reduced-motion` compliance throughout.
- **Light Default / Dark Toggle.** The app defaults to the calm "Soft Stone" light palette (`#F8FAFC`). Because bright white backgrounds can sometimes be a direct sensory trigger, a user-selectable Dark Mode toggle (`#0F172A`) is fully supported and persisted.
- **The Sensory Load Scale** is the app's visual signature — a calm teal → warm amber → muted red gradient used consistently across the `LoadMeter` and `StadiumMap` components.
- **WCAG-AA verified**, not assumed. Every text/background pairing was checked against a 4.5:1 (normal text) / 3.0:1 (large text/UI) contrast ratio before the palette was finalized. Both Light and Dark themes pass WCAG AA.
- **The Stadium Map isn't decoration.** Zones are plotted from real `{x, y}` coordinates, colored live from real signal data, and the AI's recommended route draws itself onto the map — because showing an AI's reasoning is more convincing than describing it.

## Getting Started

```bash
# Backend
cd backend
cp .env.example .env        # add your OPENAI_API_KEY / OPENAI_BASE_URL
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` → complete the sensory profile → view your AI-generated plan.

## Uploading Your Own Data

CalmGate ships with synthetic zone, signal, and match data — but it's built to accept real data at runtime, no redeploy required.

1. Go to the **Upload Data** panel on the dashboard
2. Upload a `.json` file matching the schema in `data/upload_template.json`
3. Malformed files are rejected with a specific, actionable error message
4. Once accepted, every AI reasoning call immediately uses your data

## Testing

```bash
# Backend
pytest backend/tests/           # profile persistence, mocked-LLM reasoning,
                                 # end-to-end endpoint tests incl. graceful
                                 # degradation on LLM timeout/malformed output

# Frontend
npm run test                    # ProfileWizard capture/submit,
                                 # UploadDataset error-state rendering
```

## Scalability — Beyond the Stadium

The core of CalmGate isn't stadium-specific — it's a **general sensory-load reasoning engine**: score an environment across noise/light/crowd, match it against a personal profile, reason about tradeoffs, explain the reasoning in plain language. The stadium is one deployment surface. The same engine, unchanged, applies to:

- **Airports** — gate-to-gate routing around a sensory-overloaded terminal
- **Concerts & festivals** — the exact same crowd/noise/light problem, higher stakes
- **Hospitals** — reasoning support for autistic patients navigating a triggering environment
- **Transit hubs** — rush-hour rerouting for sensory-sensitive commuters

Swapping `data/*.json` for a different venue's zone graph is the only change required.

## Assumptions

- Live sensory data (noise/light/crowd) is synthetic, structured to mirror what IoT sensors or crowd-density APIs would realistically provide
- A single fan profile is assumed per session (no household/group profiles)
- English is the fallback language if detection is ambiguous

## Known Limitations

- No real IoT sensor integration — this is a reasoning and UX proof of concept, not a hardware deployment
- Quiet-zone capacity isn't modeled (a "safe" zone could theoretically fill up)
- Multilingual support covers 5 languages, not the full range spoken by a global fanbase
- **JWT Storage**: The JSON Web Token (JWT) is currently stored in `localStorage` rather than an `httpOnly` cookie. This was a deliberate tradeoff for the PromptWars hackathon timeline to avoid CORS complexity in a Vercel/Render decoupled deployment, but it does expose the token to potential XSS vulnerabilities. In a production environment, this should be migrated to `httpOnly` cookies.

## What I'd Build Next

- Real sensor/crowd-API integration to replace synthetic signals
- Group/family profile support with conflict resolution across multiple fans
- Push notifications for proactive rerouting before the fan even opens the app

---

*Built for PromptWars Virtual — Challenge 4: Smart Stadiums & Tournament Operations.*
