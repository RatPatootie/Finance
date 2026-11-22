# Finance

A personal finance tracker for iPhone. It's free, with no ads and no subscriptions. It runs as an offline-first PWA: every write goes to the device first, and the backend is used only for sync and backup.

> **Status:** early scaffold. The Angular app and the .NET API have been generated, but none of the features below are built yet. Work is tracked as OpenSpec changes (see [Roadmap](#roadmap)).

## Features (planned)

- Current balance and spending at a glance
- Add an expense in 2–3 taps: amount → category → saved (date defaults to today)
- Daily spending limit
- Frozen amounts that are left out of the daily budget, which you can show or hide
- Statistics: how much you can still spend this month, whether you're on track, a forecast, and a category filter
- Export to Excel or JSON

## How the numbers work

| Value | Formula |
|---|---|
| Free money | balance − frozen amounts |
| Daily limit | free money ÷ days left in the month (including today) |
| Left for today | daily limit − spent today |
| Forecast | average daily spend over the last 7 days × days left |
| Status | green / yellow / red |

- Money is stored as integer **kopecks** on the client and as `decimal` on the backend.
- Day boundaries use the **Europe/Kyiv** time zone.

## Tech stack

**Frontend:** [`frontend/`](frontend/)
- Angular 22 PWA (standalone components, signals) with a service worker
- Angular Material (Azure/Blue palette)
- Dexie.js (IndexedDB) for local storage *(planned)*
- ngx-echarts for charts, SheetJS for Excel export *(planned)*
- Vitest for tests

**Backend:** [`backend/`](backend/)
- .NET 10 Minimal API (`FinanceApp.Api`)
- EF Core with migrations and `EnableRetryOnFailure()` *(planned)*
- Azure App Service Easy Auth, single user *(planned)*

**Sync model** *(planned)*: the client generates Guid ids, and each record has `UpdatedAt` and `IsDeleted`. The last write wins.

## Repository layout

```
openspec/            specs and change proposals (OpenSpec)
frontend/            Angular PWA
backend/             .NET 10 Minimal API
.github/workflows/   CI/CD (planned)
```

## Getting started

Requirements: Node.js with npm 11, and the .NET 10 SDK.

**Frontend:**

```powershell
cd frontend
npm install
npm start          # http://localhost:4200
```

```powershell
npm test           # unit tests (Vitest)
npm run build      # production build in frontend/dist
```

**Backend:**

```powershell
cd backend
dotnet run         # http://localhost:5286
```

## Hosting (target: $0/month on Azure)

| Part | Service |
|---|---|
| Frontend | Azure Static Web Apps (Free) |
| Backend | App Service F1 (60 CPU-min/day, 5–20 s cold start), or Container Apps with an image in GHCR |
| Database | Azure SQL free offer (100,000 vCore-s/month, 32 GB, auto-pause, about 1 min to wake) |
| Guardrail | $1 budget alert in Cost Management |

CI/CD runs on GitHub Actions, with `paths:` filters so that frontend and backend deploy separately.

## Roadmap

Features are built one OpenSpec change at a time (`/opsx:explore` → `/opsx:propose` → `/opsx:apply` → `/opsx:archive`):

1. `add-quick-expense-entry`
2. `add-daily-limit`
3. `add-frozen-amounts`
4. `add-statistics`
5. `add-export`
6. Deploy to Static Web Apps and test on iPhone
7. `add-backend-sync`
