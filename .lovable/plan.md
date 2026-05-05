## Problem

The four landing sections (Product, Automations, Activity, Integrations) are invisible because their initial state uses `translateX(100vw)` / `translateX(-100vw)` — moving the elements completely offscreen. The IntersectionObserver is attached to the same element being transformed, so it never reports as intersecting the viewport, and `visible` never flips to `true`.

Also: `overflow-x: hidden` on the parent section combined with offscreen children silently clips them, hiding the issue visually.

## Fix

In `src/pages/Landing.tsx`, split the `ProductSection` into two elements:

1. An **outer wrapper** (no transform) that holds the `ref` for the IntersectionObserver — this stays in normal layout flow so the observer can detect when it enters the viewport.
2. An **inner animated child** that receives the `opacity` + `translateX` + `scale` styles.

Concretely, change the return JSX from a single `<div>` carrying both `ref` and `style` into:

```tsx
<div id={id} ref={ref} className="scroll-mt-24">
  <div style={wrapperStyle} className="grid ...">
    {/* text + image blocks */}
  </div>
</div>
```

This keeps the observer target on-screen while still animating the visible content from the viewport edges. The `overflow-x-hidden` already on the parent `<section>` will continue to prevent horizontal scrollbars from the off-screen starting position.

No other changes needed — direction alternation, 100ms stagger, 700ms cubic-bezier easing, and one-time trigger remain intact.
