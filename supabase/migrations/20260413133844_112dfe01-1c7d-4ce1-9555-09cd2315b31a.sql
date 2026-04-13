
-- Update any existing documents with 'completed' status to 'uploaded'
UPDATE public.documents SET processing_status = 'uploaded' WHERE processing_status = 'completed';

-- Update any existing documents with 'retry' status to 'processing'
UPDATE public.documents SET processing_status = 'processing' WHERE processing_status = 'retry';

-- Recreate the enum without 'completed' and 'retry'
ALTER TYPE public.document_status RENAME TO document_status_old;

CREATE TYPE public.document_status AS ENUM ('uploaded', 'processing', 'failed');

ALTER TABLE public.documents
  ALTER COLUMN processing_status DROP DEFAULT,
  ALTER COLUMN processing_status TYPE public.document_status USING processing_status::text::public.document_status,
  ALTER COLUMN processing_status SET DEFAULT 'uploaded'::public.document_status;

DROP TYPE public.document_status_old;
