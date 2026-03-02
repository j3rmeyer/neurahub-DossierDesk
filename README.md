# DossierDesk

Practice Management webapp voor accountantskantoren. Onderdeel van het NeuraHub platform.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Database:** PostgreSQL (Railway)
- **ORM:** Prisma 5
- **UI:** shadcn/ui + Tailwind CSS v4
- **State:** TanStack Query v5
- **Drag & Drop:** @dnd-kit

## Setup

```bash
# Dependencies installeren
npm install

# Prisma client genereren
npm run db:generate

# Database migratie uitvoeren
npm run db:migrate

# Seed data laden (Jerry Meyer voorbeeld)
npm run db:seed

# Development server starten
npm run dev
```

## Environment Variables

Maak een `.env` bestand aan (zie `.env.example`):

```
DATABASE_URL="postgresql://user:password@host:port/database"
```

## Test Login

- **Email:** test@dossierdesk.nl
- **Wachtwoord:** test123
