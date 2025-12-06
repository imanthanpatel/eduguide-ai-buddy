-- Fix exams table foreign key to allow CASCADE delete when classes are deleted
-- Run this SQL directly in your Supabase dashboard SQL editor if the migration didn't work

-- Drop the existing foreign key constraint (try common constraint names)
ALTER TABLE public.exams
DROP CONSTRAINT IF EXISTS exams_class_id_fkey;

-- Also try dropping by finding the actual constraint name
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the foreign key constraint name that references classes
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.exams'::regclass
    AND confrelid = 'public.classes'::regclass
    AND contype = 'f';
    
    -- Drop the constraint if found
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.exams DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No foreign key constraint found';
    END IF;
END $$;

-- Recreate the foreign key constraint with ON DELETE CASCADE
ALTER TABLE public.exams
ADD CONSTRAINT exams_class_id_fkey
FOREIGN KEY (class_id)
REFERENCES public.classes(id)
ON DELETE CASCADE;

