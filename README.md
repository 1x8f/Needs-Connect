# Needs Connect

Software Engineering Competition prototype that links community helpers with a coalition of food/shelter services and neighborhood-beautification teams.

## 🚀 Quick Start

### Prerequisites
- [ ] npm 9+ installed (`npm --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] 3 terminal windows ready

### Setup Steps

#### Step 1: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

#### Step 2: Create Environment File

Create `backend/.env` with:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=needs_connect
PORT=5000
```

**Note**: These are the default values for the bundled MariaDB. If you have your own MySQL server, update the values accordingly.

#### Step 3: Verify Setup (Optional)

```bash
cd backend
npm run verify
```

This checks that all dependencies are installed and environment variables are configured correctly.

#### Step 4: Start Database (Terminal 1)

```bash
cd backend
npm run db:start
```

**What to expect:**
- First run: You'll see "Extracting bundled MySQL..." - this takes 1-2 minutes
- After extraction: "Starting bundled MySQL server..."
- Leave this terminal open - the database must stay running
- Wait for "MySQL server started" message before proceeding

**Troubleshooting:**
- If you see port conflicts, make sure port 3306 is not in use
- On Windows: If you get permission errors, run terminal as Administrator
- Check Windows Firewall isn't blocking the connection

#### Step 5: Initialize Database (Terminal 2)

Open **Terminal 2** (keep Terminal 1 running) and run:

```bash
cd backend
node setup-db.js
```

**What to expect:**
- "Connected to MySQL server"
- "Database 'needs_connect' created or already exists"
- "Executed statement X successfully" (multiple statements)
- "Database setup complete!"

**Troubleshooting:**
- If you get connection errors, make sure Terminal 1 (database) is still running
- Wait a few seconds after starting the database before running setup-db.js

#### Step 6: Seed Sample Data (Optional)

Still in **Terminal 2**:

```bash
npm run seed
```

This populates the database with sample needs, users, and events for testing.

#### Step 7: Start Backend Server

Still in **Terminal 2**:

```bash
npm start
```

**What to expect:**
- "Database pool created successfully"
- "Server is running on port 5000"

**Troubleshooting:**
- If port 5000 is in use, change `PORT=5001` in `backend/.env` and restart
- If you see database connection errors, check that Terminal 1 (database) is running
- Wait 10-15 seconds after starting database before starting backend

#### Step 8: Start Frontend (Terminal 3)

Open **Terminal 3**:

```bash
cd frontend
npm run dev
```

**What to expect:**
- Vite dev server starting
- "Local: http://localhost:3000"
- Browser may automatically open

#### Step 9: Access the Application

Open your browser and go to: **http://localhost:3000**

- **Login**: Use username `admin` for manager access
- **Helper**: Any username (defaults to helper role)

### Useful URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Test endpoint: http://localhost:5000/api/test

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

- **OS**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: ~500MB for dependencies + database
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

## Testing Checklist
- Create both perishable and non-perishable needs; confirm urgency ordering and badges in Browse + Manager dashboards.
- Schedule events of different types and sign up/cancel as a helper; verify confirmed/waitlist state updates.
- Use bundle filters (Basic Food Box, Hygiene Kit, Beautification) on both helper and manager screens to ensure grouping works.

## Testing the Application

### Key Features to Test

1. **Login**: Use `admin` to login as a manager
2. **Create Need**: Go to Manager → Add Need
3. **Browse Needs**: Go to Browse to see all needs
4. **Add to Basket**: Click "Add to Basket" on any need
5. **Checkout**: Go to Basket and complete contribution
6. **Events**: Manager → Manage Events to schedule volunteer events
7. **Volunteer**: Helper → Volunteer to sign up for events

## Troubleshooting

### Database Won't Start

**Problem**: `npm run db:start` fails or MySQL doesn't start

**Solutions:**
1. Make sure port 3306 is not already in use
2. Check if you have another MySQL server running (stop it first)
3. On Windows: Run terminal as Administrator
4. Delete `backend/node_modules/mysql-server/lib/xampp` and try again
5. Check Windows Firewall isn't blocking the connection

### Backend Connection Errors

**Problem**: "Error creating database pool" or connection refused

**Solutions:**
1. Verify database is running in Terminal 1
2. Wait 10-15 seconds after starting database before starting backend
3. Check `.env` file exists in `backend/` directory
4. Verify `.env` has correct values (especially DB_HOST=localhost)
5. Try restarting the database: Ctrl+C in Terminal 1, then `npm run db:start` again

### Port Already in Use

**Problem**: "Port 5000 is already in use" or "Port 3000 is already in use"

**Solutions:**
1. Change `PORT=5001` in `backend/.env` for backend
2. Change port in `frontend/vite.config.ts` for frontend (line 10)
3. Or close the application using the port:
   - Windows: `netstat -ano | findstr :5000` then `taskkill /PID <pid> /F`
   - Mac/Linux: `lsof -ti:5000 | xargs kill`

### Frontend Can't Connect to Backend

**Problem**: API calls fail or "Failed to connect to server"

**Solutions:**
1. Verify backend is running on port 5000 (check Terminal 2)
2. Check `frontend/vite.config.ts` has correct proxy target: `http://localhost:5000`
3. Make sure both frontend and backend are running
4. Check browser console for specific error messages
5. Try accessing `http://localhost:5000/api/test` directly in browser

### Module Not Found Errors

**Problem**: "Cannot find module" or "Module not found"

**Solutions:**
1. Delete `node_modules` folders: `rm -rf node_modules` (Mac/Linux) or `rmdir /s node_modules` (Windows)
2. Delete `package-lock.json` files
3. Run `npm install` again in both `backend/` and `frontend/` directories
4. Make sure you're in the correct directory when running npm install

### Database Schema Errors

**Problem**: "Table doesn't exist" or schema errors

**Solutions:**
1. Make sure you ran `node setup-db.js` successfully
2. Check Terminal 1 (database) is still running
3. Try running `node setup-db.js` again (it's safe to run multiple times)
4. Check `backend/database/schema.sql` exists

### Verify Your Setup

Run this command to check your setup:
```bash
cd backend
npm run verify
```
This checks Node.js/npm versions, environment variables, dependencies, and required files.

## Clean Shutdown

To stop the application:

1. **Frontend**: In Terminal 3, press `Ctrl+C`
2. **Backend**: In Terminal 2, press `Ctrl+C`
3. **Database**: In Terminal 1, press `Ctrl+C`

## Fresh Start

If something goes wrong and you want to start over:

```bash
# Stop all running processes (Ctrl+C in each terminal)

# Reset database (optional - deletes all data)
cd backend
node setup-db.js  # This will recreate the database

# Restart everything following steps 4-9 above
```

## Important Notes

- **Bundled Database**: The application uses a bundled MariaDB - no separate MySQL installation required
- **Local Storage**: All data is stored locally in the database - no external services required
- **Sample Data**: Load sample data with `npm run seed` (optional)
- **Payment Buttons**: Payment buttons (Google Pay, Apple Pay, Credit Card) are visual only and not connected to payment processors
- **Default Manager**: Login with username `admin` to access manager features
- **Application runs entirely on localhost** - no external services required

## Documentation
- **[backend/ENV_SETUP.md](./backend/ENV_SETUP.md)**: Environment variables configuration guide

## Credits
- Designed for the RIT Needs Connect challenge – empowers food banks & beautification teams with shared prioritization workflows.
