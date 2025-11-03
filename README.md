# Needs Connect

Software Engineering Competition prototype that links community helpers with a coalition of food/shelter services and neighborhood-beautification teams.

## High-Impact Features

### Priority & Time-Sensitive Needs Management (Required 10%)
- Every need tracks `needed_by`, perishable flag, bundle tag, and a computed urgency score.
- Helpers and managers can sort/filter by urgency, expiration windows, most-requested items, or bundled kits (food boxes, hygiene kits, winter clothing, cleaning supplies).
- Dashboards highlight critical, perishable, and volunteer-service needs so teams can respond before deadlines.

### Volunteer Dispatch & Distribution Workflow (Custom 10%)
- Managers schedule delivery, kit-build, cleanup, or distribution events per need with location, time window, capacity, and notes.
- Helpers browse `Volunteer` opportunities, view remaining slots, sign up, or cancel; waitlists are handled automatically when events hit capacity.
- Manager view shows all upcoming events and slot utilization in one place so they can coordinate both goods and staffing.

## Running the Stack

```bash
# Backend (Express + MariaDB bundle)
cd backend
npm run db:start     # first terminal – boots bundled MariaDB
npm start            # second terminal – starts API on http://localhost:5000

# Frontend (React)
cd ../frontend
npm start            # runs on http://localhost:3000
```

If you have a local MySQL server instead of the bundled instance, set `DB_HOST`, `DB_USER`, and `DB_PASSWORD` in `backend/.env` and run `backend/database/schema.sql` manually.

## User Walkthrough

1. **Manager Login** (use username `admin` to get manager rights)
2. Visit `Manager` → create or edit needs with deadlines, perishable flag, bundle tags, or volunteer requirements.
3. `Manage Events` lets managers schedule volunteer shifts tied to specific needs and review upcoming commitments.
4. Helpers see prioritized needs under `Browse` (sorted by urgency score) and can drill into bundles (food, clothing, hygiene, beautification).
5. `Volunteer` tab lists scheduled events, remaining slots, and status (confirmed/waitlist/cancelled) for the signed-in helper.

## API Highlights
- `GET /api/needs?sort=urgency&timeSensitiveOnly=true` – urgency-sorted queue with remaining quantity and computed score.
- `GET /api/needs/bundle/basic_food` – bundle kits for quick food-box fulfillment.
- `GET /api/events/upcoming?userId=123` – volunteer feed with per-user signup status.
- `POST /api/events` + `POST /api/events/:id/signup` – manager scheduling and helper signups.

## Tech Stack
- **Backend:** Node.js, Express 5, mysql2 (promise pool), bundled MariaDB for local development.
- **Frontend:** React 19 (CRA), Tailwind-style utility classes, context-based auth.
- **Tooling:** Nodemon for backend dev, adm-zip for unpacking local database bundle.

## Testing Checklist
- Create both perishable and non-perishable needs; confirm urgency ordering and badges in Browse + Manager dashboards.
- Schedule events of different types and sign up/cancel as a helper; verify confirmed/waitlist state updates.
- Use bundle filters (Basic Food Box, Hygiene Kit, Beautification) on both helper and manager screens to ensure grouping works.

## Credits
- Designed for the RIT Needs Connect challenge – empowers food banks & beautification teams with shared prioritization workflows.
