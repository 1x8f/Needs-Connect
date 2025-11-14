# Needs Connect

> **A comprehensive platform connecting community helpers with nonprofit organizations to fulfill urgent needs and coordinate volunteer efforts.**

Needs Connect is a full-stack web application designed for the RIT Software Engineering Competition. It enables nonprofit managers to post urgent needs (food, clothing, supplies, services) while allowing community helpers to browse, fund, and volunteer for these needs. The platform features intelligent urgency scoring, bundle management, and a complete volunteer event coordination system.

## Project Overview

This application solves the critical problem of connecting community resources with nonprofit organizations that need them most. Key innovations include:

- **Intelligent Urgency Scoring**: Automatically calculates priority based on deadlines, perishability, inventory levels, and demand
- **Bundle Management**: Groups related items (food boxes, hygiene kits, etc.) for efficient fulfillment
- **Volunteer Coordination**: Complete event management system with waitlist handling and capacity tracking
- **Real-time Dashboard**: Managers can track fulfillment progress and coordinate volunteer efforts

## Architecture

The application follows a clean separation of concerns:

- **Backend**: RESTful API built with Express.js, using MySQL connection pooling for efficient database operations
- **Frontend**: Modern React application with TypeScript for type safety, using React Query for efficient data fetching
- **Database**: Normalized MySQL schema with proper foreign key relationships and indexes for performance
- **Authentication**: Trust-based system (suitable for competition prototype) with role-based access control

##  Quick Start

### Prerequisites

**Required:**
- ✅ Node.js 18+ installed (check with `node --version`)
- ✅ npm 9+ installed (check with `npm --version`)
- ✅ Windows 10+ (for bundled database) OR MySQL/MariaDB installed (Mac/Linux)

**Recommended:**
- 3 terminal windows/tabs ready
- At least 500MB free disk space
- 4GB RAM minimum (8GB recommended)

### Automated Setup (Recommended)

The easiest way to set up the project:

```bash
# Run the automated setup script
node setup.js
```

This script will:
- ✅ Check prerequisites (Node.js, npm versions)
- ✅ Create the `.env` file automatically
- ✅ Install all dependencies (backend + frontend)

**After running setup.js, continue with Step 4 below.**

### Manual Setup

If you prefer to set up manually or the automated script doesn't work:

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

**Tip**: The automated setup script (`node setup.js`) creates this file for you!

#### Step 3: Verify Setup (Optional)

```bash
cd backend
npm run verify
```

This checks that all dependencies are installed and environment variables are configured correctly.

###  Database Setup

** Important**: The bundled MySQL server only works on **Windows**. For Mac/Linux, see [Alternative Database Setup](#alternative-database-setup-maclinux) below.

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
- On Windows: If you get permission errors, **run terminal as Administrator**
- Check Windows Firewall isn't blocking the connection
- If extraction fails, make sure you have at least 200MB free disk space
- If you see "MySQL bundle not found", run `npm install` again in the backend directory

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

## Key Features

### Priority & Time-Sensitive Needs Management (Required Feature - 10%)

**Intelligent Urgency Calculation**
The system automatically computes an urgency score for each need based on multiple factors:
- **Base Priority**: Urgent (60), High (40), Normal (20)
- **Deadline Proximity**: Overdue (+35), 0-3 days (+30), 4-7 days (+20), 8-14 days (+10)
- **Inventory Status**: Low inventory (<25% remaining) adds +10 points
- **Perishability**: Perishable items receive +15 points
- **Demand**: Request count contributes up to +25 points
- **Service Requirements**: Volunteer needs add +10 points

**Advanced Filtering & Sorting**
- Sort by urgency score (highest first)
- Filter by time-sensitive needs (deadlines within 7 days)
- Filter by bundle tags: Basic Food Box, Hygiene Kit, Winter Clothing, Cleaning Supplies, Beautification
- Filter by perishable items
- Filter by service/volunteer requirements
- Sort by most requested items

**Dashboard Highlights**
- Critical needs (overdue or urgent priority)
- Perishable items requiring immediate attention
- Volunteer-service needs with upcoming deadlines

### Volunteer Dispatch & Distribution Workflow (Custom Feature - 10%)

**Event Management System**
- **Event Types**: Delivery, Kit Building, Cleanup, Distribution
- **Scheduling**: Managers can create events with:
  - Location and time windows
  - Volunteer capacity (slots)
  - Detailed notes and instructions
  - Association with specific needs

**Helper Volunteer Experience**
- Browse all upcoming volunteer opportunities
- View event details: location, time, remaining slots, notes
- Sign up for events with one click
- Automatic waitlist handling when events reach capacity
- View personal signup status (Confirmed/Waitlist)
- Cancel signups with immediate status updates

**Manager Coordination Tools**
- View all upcoming events in one dashboard
- See real-time slot utilization (X/Y volunteers confirmed)
- Track waitlist counts
- Edit or delete events as needed
- Monitor volunteer commitments per need

## User Walkthrough

1. **Manager Login** (use username `admin` to get manager rights)
2. Visit `Dashboard` → create or edit needs with deadlines, perishable flag, bundle tags, or volunteer requirements.
3. `Events` page lets managers schedule volunteer shifts tied to specific needs and review upcoming commitments.
4. Helpers see prioritized needs under `Browse Needs` (sorted by urgency score) and can drill into bundles (food, clothing, hygiene, beautification).
5. `Volunteer` page (accessible from navigation) lists scheduled events, remaining slots, and status (confirmed/waitlist/cancelled) for the signed-in helper.

##  API Documentation

### Core Endpoints

**Needs Management**
- `GET /api/needs` - Get all needs with optional filters (priority, category, bundle, sort, timeSensitiveOnly)
- `GET /api/needs/:id` - Get specific need details
- `GET /api/needs/bundle/:bundleTag` - Get needs by bundle tag (basic_food, hygiene_kit, etc.)
- `GET /api/needs/urgent` - Get urgent needs only
- `POST /api/needs` - Create new need (manager only)
- `PUT /api/needs/:id` - Update need (manager only)
- `DELETE /api/needs/:id` - Delete need (manager only)

**Volunteer Events**
- `GET /api/events/upcoming?userId=:userId` - Get upcoming events with user signup status
- `GET /api/events/need/:needId` - Get events for specific need
- `POST /api/events` - Create new event (manager only)
- `POST /api/events/:eventId/signup` - Sign up for event (helper)
- `POST /api/events/:eventId/cancel` - Cancel event signup (helper)
- `PUT /api/events/:id` - Update event (manager only)
- `DELETE /api/events/:id` - Delete event (manager only)

**Basket & Funding**
- `GET /api/basket/:userId` - Get user's basket
- `POST /api/basket` - Add item to basket
- `PUT /api/basket/:id` - Update basket item quantity
- `DELETE /api/basket/:id` - Remove item from basket
- `POST /api/funding/checkout` - Process checkout (convert basket to funding)

**Authentication**
- `POST /api/auth/login` - Login/register user (trust-based, username only)

### Query Parameters

**Needs Filtering:**
- `sort=urgency` - Sort by urgency score (descending)
- `priority=urgent|high|normal` - Filter by priority level
- `bundle=basic_food|hygiene_kit|...` - Filter by bundle tag
- `timeSensitiveOnly=true` - Only needs with deadlines within 7 days
- `perishable=true` - Only perishable items
- `service=true` - Only items requiring volunteer service

## Tech Stack
- **Backend:** Node.js 18+, Express 5, mysql2 (promise pool), bundled MariaDB for local development.
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Shadcn UI components.
- **Database:** MariaDB (bundled) or MySQL 5.7+
- **Tooling:** Nodemon for backend dev, adm-zip for unpacking local database bundle.

## Alternative Database Setup (Mac/Linux)

The bundled MySQL server is Windows-only. For Mac/Linux users:

### Option 1: Install MySQL/MariaDB Locally

1. **Install MySQL or MariaDB:**
   - **Mac**: `brew install mysql` or `brew install mariadb`
   - **Linux**: `sudo apt-get install mysql-server` or `sudo apt-get install mariadb-server`

2. **Start MySQL service:**
   - **Mac**: `brew services start mysql`
   - **Linux**: `sudo systemctl start mysql`

3. **Update `backend/.env`:**
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password  # Set your MySQL root password
   DB_NAME=needs_connect
   PORT=5000
   ```

4. **Continue with Step 5** (Initialize Database) below.

### Option 2: Use Docker

1. **Run MySQL in Docker:**
   ```bash
   docker run --name needs-connect-db -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=needs_connect -p 3306:3306 -d mysql:8.0
   ```

2. **Update `backend/.env`:**
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=root
   DB_NAME=needs_connect
   PORT=5000
   ```

3. **Wait 10-15 seconds** for MySQL to start, then continue with Step 5.

## System Requirements

- **OS**: Windows 10+ (for bundled database) OR macOS 10.15+/Linux with MySQL installed
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

1. **Login**: Use `admin` to login as a manager (or any other username for helper role)
2. **Create Need**: Manager → Dashboard → Add Need
3. **Browse Needs**: Go to Browse Needs to see all needs
4. **Add to Basket**: Click "Add to Basket" on any need
5. **Checkout**: Go to Basket and complete contribution
6. **Events**: Manager → Dashboard → Events to schedule volunteer events
7. **Volunteer**: Helper → Volunteer (in navigation) to sign up for events
8. **Event Signup**: Helpers can sign up for events, see waitlist status, and cancel signups

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

- **Bundled Database**: The application uses a bundled MariaDB on Windows - no separate MySQL installation required (Windows only)
- **Mac/Linux Users**: Must install MySQL/MariaDB separately or use Docker (see [Alternative Database Setup](#alternative-database-setup-maclinux))
- **Local Storage**: All data is stored locally in the database - no external services required
- **Sample Data**: Load sample data with `npm run seed` (optional)
- **Payment Buttons**: Payment buttons (Google Pay, Apple Pay, Credit Card) are visual only and not connected to payment processors
- **Default Manager**: Login with username `admin` to access manager features
- **Application runs entirely on localhost** - no external services required
- **Setup Script**: Run `node setup.js` in the project root for automated setup

## Documentation
- **[backend/ENV_SETUP.md](./backend/ENV_SETUP.md)**: Environment variables configuration guide

## Credits
- Designed for the RIT Needs Connect challenge – empowers food banks & beautification teams with shared prioritization workflows.
