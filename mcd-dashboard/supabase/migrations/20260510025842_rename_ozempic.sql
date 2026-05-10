DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND data_type IN ('text', 'character varying')
  LOOP
    EXECUTE format(
      'UPDATE public.%I SET %I = regexp_replace(%I, ''ozempic'', ''ozempuc'', ''gi'') WHERE %I ~* ''ozempic''',
      r.table_name, r.column_name, r.column_name, r.column_name
    );
  END LOOP;
END $$;
