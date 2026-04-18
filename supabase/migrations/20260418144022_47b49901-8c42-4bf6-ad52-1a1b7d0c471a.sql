-- Attach automation trigger to events table so new events automatically
-- create pending automation_logs AND invoke the process-automation-logs Edge Function.

DROP TRIGGER IF EXISTS events_run_automation_engine ON public.events;

CREATE TRIGGER events_run_automation_engine
AFTER INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.trigger_run_automation_engine();