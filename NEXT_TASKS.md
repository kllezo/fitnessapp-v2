# NEXT TASKS — AURA V2

## Phase UX Polish & Bug Fixes

### 1. Completed Tasks (V2 Polish Pass)
- [x] Reworked Training Page: Removed default week chip strip. Integrated expandable dropdown weekly planner (D1-D7).
- [x] Training Calendar: Interactive Week / Month calendar switcher, navigation controls, horizontal swipe gestures, detailed daily cell metrics (workout completed, calories consumed/burned, protein target hit/missed, sleep/readiness, water).
- [x] Clickable cells opening high-fidelity Daily Summary Modal sheets.
- [x] Exercise Card Polish: Made entire exercise card clickable to log sets.
- [x] Muscle categories illustrations updated: Chest, Back, Shoulders, Arms, Legs, Core, Abs, Glutes, Forearms, Calves, Cardio.
- [x] Custom Food Logger Rework: Removed hardcoded "Recognised foods" text. Expanded parser with quantities and units (g, ml, cup, scoop, bar, piece) with full Indian food support (Roti, Dal, Paneer, Rice, Curd, eggs, etc.).
- [x] Nutrition Portions Scaling: Calculated MSJ targets and dynamically scaled macros across 4-5 meals (Breakfast, Lunch, Snacks, Dinner, Pre-workout) to hit goals.
- [x] Deleted floating "+" button from Diet screen.
- [x] Moved Recovery Tools (Box Breathing, Walk Reset, Mindfulness) above Advanced Diagnostics.
- [x] Walk Reset upgrade: Stopwatch tracker with steps goal, progress rings, and calories burned estimation.
- [x] Mindfulness upgrade: 1, 2, and 5-min guided sessions with somatic breathing animations and text prompt cycles.
- [x] Spotify-style Brown Noise player: full-width card with play, pause, volume range, and elapsed/remaining duration countdown slider.
- [x] Squad Add Friend modal sheet: replaced browser alert/prompts with full search preview, invite checks, and requests logs.
- [x] Custom groups section on Friends tab: replaced DMs/Friends lists with custom group switcher, group chats, group leaderboards, and comparative Excel grids (Friend, Workout, Protein, Water, Sleep, Recovery, Discipline).
- [x] Moved Profile icon from Squad header to Home Page header (Notification left, Profile right).
- [x] Squad header updated to square [+ Add Friend] and [Inbox] icon buttons. Removed giant Add Friend button from content body.
- [x] Partner Page Quick Actions: Reworked into 2x2 grid of Partner profile, Train, Diet, and Friends chat shortcut cards.
- [x] Fixed duplicate overlays: All page overlays now clean up and close via Global Modal Manager sheet handlers.
- [x] External Exercise Logger: Approx Calories Burned field added and integrated to workout history and daily cell metrics.
- [x] Recovery Score top card clickable click detailed diagnostics bottom sheet modal with 7-day Readiness Trend SVG graph.
- [x] Daily survey checklist options for sleep hours (<2h, 2-4h, 4-6h, 6-8h, 8+h).
- [x] Friends tab default layout: Universal Leaderboard ranking all friends + Me together, and My Groups cards list.
- [x] Custom groups details consolidated inside the Group Detail modal with Excel comparative tables, group metrics, chat preview, and weekly SVG line charts (Discipline, Workouts, Recovery, Protein) using colored lines.
- [x] Fullscreen group and direct chat overlays with hidden bottom navigation, scroll safe-locks, and sticky bottom inputs.
- [x] Username routing inside chats, DMs, leaderboards, partner pages, and friend lists to show Friend Profiles.
- [x] Inbox button header trigger displaying active group and direct message chat overlays.
- [x] Replaced local daily sync bottom sheet with Modal Manager overlay to avoid overlay remnants and double layouts.

### 2. Next Priorities & Unresolved
- [ ] Onboarding goals multi-select checks (e.g. Build Muscle + Lose Fat).
- [ ] Equipment selection expansion to support Bench, Smith Machine, bands, mat, weight options.
- [ ] Auto-advance on single-selection questionnaire steps.
- [ ] Back button navigation logic fixes for onboarding steps.
- [ ] Share workout cards download options.
- [ ] Readiness syncing checks logic loop check.
