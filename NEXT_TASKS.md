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
- [x] Recovery Page: Removed Today's Vitals section from main screen. Somatic values now only shown inside Recovery Details modal.
- [x] Group Detail Modal: Removed Group Chat Preview snippet. Replaced with 💬 Open Group Chat button card.
- [x] Onboarding: BMI + BMR + TDEE (Maintenance Calories) calculated and displayed on final completion screen.
- [x] Onboarding: Optional Body Fat % field (preset 10/15/20/25/30% buttons + custom input) on Personal step.
- [x] Onboarding: Gym mode auto-skips Equipment step. Back button also skips it when in gym mode.
- [x] Onboarding: Back button fixed — goes back exactly 1 step (no resets).
- [x] Onboarding: BMI/BMR/TDEE/Lean Mass saved to `profile` state on completion.
- [x] Profile Page: Body Metrics section added (BMI, BMR, Maintenance, Protein Target, Water Target, Lean Mass).
- [x] Diet: All estimated values marked with `*Approx.` — custom logger preview, meal detail stats, cost card, recipe footer.
- [x] Socials: #chat-content CSS fixed to fill overlay as flex column, ensuring DM input is always bottom-pinned.
- [x] Global Theme Option 3: Applied deeper background (#050505), cards (#11121A), borders (#23253A), primary (#5B5CF6), accent (#00E5A8), recovery (#42D4FF), secondary text (#8E93B8).
- [x] Partner Schedule Matching: Added "Match Partner Schedule" trigger button, Mon-Sun splits schedule preview modal sheet, state persistence, success toast, and "Partner Schedule Match" analytics (weekly completion, alignment adherence, recovery metric comparison).
- [x] Squad Copy Schedule: Added "Copy Schedule" button in Group Detail Modal. Displayed squad members selection row with discipline level and compatibility %. Opens daily split preview and saves as personalized squad synced plan.
- [x] Admin Schedule Sync: Allowed admin to apply/sync their schedule to the squad, with a confirmation modal previewing daily splits. Sends accepted/pending sync invites.
- [x] Squad Sync Panel: Integrated progress tracking showing accept/decline/pending status of the sync for all squad members.
- [x] Group Analytics: Added custom high-fidelity stats cards for "Most Copied Schedule", "Schedule Compatibility", and "Schedule Compliance" below the group details weekly trend charts.
- [x] Apple Fitness-style Activity Rings & Steps System: Replaced Goal cell in stats row with Steps, rendered circular SVG activity ring on Home page, integrated activity details sheet (Today/Week views, preset/custom change goal dialog, hourly/weekly CSS charts, dynamic insights), added onboarding daily step goal step, integrated Walk Reset stopwatch steps logging, and added services abstraction layer in `activity-engine.js`.

### 2. Next Priorities & Unresolved
- [ ] Share workout cards download options.
- [ ] Readiness syncing checks logic loop check.
- [ ] Home dashboard mini Body Metrics card (BMI/BMR quick view).
- [ ] Onboarding goals multi-select persistence verification.
