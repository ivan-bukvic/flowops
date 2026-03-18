
-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Replace the trigger function to also call the edge function after creating pending logs
CREATE OR REPLACE FUNCTION public.trigger_run_automation_engine()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  _supabase_url text;
  _service_role_key text;
BEGIN
  -- Run the automation engine to create pending logs
  PERFORM public.run_automation_engine();

  -- Get Supabase URL and service role key from vault or config
  _supabase_url := current_setting('app.settings.supabase_url', true);
  _service_role_key := current_setting('app.settings.service_role_key', true);

  -- If settings not available, try direct values
  IF _supabase_url IS NULL OR _supabase_url = '' THEN
    _supabase_url := 'https://spkpebxbkbksyezdnjpq.supabase.co';
  END IF;

  -- Call the edge function to process pending logs asynchronously
  IF _service_role_key IS NOT NULL AND _service_role_key != '' THEN
    PERFORM net.http_post(
      url := _supabase_url || '/functions/v1/process-automation-logs',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _service_role_key
      ),
      body := '{}'::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$;
