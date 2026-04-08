

## Fix Trigger Dropdown in Automation Builder

### Problem
The current `TRIGGER_MAP` contains "Member Added" which is ambiguous/duplicate alongside "Project Member Added". The mapping also lacks some valid trigger types.

### Changes

**File: `src/components/automations/AutomationRuleBuilder.tsx`**

Replace the current `TRIGGER_MAP` and `TRIGGER_LABELS` with a clean, direct mapping:

```ts
const TRIGGER_OPTIONS = [
  { label: "Project Created", value: "PROJECT_CREATED" },
  { label: "Project Updated", value: "PROJECT_UPDATED" },
  { label: "Project Deleted", value: "PROJECT_DELETED" },
  { label: "Project Member Added", value: "PROJECT_MEMBER_ADDED" },
  { label: "Project Member Removed", value: "PROJECT_MEMBER_REMOVED" },
  { label: "Workspace Created", value: "WORKSPACE_CREATED" },
];
```

- Remove `TRIGGER_MAP` and `TRIGGER_LABELS` constants entirely
- Update the trigger `<Select>` to use `value` directly (no label-to-value lookup needed)
- Update `handleCreate` to send `trigger` directly as `trigger_type` (since the state now stores the exact database value)
- Update the dropdown to render `TRIGGER_OPTIONS` with `option.value` as the select value and `option.label` as display text

This eliminates the indirect label→value mapping pattern and ensures exact database values are used with zero transformation.

