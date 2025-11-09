# Needs Connect

Software Engineering Competition prototype that links community helpers with a coalition of food/shelter services and neighborhood-beautification teams.

## 🚀 Quick Start

**For detailed setup instructions, see [SETUP.md](./SETUP.md)**

### Prerequisites
- Node.js 18+ and npm 9+
- 3 terminal windows

### Setup Steps

1. **Install Dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Create Environment File**
   Create `backend/.env` with:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=needs_connect
   PORT=5000
   ```
   
   **Verify setup** (optional): `cd backend && npm run verify`

3. **Start Database** (Terminal 1)
   ```bash
   cd backend
   npm run db:start
   ```

4. **Initialize Database** (Terminal 2)
   ```bash
   cd backend
   node setup-db.js
   npm run seed  # Optional: adds sample data
   npm start     # Start backend server
   ```

5. **Start Frontend** (Terminal 3)
   ```bash
   cd frontend
   npm run dev
   ```

6. **Open Browser**: http://localhost:3000

**Login as manager**: Use username `admin`

> 💡 **Having issues?** Check [SETUP.md](./SETUP.md) for detailed troubleshooting guide.

## High-Impact Features

### Priority & Time-Sensitive Needs Management (Required 10%)
- Every need tracks `needed_by`, perishable flag, bundle tag, and a computed urgency score.
- Helpers and managers can sort/filter by urgency, expiration windows, most-requested items, or bundled kits (food boxes, hygiene kits, winter clothing, cleaning supplies).
- Dashboards highlight critical, perishable, and volunteer-service needs so teams can respond before deadlines.

### Volunteer Dispatch & Distribution Workflow (Custom 10%)
- Managers schedule delivery, kit-build, cleanup, or distribution events per need with location, time window, capacity, and notes.
- Helpers browse `Volunteer` opportunities, view remaining slots, sign up, or cancel; waitlists are handled automatically when events hit capacity.
- Manager view shows all upcoming events and slot utilization in one place so they can coordinate both goods and staffing.

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
- **Backend:** Node.js 18+, Express 5, mysql2 (promise pool), bundled MariaDB for local development.
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Shadcn UI components.
- **Database:** MariaDB (bundled) or MySQL 5.7+
- **Tooling:** Nodemon for backend dev, adm-zip for unpacking local database bundle.

## System Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **RAM**: 4GB minimum (8GB recommended)
- **OS**: Windows 10+, macOS 10.15+, or Linux

## Testing Checklist
- Create both perishable and non-perishable needs; confirm urgency ordering and badges in Browse + Manager dashboards.
- Schedule events of different types and sign up/cancel as a helper; verify confirmed/waitlist state updates.
- Use bundle filters (Basic Food Box, Hygiene Kit, Beautification) on both helper and manager screens to ensure grouping works.

## Documentation
- **[SETUP.md](./SETUP.md)**: Detailed setup instructions and troubleshooting guide
- **[QUICK_START.md](./QUICK_START.md)**: One-page quick reference checklist
- **[backend/ENV_SETUP.md](./backend/ENV_SETUP.md)**: Environment variables configuration guide
- **[COMPETITION_README.md](./COMPETITION_README.md)**: Competition submission notes and improvements

## Credits
- Designed for the RIT Needs Connect challenge – empowers food banks & beautification teams with shared prioritization workflows.
