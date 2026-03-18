
-- Store the service role key reference for pg_net calls
-- Read it from vault secrets where it's already stored
CREATE OR REPLACE FUNCTION public.trigger_run_automation_engine()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  _service_role_key text;
BEGIN
  -- Run the automation engine to create pending logs
  PERFORM public.run_automation_engine();

  -- Read service role key from vault
  SELECT decrypted_secret INTO _service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
  LIMIT 1;

  -- Call the edge function to process pending logs asynchronously via pg_net
  IF _service_role_key IS NOT NULL AND _service_role_key != '' THEN
    PERFORM net.http_post(
      url := 'https://spkpebxbkbksyezdnjpq.supabase.co/functions/v1/process-automation-logs',
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
