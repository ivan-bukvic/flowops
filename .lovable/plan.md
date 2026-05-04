## Goal

Make the feature image frames on the landing page (Product, Automations, Activity, Integrations) use the exact same focused-border treatment as the Message textarea in the Automation Builder — a solid blue border with a soft blue outer ring (the "double-ring" look in the screenshot).

## Problem

The current `ImageFrame` in `src/pages/Landing.tsx` uses a thin 1px border and a faint ring, plus a nested inner card with its own border. This doesn't match the focused textarea in the automation builder, which shows a clearly visible blue border with a noticeable blue ring around it.

## Changes

**File: `src/pages/Landing.tsx` (`ImageFrame` component, ~lines 43-84)**

1. Remove the nested inner card wrapper — keep a single frame so the blue border reads cleanly (like the textarea, which is one element).
2. Replace the border/ring classes with:
   - Default (in view): `border-2 border-blue-500 ring-2 ring-blue-500/30 shadow-md`
   - Pre-scroll: `border-2 border-gray-200 shadow-sm`
   - Hover: `hover:border-blue-500 hover:ring-2 hover:ring-blue-500/30 hover:shadow-md`
3. Keep `transition-all duration-300 ease-out` and the IntersectionObserver scroll trigger.
4. Keep `rounded-xl`, white background, and the 16:10 image aspect.

## Result

All four feature visuals will display the same blue focused-border + soft ring effect seen on the automation message textarea, applied on scroll-in and on hover, with smooth transitions.
