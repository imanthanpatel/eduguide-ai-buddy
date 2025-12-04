-- Fix foreign key constraints for classes table to allow NULL values properly
-- This addresses the issue where empty strings were being inserted instead of NULL values

-- First, we need to update any existing records that might have empty strings
-- Since teacher_id is a UUID, we need to check for records where the column might be improperly set
-- We'll use a safer approach by checking for NULL values in related auth.users table

-- Update classes table to ensure proper NULL values for teacher_id
UPDATE public.classes 
SET teacher_id = NULL 
WHERE teacher_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = classes.teacher_id
);

-- Update classes table to ensure proper NULL values for created_by
UPDATE public.classes 
SET created_by = NULL 
WHERE created_by IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = classes.created_by
);

-- Update resources table to ensure proper NULL values for uploaded_by
UPDATE public.resources 
SET uploaded_by = NULL 
WHERE uploaded_by IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = resources.uploaded_by
);

-- Update resources table to ensure proper NULL values for class_id
UPDATE public.resources 
SET class_id = NULL 
WHERE class_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM public.classes c WHERE c.id = resources.class_id
);

-- Update exams table to ensure proper NULL values for class_id
UPDATE public.exams 
SET class_id = NULL 
WHERE class_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM public.classes c WHERE c.id = exams.class_id
);

-- Update exams table to ensure proper NULL values for created_by
UPDATE public.exams 
SET created_by = NULL 
WHERE created_by IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = exams.created_by
);

-- Add a check constraint to prevent invalid UUID values in foreign key columns
-- Note: We can't directly check for empty strings on UUID columns, so we ensure they're either valid UUIDs or NULL
ALTER TABLE public.classes 
ADD CONSTRAINT chk_teacher_id_valid 
CHECK (teacher_id IS NULL OR LENGTH(teacher_id::TEXT) = 36);

ALTER TABLE public.classes 
ADD CONSTRAINT chk_created_by_valid 
CHECK (created_by IS NULL OR LENGTH(created_by::TEXT) = 36);

-- Add similar constraints to other tables
ALTER TABLE public.resources 
ADD CONSTRAINT chk_uploaded_by_valid 
CHECK (uploaded_by IS NULL OR LENGTH(uploaded_by::TEXT) = 36);

ALTER TABLE public.resources 
ADD CONSTRAINT chk_resources_class_id_valid 
CHECK (class_id IS NULL OR LENGTH(class_id::TEXT) = 36);

ALTER TABLE public.exams 
ADD CONSTRAINT chk_exams_class_id_valid 
CHECK (class_id IS NULL OR LENGTH(class_id::TEXT) = 36);

ALTER TABLE public.exams 
ADD CONSTRAINT chk_exams_created_by_valid 
CHECK (created_by IS NULL OR LENGTH(created_by::TEXT) = 36);