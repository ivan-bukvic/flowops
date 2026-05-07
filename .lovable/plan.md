## Add vercel.json for Vercel SPA Routing

### Overview
Create a `vercel.json` configuration file at the project root to enable SPA (Single Page Application) routing when deploying to Vercel. This ensures all client-side routes (e.g., `/landing`, `/dashboard`, `/automations`) resolve to `index.html`, preventing 404 errors on page refresh or direct navigation.

### Implementation
1. Create `vercel.json` at the project root with a `rewrites` array.
2. Add a catch-all rewrite rule: any path not matching a static file (`source: "/((?!.*\\.).*)")` or similar) rewrites to `/index.html`.

### Technical Details
- The project uses `BrowserRouter` from `react-router-dom` in `src/App.tsx`.
- Vercel's static deployments serve files directly; without a rewrite, a request to `/landing` would look for a `landing.html` file and return 404.
- A single rewrite rule handles all React Router routes cleanly.

### Output
- New file: `vercel.json`
