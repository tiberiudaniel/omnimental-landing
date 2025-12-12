# Daily Path Engine – Manual QA

## Migration sanity check
1. Clear local storage and start the app in an incognito window so Firebase creates an anonymous session.
2. Complete at least three Daily Path sessions on three consecutive days (mock the date from the Firestore console if needed) and confirm that `dailyPractice` has one document per day for the anonymous UID stored in `OMNI_LAST_ANON_UID`.
3. Upgrade the same browser session to a full account (magic link or manual auth). In dev mode you should see the `[migrateAnonToUser]` console logs with the migration summary.
4. Inspect Firestore: the new UID must now have the same number of `dailyPractice` docs (or at least the last three) and the anonymous docs should remain untouched.
5. Launch the Daily Path again as the authenticated user — the engine should immediately offer a `deep` path because the streak/depth eligibility migrated.

## Soft path telemetry
1. Start a Daily Path that exposes the autonomy (“soft vs challenge”) node.
2. Choose the soft option once. Check the console for `[DailyPath] node_completed` with `xpDelta: 0` followed by `[DailyPath] completed` containing `pathVariant: "soft"`.
3. Verify in Firestore that the `dailyPractice` doc for the day stores `pathVariant = soft`, `nodesCompletedCount > 0`, and `durationSeconds` is populated.

## Config reset guard
1. Force a config change (e.g., toggle between two users or dev overrides) and watch Daily Path remount.
2. Ensure XP, node states, and the autonomy toggle reset instantly without requiring a manual refresh. If any state carries over, file a regression.
