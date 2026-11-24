# Finance

A personal finance tracker for iPhone. It's free, with no ads and no subscriptions. It runs as an offline-first PWA: every write goes to the device first, and the backend is used only for sync and backup.

> **Status:** early development. Quick entry, the daily limit, categories, frozen money and the week view work offline in the app; the rest is planned. Work is tracked as OpenSpec changes (see [Roadmap](#roadmap)).

## Features

Done:
- Add an expense in 2 steps: type the amount, tap a category, and it's saved (the date defaults to today in Kyiv time; you can pick a past day)
- Today's expenses with a day total (the 3 newest on the home screen, with Show all); tap one to edit it, or delete it with Undo
- Categories: five to start with (Food, Transport, Health, Shopping, Fun); add, rename and remove them in Settings, and removing one moves its records to another category or to "Other"
- Frozen categories set money aside: it is left out of the daily limit until you return it in Settings; a "Show frozen" switch shows or hides it
- Week strip on the home screen: 7 days coloured by spending (green within the limit, red over it), arrows to switch weeks; tap a day to show and edit its records in the main list (the add button then adds to that day)
- Home screen with your balance and how much is left for today (green, yellow at 80 % of the daily limit, red when over)
- Settings: current balance, monthly income and payday, typed on a keypad with + − × ÷ = so you can add up several accounts; new expenses come off the balance and income is added on payday
- Works fully offline; data is stored on the device (IndexedDB)

> On iPhone, use **Share → Add to Home Screen**. Safari can clear the data of websites you haven't opened for a while, and an installed app is kept safer. Backend sync (planned) will be the real backup.

Planned:
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
- Dexie.js (IndexedDB) for local storage
- ngx-echarts for charts, SheetJS for Excel export *(planned)*
- Vitest for tests (with `fake-indexeddb` for database tests)

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
npm test -- --watch=false   # unit tests (Vitest), single run
npm run build               # production build in frontend/dist
```

The service worker (offline mode) only runs in a production build. To try it locally:

```powershell
npm run build
npx http-server dist/frontend/browser -p 8080 -c-1
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

1. `add-quick-expense-entry` ✅ implemented, awaiting review and archive
2. `add-daily-limit` ✅ implemented, awaiting review and archive
3. `add-category-management`, `add-frozen-amounts`, `add-week-overview` ✅ implemented, awaiting review and archive
4. `add-statistics`
5. `add-export`
6. Deploy to Static Web Apps and test on iPhone
7. `add-backend-sync`
