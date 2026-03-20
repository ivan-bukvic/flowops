

## Plan: Make "Create Automation" Button Always Appear Active

**Current state**: The button has `disabled={creating || !isValid()}` which applies `disabled:opacity-40 disabled:shadow-none`, making it look faded when form fields are incomplete.

**Changes** (single file: `src/components/automations/AutomationRuleBuilder.tsx`, lines 306-312):

1. Remove `disabled` prop entirely (keep `creating` guard in `onClick` handler instead)
2. Remove `disabled:opacity-40 disabled:shadow-none` classes
3. Keep all hover/active effects intact
4. Update `onClick` to early-return if `creating` or `!isValid()` so behavior is preserved without visual disabling

