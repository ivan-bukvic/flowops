

## Adjust Horizontal Separators

### What's happening now
There are no explicit `<Separator>` elements — the visible lines come from the color boundary between `bg-card` (header) and `bg-background` (content), and the sidebar's default right border. These extend edge-to-edge.

### Changes

**1. `src/components/layout/AppSidebar.tsx`** — Add a subtle separator after the logo area (line 85):
- Add a `<Separator>` with `mx-5 opacity-30` (horizontal margin ~20px, very faint)

**2. `src/components/layout/TopNav.tsx`** — Add a subtle separator at the bottom of the header (line 99):
- Add a `<Separator>` with `mx-6 opacity-30` (horizontal margin ~24px, very faint)

Both separators will use the existing `bg-border` color but at reduced opacity, with `mx-5`/`mx-6` margins so they don't touch the sides. The `Separator` import already exists in both files.

