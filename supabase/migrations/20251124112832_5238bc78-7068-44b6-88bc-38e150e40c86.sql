-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, class_id, date)
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  teacher_id UUID NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL,
  user_id UUID,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  report_url TEXT,
  report_data JSONB,
  generated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Attendance policies
CREATE POLICY "Teachers can manage attendance for their classes"
  ON public.attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.classes 
      WHERE classes.id = attendance.class_id 
      AND classes.teacher_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Students can view own attendance"
  ON public.attendance FOR SELECT
  USING (auth.uid() = student_id);

-- Announcements policies
CREATE POLICY "Teachers can manage own announcements"
  ON public.announcements FOR ALL
  USING (auth.uid() = teacher_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view class announcements"
  ON public.announcements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments 
      WHERE class_enrollments.class_id = announcements.class_id 
      AND class_enrollments.student_id = auth.uid()
    )
  );

-- Reports policies
CREATE POLICY "Admins and teachers can manage reports"
  ON public.reports FOR ALL
  USING (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'teacher')
  );

CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Add trigger for announcements updated_at
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_announcements_updated_at();