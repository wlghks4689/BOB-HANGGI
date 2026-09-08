# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Model escalation policy

Routine work should be handled at the GPT-5.6 Sol level.

For this repository, treat the following as separate systems:

- Vanilla frontend: HTML / CSS / JavaScript
- Supabase PostgreSQL database and migrations
- Supabase Edge Functions
- Supabase Auth
- Supabase Storage
- Vercel deployment
- Cloudflare Turnstile
- Future external identity/payment providers such as PASS or PG services

Do not recommend Astra merely because a task changes many files.

Before making changes, recommend GPT-6 Astra and stop if the requested work
requires a structural change spanning multiple independent systems above,
especially when their interfaces or data contracts must change together.

Also recommend Astra and stop when:

- the root cause remains materially uncertain after evidence-based inspection;
- a database/auth/storage/production change carries meaningful data-loss,
  privacy, permission, or security risk and the safe migration path is unclear;
- several possible root causes remain and proceeding would require speculative
  changes across multiple systems.

When escalation is required, report only:

1. why Astra is recommended;
2. which systems are involved;
3. what should be investigated or changed after switching.

Do not modify code, migrations, secrets, deployment configuration, or production
state until the user explicitly chooses to continue.

Normal work that should remain on GPT-5.6 Sol includes:

- UI/CSS changes
- copy changes
- isolated JavaScript fixes
- documentation
- tests for an existing behavior
- a new migration with a clearly defined and already-approved schema change
- a localized Edge Function fix whose cause and blast radius are understood
