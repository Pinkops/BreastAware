# BreastAware — Private Breast-Health Organizer

A private, personal breast-health organizer for adults. Know your normal. Notice changes. Keep a record.

**Live:** https://breastaware101.vercel.app
**Privacy:** https://breastaware101.vercel.app/privacy

> **Not a medical device.** BreastAware does not diagnose, detect cancer, calculate risk scores, or replace mammograms, clinical exams, imaging, or professional medical advice. If you notice a new or changing breast concern, contact a healthcare professional promptly.

## Features

- **Know My Normal** — describe your personal baseline (look, feel, texture, cycle-related changes)
- **Log a Change** — structured capture (type, side, location, pain, duration, notes) with non-diagnostic language
- **Body Map** — approximate marker placement for personal documentation only
- **Journal** — chronological timeline of observations, screenings, appointments
- **Screening & Risk** — organize screening history, appointments, and self-noted history topics (no scores generated)
- **Doctor Prep** — collect questions and history details for visits
- **Health Summary** — printable conversation sheet (disclaimer: conversation support only)
- **Health Vault** — private document storage with short-lived signed links (10-min expiry)
- **Education Center** — 8 plain-language topics sourced from CDC, NCI, ACS, USPSTF, MedlinePlus, OWH, HHS, FTC
- **Settings & Privacy** — export all data (JSON), delete all data & account, profile preferences
- **Privacy Policy** — public route `/privacy`, linked from login and settings

## Safety & Clinical Posture

- No diagnosis, no cancer detection, no risk scoring — ever
- Every page carries a disclaimer; Health Summary marked "conversation support only"
- Symptom list matches CDC "Symptoms of Breast Cancer" (verified 2026-09-19)
- Self-awareness framing matches CDC: "clinical breast exam or breast self-exam has not been found to lower the risk of dying" — app avoids promising mortality benefit
- Education citations re-verified live 2026-09-19: 1 dead CDC Hear Her link replaced with NCI Questions to Ask Your Doctor, 2 moved NCI URLs updated to canonical paths
- All 8 articles versioned (`version=2`, `reviewed_at=2026-09-19`)

## Tech Stack

- **Frontend:** React 19 + TypeScript 5.9 (strict), Vite 7, Tailwind CSS 4, react-router-dom 7.18.4, lucide-react
- **Backend:** Vercel serverless — single `api/[resource].js` router + 14 underscore-prefixed modules (Hobby 12-function limit workaround)
- **DB/Auth/Storage:** Supabase (Postgres + Auth + private bucket `ba-vault` with signed URLs)
- **PWA:** Hand-written `public/sw.js` (network-first nav, cache-first assets, `/api/*` never cached), `manifest.webmanifest`

## Architecture
