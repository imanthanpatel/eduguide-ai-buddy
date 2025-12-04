-- Create exams table for admin to manage exams
CREATE TABLE IF NOT EXISTS public.exams (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  subject text NOT NULL,
  date date NOT NULL,
  time time,
  duration_minutes integer,
  total_marks integer,
  syllabus text,
  class_id uuid REFERENCES public.classes(id),
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- Students can view exams for their enrolled classes
CREATE POLICY "Students can view class exams"
ON public.exams
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM class_enrollments
    WHERE class_enrollments.class_id = exams.class_id
    AND class_enrollments.student_id = auth.uid()
  )
);

-- Teachers and admins can manage exams
CREATE POLICY "Teachers and admins can manage exams"
ON public.exams
FOR ALL
USING (
  has_role(auth.uid(), 'teacher'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create trigger for updated_at
CREATE TRIGGER update_exams_updated_at
BEFORE UPDATE ON public.exams
FOR EACH ROW
EXECUTE FUNCTION public.update_announcements_updated_at();