
## Investigation

Route in `src/App.tsx`:
```tsx
<Route path="/projects/:projectId" element={<OrgPage><ProjectDetail /></OrgPage>} />
```

Only one route matches `/projects/:projectId` and it renders `ProjectDetail` from `./pages/ProjectDetail`. There is no other component registered for that path, no duplicate route, and no alternate router.

So `ProjectDetail.tsx` IS the component rendered for both internal navigation and direct Slack URL loads. The debug `<pre>` was correctly added there.

### Why the debug line may "not appear" via Slack
`ProjectDetail` is wrapped in `<OrgPage>` = `AuthenticatedLayout` + `RequireOrg`. On a cold Slack load:
- `AuthenticatedLayout` likely shows a loading state until `AuthContext` hydrates and redirects unauthenticated users to `/login`.
- `RequireOrg` redirects to `/create-workspace` if `selectedOrgId` is null.
- `ProjectDetail` itself returns an early "Loading..." (or null) while `authLoading` / `!project` — so the `<pre>` block, which sits inside the loaded view, never renders.

The user is therefore never actually seeing `ProjectDetail`'s rendered body — they're being bounced by a guard before the project ever loads. That's the real bug, not a wrong component.

## Plan

1. Verify routing one more time in default mode and read `RequireAuth`/`RequireOrg`/`AuthenticatedLayout` to confirm which guard short-circuits on direct Slack load.
2. Add a top-level always-visible debug banner in `ProjectDetail.tsx` placed BEFORE any early returns (above the `if (loading) return ...` guards), so we can confirm whether the component mounts at all on Slack load. Banner shows: `authLoading`, `hasSession`, `userId`, `projectId`, `selectedOrgId`, `loading`, `project?.id`, `project?.profiles`.
3. Also add the same banner inside `RequireOrg` (just before its redirect) so we can see if the redirect is what's swallowing the page.
4. Report back which guard fires on Slack load, then fix the actual root cause (likely `RequireOrg` redirecting before project-driven `setSelectedOrgId` runs — because `RequireOrg` blocks `ProjectDetail` from ever mounting, so the project fetch that would set the org never executes).

## Likely real fix (after confirmation)
Allow `/projects/:projectId` to mount without `RequireOrg`, OR have `RequireOrg` skip its redirect on project/document detail routes so `ProjectDetail` can fetch the project and hydrate `selectedOrgId` itself.

## Files to touch
- `src/pages/ProjectDetail.tsx` — add unconditional debug banner above early returns
- `src/components/RequireOrg.tsx` — add debug log + temporary banner before redirect
