# Needs Connect Frontend

This is the frontend for the Needs Connect application, built with React, TypeScript, Vite, and shadcn/ui components.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000` and proxy API requests to the backend at `http://localhost:5000`.

## Features

- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **TypeScript**: Full type safety
- **React Query**: Efficient data fetching and caching
- **Authentication**: Trust-based login system
- **Responsive Design**: Works on all devices

## Pages

- `/` - Home page with login
- `/needs` - Browse all needs
- `/basket` - Shopping cart
- `/dashboard` - Manager dashboard (manager role only)

## API Integration

The frontend is fully integrated with the backend API. All API calls are in `src/services/api.ts`.

## Authentication

- Use username "admin" to get manager role
- Any other username gets helper role
- No password required (trust-based authentication)
