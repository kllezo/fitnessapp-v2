# NEXT TASKS — AURA V2

## Phase UX Polish & Bug Fixes

### 1. Onboarding Improvements
- [ ] Goal multi-select options (e.g. Build Muscle + Lose Fat).
- [ ] Equipment catalog expansion (Gym, Dumbbell, Barbell, Yoga Mat, Bodyweight, etc.) with multi-select support.
- [ ] Focus muscle expansion (Abs, Forearms, Glutes, Calves).
- [ ] Auto-advance on single-selection steps.
- [ ] Fix back button logic (ensure previous step navigation, not reset to step 1).

### 2. Home Screen Refinements
- [ ] Fix readiness score modal check-in loop (auto-close, do not repeat same day, save state).
- [ ] Automatically display session summaries after workout completions.
- [ ] Add share widgets (Share card, download images, WhatsApp/Instagram story mock integration).

### 3. Training Page Polish
- [ ] "Add Exercise" button with categories & anatomical muscle illustrations.
- [ ] Detailed exercise sections: Animated demonstration, text instructions, common mistakes, YouTube link.
- [ ] Fix workout history modal ghost overlays.
- [ ] Add custom exercise logger for external workouts.

### 4. Diet Page Reordering
- [ ] Place custom food logger: Hydration Tracker -> Custom Logger -> Meal Suggestions.
- [ ] Clean up suggestions to Breakfast, Lunch, Dinner, Snack (Max 4-5 suggestions).
- [ ] Detailed food card: Ingredients, steps, estimated cost, YouTube recipe search.
- [ ] Fix duplicate modal overlays.

### 5. Recovery Page Refactoring
- [x] Clean up empty/unused placeholder cards.
- [x] Spotify-style horizontal Brown Noise player (play, pause, timer, volume) below tools.
- [x] recovery indicators expansion (Mental load, recovery streak, mood check) using real user data.

### 6. Accountability & Leaderboard
- [x] Partner matching filters (Age, Goal, Country, Frequency, Discipline).
- [x] Squad friends options: Message, View Profile, Invite as Partner.
- [x] Detailed friend profiles displaying compatibility, streaking, recovery levels.
- [x] Comparison layout: You vs Partner metrics.
- [x] Replace placeholders with quick action alerts (workout/hydration check-in triggers).
- [x] Direct accountability invites to friends (skip stranger search).
- [x] Interactive leaderboard rows linking to profile & message center.

### 7. Global Modal System
- [x] Implement `GlobalModalManager` to guarantee a single modal instance is mounted and completely destroyed on close, preventing overlays leakage.
