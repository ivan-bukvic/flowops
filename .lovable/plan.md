

## Plan: Update Edge Function URL references

Replace `execute-automations` with `process-automation-logs` in two files:

### 1. `src/lib/triggerAutomations.ts` (line 3)
Update the `EDGE_FUNCTION_URL` constant.

### 2. `src/pages/Automations.tsx` (line ~49)
Update the hardcoded URL in `handleExecuteAutomations`.

No other changes — headers, auth, and logic stay the same.

