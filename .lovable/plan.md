

## Analysis

The Dashboard code (`src/pages/Dashboard.tsx`) already correctly imports and renders the `RecentActivity` component:
- Line 6: `import RecentActivity from "@/components/dashboard/RecentActivity";`
- Line 114: `{selectedOrgId && <RecentActivity orgId={selectedOrgId} loading={loading} />}`

The network confirms a successful 200 response with 10 events. No console errors exist. The component and integration appear correct in code.

**Likely root cause**: The `loading` prop passed from Dashboard stays `true` during the stats fetch, and the `RecentActivity` component has its own internal `loading` state. Both must be `false` for events to display. If `selectedOrgId` is briefly `undefined` or there's a timing issue, the component may not render. Additionally, the `mb-14` spacing on Quick Actions and Stats sections pushes Recent Activity well below the fold.

## Plan

### 1. Ensure RecentActivity always renders when orgId exists
No code changes needed for the import/render — it's already correct. However, decouple the external loading state so the activity feed can show independently:
- Remove the `loading` prop dependency from Dashboard to `RecentActivity` — let the component manage its own loading state entirely
- This prevents the stats fetch from blocking activity display

### 2. Minor fix in RecentActivity
- Remove the `externalLoading` dependency from the render condition so the component fetches and displays independently
- Keep the internal `loading` state for its own skeleton UI

### 3. Verify rendering
- The component already fetches from `events` table, joins `profiles` for actor names, sorts by `created_at` desc, limits to 5, and formats relative timestamps — all requirements are met
- RLS policies are already in place (`Members can view org events`)

**Files to modify:**
- `src/pages/Dashboard.tsx` — remove the `loading` prop from `<RecentActivity>`
- `src/components/dashboard/RecentActivity.tsx` — simplify props to remove `externalLoading` dependency

This is a minimal, targeted fix. No new components or backend changes needed.

