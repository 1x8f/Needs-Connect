# Setup Guide for Needs Connect

This guide will help you set up the project on a new machine.

## Prerequisites

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MySQL or MariaDB** - Either:
  - Local MySQL/MariaDB installation, OR
  - Use the bundled MariaDB (runs `npm run db:start` in backend)

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Needs-Connect
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
# On Windows:
copy .env.example .env

# On Mac/Linux:
cp .env.example .env

# Edit .env file with your database credentials:
# DB_HOST=127.0.0.1
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=needs_connect
```

**Option A: Using Bundled MariaDB (Easier)**
```bash
# In one terminal - Start bundled database
npm run db:start

# In another terminal - Setup database schema
node setup-db.js

# Optional: Seed with sample data
npm run seed
```

**Option B: Using Local MySQL/MariaDB**
```bash
# Make sure MySQL is running
# Update .env with your MySQL credentials
# Then run:
node setup-db.js

# Optional: Seed with sample data
npm run seed
```

**Start the backend server:**
```bash
npm start
# Server runs on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend runs on http://localhost:3000
```

## Verification

1. **Backend**: Visit `http://localhost:5000/api/test` - should return `{"message":"Backend is working!"}`
2. **Frontend**: Visit `http://localhost:3000` - should show the landing page
3. **Login**: 
   - Use username `admin` for manager role
   - Use any other username for helper role

## Project Structure

```
Needs-Connect/
├── backend/
│   ├── controllers/     # API route handlers
│   ├── database/        # Database schema and connection
│   ├── middleware/      # Auth middleware (placeholder)
│   ├── routes/          # API route definitions
│   ├── scripts/         # Database setup and seed scripts
│   ├── server.js        # Express server entry point
│   └── .env            # Database configuration (create from .env.example)
│
└── frontend/
    ├── src/
    │   ├── components/  # React components
    │   ├── pages/       # Page components
    │   ├── services/    # API service functions
    │   ├── context/     # React context (Auth)
    │   └── App.tsx     # Main app component
    └── vite.config.ts   # Vite configuration (proxy setup)
```

## Environment Variables

### Backend (.env)

```env
DB_HOST=127.0.0.1          # Database host
DB_USER=root               # Database username
DB_PASSWORD=               # Database password (empty for default)
DB_NAME=needs_connect      # Database name
PORT=5000                  # Server port (optional)
```

## Common Issues

### Database Connection Error

**Problem**: `Error connecting to MySQL database`

**Solutions**:
1. Make sure MySQL/MariaDB is running
2. Check `.env` file has correct credentials
3. Verify database exists: `node setup-db.js` will create it
4. On Windows, try `127.0.0.1` instead of `localhost`

### Port Already in Use

**Problem**: `Port 3000/5000 is already in use`

**Solutions**:
1. Stop other applications using those ports
2. Or change ports in:
   - Backend: Set `PORT=5001` in `.env`
   - Frontend: Update `vite.config.ts` port and proxy target

### Frontend Can't Connect to Backend

**Problem**: API calls fail with CORS or connection errors

**Solutions**:
1. Make sure backend is running on port 5000
2. Check `vite.config.ts` proxy configuration
3. Verify backend CORS is enabled (it is by default)

### Missing Dependencies

**Problem**: `Module not found` errors

**Solutions**:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Make sure you're using Node.js v16+

## Development Workflow

1. **Start Database** (if using bundled MariaDB):
   ```bash
   cd backend
   npm run db:start
   ```

2. **Start Backend** (in separate terminal):
   ```bash
   cd backend
   npm start
   # or for auto-reload: npm run dev
   ```

3. **Start Frontend** (in separate terminal):
   ```bash
   cd frontend
   npm run dev
   ```

4. **Access Application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## Production Build

### Frontend
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

### Backend
```bash
cd backend
npm start
# Make sure .env is configured for production database
```

## Testing the Application

1. **Login as Manager**:
   - Username: `admin`
   - Should redirect to Dashboard
   - Can create needs, schedule events, view helper activity

2. **Login as Helper**:
   - Username: any other name (e.g., `john`)
   - Should redirect to Needs page
   - Can browse needs, add to basket, checkout

3. **Test Features**:
   - Create a need (manager)
   - Browse needs (helper)
   - Add to basket and checkout (helper)
   - View helper activity (manager)
   - Schedule events (manager)

## Notes

- The `.env` file is gitignored - you need to create it from `.env.example`
- The `frontend-old/` directory is the old frontend - can be ignored
- Database schema is automatically created by `setup-db.js`
- Sample data can be loaded with `npm run seed` in backend

## Support

If you encounter issues:
1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure MySQL is running and accessible
4. Check that ports 3000 and 5000 are available

