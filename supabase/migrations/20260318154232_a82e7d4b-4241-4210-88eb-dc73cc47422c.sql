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

CREATE TRIGGER trg_run_automation_engine
AFTER INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.trigger_run_automation_engine();