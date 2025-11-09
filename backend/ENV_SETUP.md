# Environment Variables Setup

This file explains how to set up the `.env` file for the backend.

## Required Environment Variables

Create a file named `.env` in the `backend/` directory with the following content:

```env
# Database Configuration
# Default values for bundled MariaDB (npm run db:start)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=needs_connect

# Server Configuration
PORT=5000
```

## Using Your Own MySQL Server

If you have your own MySQL or MariaDB server instead of using the bundled one:

1. Update the `.env` file with your database credentials:
   ```env
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=needs_connect
   PORT=5000
   ```

2. Create the database:
   ```sql
   CREATE DATABASE needs_connect;
   ```

3. Run the schema:
   ```bash
   mysql -u your_username -p needs_connect < database/schema.sql
   ```

4. Skip the `npm run db:start` step and go directly to `npm start`

## Important Notes

- **Never commit the `.env` file to version control** - it contains sensitive information
- The `.env` file is already listed in `.gitignore`
- If using the bundled MariaDB, leave `DB_PASSWORD` empty
- The default port is 5000, but you can change it if needed
- Make sure the database server is running before starting the backend

## Verification

After creating the `.env` file, you can verify your setup by running:

```bash
npm run verify
```

This will check that all required environment variables are set correctly.

