# Science Day Quiz

A quiz web application for the Science Day event at Rajčianska Elementary School.

## Quick Start

```bash
npm install
npm run dev
```

## Supabase SQL

- Run the script in [db/schema.sql](db/schema.sql).
- Insert questions and the `accepted_answers` array into the `questions` table (e.g., `["Bratislava", "BA"]`). The system automatically ignores case and diacritics.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`

## Important Files

- [src/app/actions.ts](src/app/actions.ts) - server actions for `createPlayer` and `submitAnswer`
- src/app/admin/actions.ts - server actions for admin management (login, editing, and deleting questions)
- [src/lib/supabase.ts](src/lib/supabase.ts) - `supabase` and `supabaseAdmin` clients
- [src/components/QuizContainer.tsx](src/components/QuizContainer.tsx) - client-side quiz component
- [src/app/page.tsx](src/app/page.tsx) - question fetching and layout
- [src/app/admin/page.tsx](src/app/admin/page.tsx) - admin interface for questions
- [src/app/admin/analytics/page.tsx](src/app/admin/analytics/page.tsx) - answer and score analytics
