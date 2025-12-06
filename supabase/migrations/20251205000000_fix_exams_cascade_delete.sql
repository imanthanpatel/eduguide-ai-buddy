-- Fix exams table foreign key to allow CASCADE delete when classes are deleted
-- This fixes the error: "update or delete on table 'classes' violates foreign key constraint 'exams_class_id_fkey'"

-- Find and drop the existing foreign key constraint (handles different constraint names)
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the foreign key constraint name
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.exams'::regclass
    AND confrelid = 'public.classes'::regclass
    AND contype = 'f'
    AND conkey::text = (SELECT array_agg(attnum ORDER BY attnum)::text
                       FROM pg_attribute
                       WHERE attrelid = 'public.exams'::regclass
                       AND attname = 'class_id');
    
    -- Drop the constraint if found
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.exams DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END IF;
END $$;

-- Recreate the foreign key constraint with ON DELETE CASCADE
ALTER TABLE public.exams
ADD CONSTRAINT exams_class_id_fkey
FOREIGN KEY (class_id)
REFERENCES public.classes(id)
ON DELETE CASCADE;

