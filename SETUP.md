# Needs Connect - Setup Guide for Competition Judges

This guide will help you set up and run the Needs Connect application on your computer.

## Prerequisites

- **Node.js**: Version 18 or higher (check with `node --version`)
- **npm**: Version 9 or higher (comes with Node.js, check with `npm --version`)
- **Terminal/Command Prompt**: To run commands
- **3 Terminal Windows**: One for database, one for backend, one for frontend

## Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
```

Create `backend/.env` with the following content:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=needs_connect
PORT=5000
```

**Note**: These are the default values for the bundled MariaDB. If you have your own MySQL server, update the values accordingly.

**Verify your setup** (optional but recommended):
```bash
npm run verify
```

This will check that all dependencies are installed and environment variables are configured correctly.

### Step 3: Start the Database

Open **Terminal 1** and run:

```bash
cd backend
npm run db:start
```

**What to expect:**
- First run: You'll see "Extracting bundled MySQL..." - this takes 1-2 minutes
- After extraction: "Starting bundled MySQL server..."
- Leave this terminal open - the database must stay running

**Troubleshooting:**
- If you see port conflicts, make sure port 3306 is not in use
- On Windows: If you get permission errors, run terminal as Administrator
- Wait for "MySQL server started" message before proceeding

### Step 4: Initialize the Database

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

### Step 5: (Optional) Seed Sample Data

Still in **Terminal 2**:

```bash
npm run seed
```

This populates the database with sample needs, users, and events for testing.

### Step 6: Start the Backend Server

Still in **Terminal 2** (or open a new Terminal 3):

```bash
cd backend
npm start
```

**What to expect:**
- "Database pool created successfully"
- "Server is running on port 5000"

**Troubleshooting:**
- If port 5000 is in use, change `PORT=5001` in `backend/.env` and restart
- If you see database connection errors, check that Terminal 1 (database) is running

### Step 7: Start the Frontend

Open **Terminal 3** (or use a new terminal):

```bash
cd frontend
npm run dev
```

**What to expect:**
- Vite dev server starting
- "Local: http://localhost:3000"
- Browser may automatically open

### Step 8: Access the Application

Open your browser and go to: **http://localhost:3000**

## Testing the Application

### Default Users

- **Manager**: Username `admin` (has manager privileges)
- **Helper**: Any username (defaults to helper role)

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

# Restart everything following steps 3-7 above
```

## Need Help?

If you encounter issues not covered here:

1. Check the terminal output for error messages
2. Verify all prerequisites are installed
3. Make sure all three terminals are running (database, backend, frontend)
4. Check that ports 3000 and 5000 are available
5. Verify `.env` file exists and has correct values

## System Requirements

- **OS**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: ~500MB for dependencies + database
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

## Competition Notes

- The application uses a bundled MariaDB database - no separate MySQL installation required
- All data is stored locally in the database
- The application runs entirely on localhost - no external services required
- Sample data can be loaded with `npm run seed` in the backend directory
