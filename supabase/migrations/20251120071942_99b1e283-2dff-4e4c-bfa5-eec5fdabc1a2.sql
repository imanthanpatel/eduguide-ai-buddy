-- Create progress_tracker table
CREATE TABLE public.progress_tracker (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_day INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  study_done BOOLEAN NOT NULL DEFAULT false,
  homework_done BOOLEAN NOT NULL DEFAULT false,
  sleep_done BOOLEAN NOT NULL DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.progress_tracker ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view own progress" 
ON public.progress_tracker 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" 
ON public.progress_tracker 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" 
ON public.progress_tracker 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_progress_tracker_updated_at
BEFORE UPDATE ON public.progress_tracker
FOR EACH ROW
EXECUTE FUNCTION public.update_progress_updated_at();