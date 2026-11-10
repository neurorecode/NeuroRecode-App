# Neuro Recode — 60-Day RRR Accountability App

React Native (Expo) app + Supabase backend. Users upload a photo every day for 60 days to prove they practiced the RRR technique. Persistent push + WhatsApp reminders keep drop-off low.

> This is **Phase 1**: Auth, onboarding, daily upload, 60-day tracker, local push reminders. See "Roadmap" below for phases 2–4.

## Stack
- **Mobile**: Expo (React Native) — Android first, iOS after
- **Backend**: Supabase (Postgres, Auth, Storage, Edge Functions, cron)
- **Push**: Expo Notifications → FCM
- **WhatsApp** _(Phase 2)_: WhatsApp Business Cloud API via pre-approved utility templates
- **Timezone**: Asia/Kolkata (IST) for all cutoffs
- **Languages**: English + Tamil (settings toggle)

## Setup

### 1. Supabase
1. Create a new Supabase project.
2. In **SQL Editor**, run `supabase/schema.sql` (one shot — creates tables, RLS, triggers, storage bucket).
3. **Authentication → Providers → Phone**: enable, add a Twilio / MessageBird provider for OTP SMS.
4. **Project Settings → API**: copy the URL and anon key into `app.json` → `expo.extra`.

### 2. Expo app
```bash
npm install
npx expo start
```
Scan the QR with Expo Go on an Android phone to try it. Push notifications require a development build; see Expo docs.

### 3. Push notifications
- Dev: Expo Go handles permissions and token creation.
- Prod: set up Firebase, add `google-services.json`, run `eas build -p android`.

## Project layout
```
App.tsx                          app entry
src/
  navigation/RootNavigator.tsx   gated: auth → onboarding → home
  screens/
    SignInScreen.tsx             phone → OTP
    OtpScreen.tsx                6-digit code
    OnboardingScreen.tsx         name, language, time, consents
    IntroScreen.tsx              RRR explanation + rules; starts programme
    HomeScreen.tsx               Day X of 60, ring, calendar, stats
    UploadScreen.tsx             camera-only capture + optional note
    CelebrationScreen.tsx        post-upload
    SettingsScreen.tsx           language toggle, logout
  components/
    ProgressRing.tsx             SVG ring
    CalendarGrid.tsx             60 cells, green/red/grey/today
  lib/
    supabase.ts                  client
    notifications.ts             Expo push registration + local schedule
    i18n.ts                      EN/TA
    time.ts                      IST helpers
  store/useAuth.ts               zustand: session, profile, programme
  locales/{en,ta}.json
supabase/schema.sql              tables, RLS, triggers, bucket
```

## Day-counting rules (enforced server-side)
- One upload per `(programme_id, day_number)` — enforced by unique index.
- `uploaded_at` must fall inside the IST calendar day expected for `day_number` — enforced by `enforce_upload_day` trigger. Backdating and future-dating are rejected.
- After each upload, `after_daily_upload` updates `streak`, `longest_streak`, `missed_days`, and flips `status='completed'` on day 60.

## Phase 1 deliverables (this commit)
- Phone/OTP auth
- Onboarding with language + consent
- Intro + programme start
- Home with ring, 60-day grid, stats, warning banner when `consecutive_misses >= 2`
- Camera-only upload with date-stamped IST timestamps, compressed JPEG, private bucket
- Local 4× push schedule (7:00, 12:30, 18:00, 21:30 IST)
- Expo push token stored on `users.expo_push_token`
- EN + TA copy

## Roadmap
**Phase 2** — WhatsApp (utility templates) + missed-day escalation
- Supabase Edge Function running every 15 min
- `consecutive_misses` increment nightly; 3 misses → insert into `at_risk_flags`
- `send-reminders` function fires push + WA based on `settings` schedule

**Phase 3** — Admin web panel (Next.js)
- Dashboard, user detail, at-risk list, settings editor
- Webhook emitter for n8n on: upload done, at-risk flagged, programme completed

**Phase 4** — Badges, Day-60 certificate, streak rewards

## Design notes
- Primary `#0F766E` (calm teal). Change in `src/theme.ts` to rebrand.
- Images client-side resized to 1080px wide, JPEG quality 0.6 — keeps uploads well under 500 KB on 3G.
- Reminders cannot be fully turned off while a programme is active (WhatsApp can be paused; push consent is required at onboarding).
