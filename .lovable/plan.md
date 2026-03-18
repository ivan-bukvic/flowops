

## Plan: Auto-trigger automation engine on event insert

**Problem**: `run_automation_engine()` only runs when manually invoked. Events don't automatically generate automation logs.

**Solution**: Create a Postgres trigger on the `events` table that calls `run_automation_engine()` after every `INSERT`.

### Implementation

One migration file with:

1. A trigger function wrapper:
```sql
CREATE OR REPLACE FUNCTION public.trigger_run_automation_engine()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.run_automation_engine();
  RETURN NEW;
END;
$$;
```

2. An `AFTER INSERT` trigger on `events`:
```sql
CREATE TRIGGER trg_run_automation_engine
AFTER INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.trigger_run_automation_engine();
```

### Result

The flow becomes: `emit_event()` inserts into `events` → trigger fires → `run_automation_engine()` matches new event against rules → `automation_logs` rows created → Activity UI shows data on next load.

No UI or schema changes needed. No new tables or columns.

