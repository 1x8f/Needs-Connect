# Quick Start Checklist

Print this page for easy reference during setup.

## ✅ Setup Checklist

### Before You Start
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm 9+ installed (`npm --version`)
- [ ] 3 terminal windows ready

### Step 1: Install Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Step 2: Create .env File
Create `backend/.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=needs_connect
PORT=5000
```

### Step 3: Verify Setup (Optional)
```bash
cd backend
npm run verify
```

### Step 4: Start Database (Terminal 1)
```bash
cd backend
npm run db:start
```
⏳ Wait for "MySQL server started" message

### Step 5: Initialize Database (Terminal 2)
```bash
cd backend
node setup-db.js
npm run seed    # Optional: adds sample data
npm start       # Start backend server
```

### Step 6: Start Frontend (Terminal 3)
```bash
cd frontend
npm run dev
```

### Step 7: Open Browser
🌐 http://localhost:3000

**Login**: Use username `admin` for manager access

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Database won't start | Check port 3306 is free, run as Admin (Windows) |
| Backend connection error | Wait 10-15 sec after starting DB, check .env exists |
| Port already in use | Change PORT in .env or close other apps |
| Module not found | Delete node_modules, run `npm install` again |
| Frontend can't connect | Check backend is running on port 5000 |

---

## 📝 Important Notes

- **Database must stay running** - Keep Terminal 1 open
- **Default manager login**: username `admin`
- **All data is local** - No external services needed
- **3 terminals required** - Database, Backend, Frontend

---

## 🔗 Useful URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Test endpoint: http://localhost:5000/api/test

---

## 📚 More Help

- Detailed setup: See [SETUP.md](./SETUP.md)
- Environment vars: See [backend/ENV_SETUP.md](./backend/ENV_SETUP.md)
- Full README: See [README.md](./README.md)

