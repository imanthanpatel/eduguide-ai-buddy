-- Add updated_at column to profiles table
-- This fixes the "Could not find the 'updated_at' column of 'profiles' in the schema cache" error

-- Add the updated_at column to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have a value for updated_at
UPDATE public.profiles 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create a trigger to automatically update the updated_at column on update
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();