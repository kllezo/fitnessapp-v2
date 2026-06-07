# FEATURES SO FAR — AURA V2

## 1. SPA Router & App Shell
- Hash-based SPA Router (`#/auth`, `#/onboarding`, `#/home`, `#/train`, `#/diet`, `#/recovery`, `#/socials`, `#/profile`, `#/settings`).
- Mobile frame shell layout styled as a native mobile OS.
- Dynamic status bar with simulated battery, network, and live clock.
- Dynamic global bottom navigation bar (hidden on `/auth` and `/onboarding`).
- Global toast notifications (`showToast`).
- Global modal sheets (`showModal`, `closeModal`).

## 2. Authentication Page (`/auth`)
- Aesthetic lockscreen-style gate.
- Username and full name login inputs.
- "✦ Try Demo Mode" instant onboarding/home entry point.
- Dynamic neon glowing card aesthetic.

## 3. Onboarding Experience (`/onboarding`)
- 12-step structured setup questionnaire:
  1. Fitness goal (Build Muscle, Lose Fat, Maintain, Endurance, Flexibility).
  2. Workout mode (Gym, Home).
  3. Training frequency (2-6 days/week).
  4. Experience level (Beginner, Intermediate, Advanced).
  5. Equipment (Full Gym vs Bodyweight).
  6. Split preference (Full Body, Upper/Lower, PPL).
  7. Diet style (Vegetarian, Eggitarian, Non-Veg).
  8. Budget (Low, Medium, Premium).
  9. Focus muscles.
  10. Body stats (Weight, Height, Age).
  11. Sleep/Wake times.
  12. Weekly schedule commitment.

## 4. Home Dashboard (`/home`)
- Home header layout presenting notifications left and profile shortcuts right.
- Daily Sync check-in sheet (Sleep, Energy, Soreness, Stress, Motivation).
- Dynamic Readiness Score calculated from check-in metrics.
- AI Weekly Review card highlighting achievements.
- Habit pattern detector cards.
- Personal Record list.
- Quick navigation shortcut grids.

## 5. Training (`/train`)
- Expandable Weekly Planner Dropdown header replacing default scroll.
- Interactive Training Calendar View support (Week / Month zoom, arrow navigation, swipe gestures) detailing workouts completed, calories, protein, recovery score, and water metrics.
- Daily Summary Modal displaying comprehensive logged stats per calendar day.
- Clickable Exercise Cards allowing instant log access.
- Muscle group selection guides with categories: Chest, Back, Shoulders, Arms, Legs, Core, Abs, Glutes, Forearms, Calves, Cardio.
- Live Rest Timer bottom sheet (30s, 60s, 90s, 120s options).
- Celebration summary popup on session completion with social share hooks.
- Workout history view modal.

## 6. Diet & Nutrition (`/diet`)
- Circular macro progress indicators for Calories and Protein.
- Hydration tracker with quick-add (+250ml, +500ml, +1L) and reset options.
- Recipe search and ingredients view modal.
- Today's breakfast, lunch, dinner, snack suggestions.
- Meal catalog and custom food logging overlay supporting Indian foods (Tea, Coffee, Curd, Rice, Dal, Paneer, eggs, etc.) with custom quantities and units.

## 7. Recovery (`/recovery`)
- Somatic vital tracking and daily check-ins.
- Box Breathing exercise trainer integrated into `GlobalModalManager` (4-4-4-4 phase timer).
- Walk Reset interactive stopwatch modal containing steps goal, progress rings, and estimated burns.
- Mindfulness guided timer (1, 2, 5 min resets) with cycles of somatic prompts and scaling breathing animations.
- Premium Spotify-style full-width Brown Noise Player with Play, Pause, volume, and Remaining Time countdown slider.
- Advanced Diagnostics bio-metrics dashboard tracking Recovery Streak, Sleep Debt status, Hydration goals, Stress Trend lines, Mood Check, and Mental Load.

## 8. Squad Accountability & Custom Groups (`/socials`)
- Social sub-sections: Partner, Friends, Find Partner.
- Strangers compatibility search supporting expanded matching filters (Age, Gender, Goal, Level, Country, Language, Frequency, Time Zone, Discipline) with clean "Find My Match" CTA.
- AURA themed Add Friend modal replacing generic browser dialog prompts.
- Friends sub-section featuring Custom Groups with Leaderboards, Group chats, and Excel-like Comparison Matrix tables (Friend, Workout, Protein, Water, Sleep, Recovery, Discipline).
- Squad header [+ Add Friend] [Inbox] square icons.
- Partner Page Rework: 2x2 grid of meaningful Partner, Train, Diet, and Friends cards.
- Interactive You vs Partner comparison cards plotting completed workouts, water levels, protein, sleep, recovery score, and streak counts in dual progress bars.

## 9. Profile & Settings (`/profile`, `/settings`)
- Photo file upload integration.
- Goal list, training split, diet preference updates.
- Export all data to JSON format.
- Reset/Delete account modal confirmation.
- Interactive toggle settings.
