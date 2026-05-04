## Problem

In `src/pages/Landing.tsx`, the `ProductSection` uses a fixed grid template `lg:grid-cols-[4fr_8fr]` (text = 4fr, image = 8fr). When `reverse={true}` is passed (for "Event-driven automations" and "Connect your tools"), only the DOM order is swapped via `lg:[&>div:first-child]:order-2`, but the grid columns themselves are NOT swapped.

Result:
- Reversed sections place the **image** into the **4fr (small)** column and the **text** into the **8fr (large)** column.
- That's why those two screenshots render visibly smaller than the non-reversed ones.

## Fix

Swap the grid template based on the `reverse` flag so the image column is always the wide one (8fr), regardless of left/right placement.

In `ProductSection`:

- Replace the fixed `lg:grid-cols-[4fr_8fr]` with a conditional:
  - default: `lg:grid-cols-[4fr_8fr]` (text left / image right)
  - reverse: `lg:grid-cols-[8fr_4fr]` (image left / text right)
- Remove the `order-2` hack since column order now naturally matches DOM order.
- Keep markup order as `<text>` then `<ImageFrame>` for both cases (works because the grid template defines which column is wide).

Wait - to keep image visually on the left when `reverse`, we need image first in DOM. Cleaner approach: render `<ImageFrame>` first when reversed, and use `lg:grid-cols-[8fr_4fr]` so the first (image) column is the wide one.

### Concrete change

```tsx
const ProductSection = ({ title, text, image, alt, reverse = false }) => {
  const textBlock = (
    <div>
      <h3 className="...">{title}</h3>
      <p className="...">{text}</p>
    </div>
  );
  const imageBlock = <ImageFrame src={image} alt={alt} />;

  return (
    <div
      className={`grid grid-cols-1 gap-12 lg:gap-20 items-center ${
        reverse ? "lg:grid-cols-[8fr_4fr]" : "lg:grid-cols-[4fr_8fr]"
      }`}
    >
      {reverse ? (
        <>
          {imageBlock}
          {textBlock}
        </>
      ) : (
        <>
          {textBlock}
          {imageBlock}
        </>
      )}
    </div>
  );
};
```

This guarantees the image column is always 8fr and all four product screenshots render at the same large size.

## Files

- `src/pages/Landing.tsx` - update `ProductSection` only.
