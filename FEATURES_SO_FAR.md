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
- 12-step structured setup questionnaire with smart step skipping (Gym mode auto-skips Equipment step).
- Body Fat % optional field (preset buttons 10–30% + custom input) on the Personal step.
- BMI (Mifflin-St Jeor), BMR, and Maintenance Calories (TDEE) calculated on completion and displayed on the final step.
- Back navigation correctly skips equipment step when in gym mode.
- Auto-advance on single-select steps including gym/home mode detection.
- Calculated metrics (BMI, BMR, TDEE, Lean Mass, Protein Target, Water Target) saved to `profile` state on completion.

## 4. Home Dashboard (`/home`)
- Home header layout presenting notifications left and profile shortcuts right.
- Daily Sync check-in sheet (Sleep, Energy, Soreness, Stress, Motivation) powered by the global Modal Manager (fully unmounted on close).
- Dynamic Readiness Score calculated from check-in metrics.
- AI Weekly Review card highlighting achievements.
- Habit pattern detector cards.
- Personal Record list.
- Quick navigation shortcut grids.

## 5. Training (`/train`)
- Expandable Weekly Planner Dropdown header replacing default scroll.
- Interactive Training Calendar View support (Week / Month zoom, arrow navigation, swipe gestures) detailing workouts completed, calories, protein, recovery score, and water metrics.
- Daily Summary Modal displaying comprehensive logged stats per calendar day, dynamically reading custom logged calories burned.
- Clickable Exercise Cards allowing instant log access.
- External Exercise Logger supporting Approx Calories Burned input field and saving to history and metrics.
- Muscle group selection guides with categories: Chest, Back, Shoulders, Arms, Legs, Core, Abs, Glutes, Forearms, Calves, Cardio.
- Live Rest Timer bottom sheet (30s, 60s, 90s, 120s options).
- Celebration summary popup on session completion with social share hooks.
- Workout history view modal.

## 6. Diet & Nutrition (`/diet`)
- Circular macro progress indicators for Calories and Protein.
- Hydration tracker with quick-add (+250ml, +500ml, +1L) and reset options.
- Recipe search and ingredients view modal with cooking steps.
- Today's breakfast, lunch, dinner, snack suggestions.
- Meal catalog and custom food logging overlay supporting Indian foods with custom quantities and units.
- All estimated nutrition values labelled with `*Approx.` — custom logger preview, meal stats, recipe footer, and cost card.

## 7. Recovery (`/recovery`)
- Recovery Summary Card (score ring + 7-day sparkline) is the top element. Clickable to open Detailed Recovery Diagnostics modal showing Sleep Duration, Energy, Stress, Motivation, Hydration, Soreness, and 7-Day Readiness Trend SVG chart. Today's Vitals removed from main screen.
- Box Breathing exercise trainer integrated into `GlobalModalManager` (4-4-4-4 phase timer).
- Walk Reset interactive stopwatch modal containing steps goal, progress rings, and estimated burns.
- Mindfulness guided timer (1, 2, 5 min resets) with cycles of somatic prompts and scaling breathing animations.
- Premium Spotify-style full-width Brown Noise Player with Play, Pause, volume, and Remaining Time countdown slider.
- Advanced Diagnostics bio-metrics dashboard tracking Recovery Streak, Sleep Debt status, Hydration goals, Stress Trend lines, Mood Check, and Mental Load.

## 8. Squad Accountability & Custom Groups (`/socials`)
- Social sub-sections: Partner, Friends, Find Partner.
- Strangers compatibility search supporting expanded matching filters (Age, Gender, Goal, Level, Country, Language, Frequency, Time Zone, Discipline) with clean "Find My Match" CTA.
- AURA themed Add Friend modal replacing generic browser dialog prompts.
- Friends sub-section featuring the Universal Leaderboard ranking all friends + Me together by default, and a My Groups card grid.
- Group Detail Modal: Group Rank, Group Average stats, Comparative Squad Matrix table, 4 SVG weekly trend charts (Discipline, Workouts, Recovery, Protein), and a 💬 Open Group Chat button card (no chat preview snippets on overview).
- Fullscreen chat overlays for direct messages and group chats that hide bottom navigation, lock page scrolling, and attach message input sticky to the bottom safe area.
- Username click routing anywhere in Squad (chats, leaderboards, list cards) to expand the friend profile card.
- Squad header Inbox button opening a dialog list of active group chats, partner chats, and direct messages.
- Squad header [+ Add Friend] [Inbox] square icons.
- Partner Page Rework: 2x2 grid of meaningful Partner, Train, Diet, and Friends cards.
- Interactive You vs Partner comparison cards plotting completed workouts, water levels, protein, sleep, recovery score, and streak counts in dual progress bars.
- Match Partner Schedule: Adds a schedule matching button below Partner Metrics. Clicking it displays a weekly schedule preview modal sheet (Mon-Sun split structure). Matching the schedule registers a synced plan in the state and shows a visual success notification.
- Partner Schedule Match Analytics: Details synchronization status, weekly completion rate, alignment adherence percentage, and a visual comparison of recovery metrics.
- Copy Squad Schedule: Allows copying a squad member's workout split pattern to your own schedule inside the Group Detail modal. Shows list of members with discipline metrics and compatibility percentages, opens a day-by-day preview, and copies the split personalized to your stats.
- Squad Sync Panel: Interactive synchronization tracking panel in the Group Detail modal displaying sync alignment progress and status for all squad members.
- Group Analytics: High-fidelity squad analytics cards displaying Most Copied Schedule, Schedule Compatibility, and Schedule Compliance percentages below the weekly trends.

## 9. Profile & Settings (`/profile`, `/settings`)
- Photo file upload integration.
- Goal list, training split, diet preference updates.
- **Body Metrics section**: BMI, BMR, Maintenance Calories, Protein Target, Water Target, Lean Mass — all populated from onboarding calculations.
- Export all data to JSON format.
- Reset/Delete account modal confirmation.
- Interactive toggle settings.

## 10. Activity & Fitness Ring System (`/home`, `/onboarding`, `/recovery`)
- **Daily Step Goal Onboarding**: Questionnaire step inserted into the onboarding flow, saving step goal presets (5k-20k, default 10k) or custom values to profile and activity.
- **Hero Rings Card**: Replaced old readiness banner and individual steps/activity cards with a premium, clean side-by-side Hero Rings card containing:
  - **Discipline Ring (left)**: Colored `#5B5CF6`, displaying current Consistency score (`[score]/100`).
  - **Steps Ring (right)**: Colored `#00E5A8`, displaying daily movement progress (`[steps]/[goal]`).
  - Both rings animate smoothly from 0% fill to target percentage over a 1-second duration on page load.
- **Three-Column Stats Row**: Displays **Current Streak** (`[streak] Days`), **Messages** (unread count from Socials), and **Protein Progress** (`[consumed]g / [target]g` and progress percentage), completely eliminating duplicate Discipline scores from the main home page.
- **Draggable Discipline Details Bottom Sheet**: Clicking the Discipline Ring opens a bottom sheet showing:
  - Exact mathematical score breakdown (Workout Consistency, Protein Adherence, Sleep Quality, Hydration, Missed Sessions, and Skipped Recovery penalties) that sums to the exact current score.
  - Interactive **7 Days | 30 Days | 90 Days** view toggles.
  - **7-Day View**: Shows a 7-Day Trend SVG line chart, dynamic consistency insights, and Daily Score Changes log (`*` positive, `-` negative entries).
  - **30-Day View**: Shows Average score, Highest score, current streak, and a colour-coded 30-Day Grid representing consistency levels.
  - **90-Day View**: Shows 90-day average, Consistency Rating label, and a weekly averages block list.
- **Draggable Activity Details Bottom Sheet**: Clicking the Steps Ring opens the activity sheet tracking Steps, Distance, Calories, Stairs, Goal Progress, with a **Steps / Distance / Calories** metric toggle, switchable 7d / 30d / 90d trend SVG charts, and step goal configuration via preset/custom modal.
- **Daily Burn Progress Card**: Full-width card below the stats row showing today's active calorie burn progress bar (total / goal), percentage, and a dynamic insight line. Clicking opens the **Calorie Burn Analytics Sheet**.
- **Calorie Burn Analytics Sheet**: Detailed burn breakdown (Gym calories from workout history, Walking calories from steps, NEAT estimation), Week / Month / 90d SVG trend charts, burn insights, and an **Edit Burn Goal** button supporting preset or custom targets.
- **Protein Progress Sheet**: Clicking the Protein stat cell opens a detailed protein tracking sheet with 7d / 30d / 90d toggle, trend charts, macro adherence breakdown, and actionable protein tips.
- **Dynamic Daily Burn Goal Engine** (`activity-engine.js`): `getDailyBurnGoal(state)` uses the Mifflin-St Jeor BMR formula combined with onboarding profile data (goal, weight, height, age, gender, activity level, workout frequency) to compute a personalised daily active calorie target. Falls back to sensible defaults if profile data is missing.
- **Readiness Score Signals**: Steps achievement modifiers adjust daily readiness score: Low movement (<3k steps): `-2`, Moderate movement: `+2`, Goal achieved: `+5`.
- **Walk Reset Integration**: Commits stopwatch steps completed in Recovery Walk directly into daily activity data.
- **Integration Abstraction Layer**: Exposes future-ready `getActivityData()`, `updateActivitySteps()`, `updateActivityGoal()`, `getDailyBurnGoal()`, and `getCalorieBurnBreakdown()` abstraction hooks in `activity-engine.js`.

## 11. Home / Diet Separation — Output vs Input (`/home`, `/diet`)
- **Ghost-free DOM**: All bottom sheets and modals are dynamically mounted and unmounted. Custom bottom sheets are generated dynamically on demand via `openBottomSheet` inside `ui.js`, preventing legacy static sheets from lingering. Navigation routes automatically trigger `closeActiveBottomSheet(true)` inside the SPA router to ensure zero ghost elements or overlays remain.
- **Unified Bottom Sheet Manager**: Home (Discipline, Activity, Burn, Protein), Diet (Intake, Protein), Profile, and Settings use a centralized bottom-sheet singleton structure. This guarantees a maximum of one open bottom sheet at any time and automatically handles DOM removal.
- **Calorie Burn Progress Polish**: Daily active burn progress card displays calorie burn achievements with absolute minimum visual clutter, omitting the insight text line.
- **CSS Rework**: Cleaned up legacy styles and integrated smooth animation keyframes for sliding dynamic sheets.
