# Vedecký deň kvíz

Kvízová webová aplikácia pre akciu Vedecký deň na ZŠ Rajčianska.

## Rýchly štart

```bash
npm install
npm run dev
```

## Supabase SQL

- Spusti skript v [db/schema.sql](db/schema.sql).
- Do tabuľky `questions` ulož otázky a pole `accepted_answers` (napr. `["Bratislava", "BA"]`). Systém automaticky ignoruje veľkosť písmen a diakritiku.

## Premenné prostredia

Skopíruj `.env.example` do `.env.local` a doplň hodnoty:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`

## Dôležité súbory

- [src/app/actions.ts](src/app/actions.ts) - server actions pre `createPlayer` a `submitAnswer`
- src/app/admin/actions.ts - server actions pre správu administrácie (prihlásenie, úprava a mazanie otázok)
- [src/lib/supabase.ts](src/lib/supabase.ts) - klienti `supabase` a `supabaseAdmin`
- [src/components/QuizContainer.tsx](src/components/QuizContainer.tsx) - klientsky kvízový komponent
- [src/app/page.tsx](src/app/page.tsx) - načítanie otázok a layout
- [src/app/admin/page.tsx](src/app/admin/page.tsx) - admin rozhranie pre otázky
- [src/app/admin/analytics/page.tsx](src/app/admin/analytics/page.tsx) - štatistiky odpovedí a skóre
