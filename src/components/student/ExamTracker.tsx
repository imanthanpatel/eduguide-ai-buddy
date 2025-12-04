import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface Exam {
  id: string;
  title: string;
  subject: string;
  date: string;
  time: string | null;
  duration_minutes: number | null;
  total_marks: number | null;
  syllabus: string | null;
  class_id: string;
}

export default function ExamTracker() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExams();
    
    const channel = supabase
      .channel('exams-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, loadExams)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadExams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get student's enrolled classes
      const { data: enrollments } = await supabase
        .from("class_enrollments")
        .select("class_id")
        .eq("student_id", user?.id || "");

      if (!enrollments || enrollments.length === 0) {
        setExams([]);
        setLoading(false);
        return;
      }

      const classIds = enrollments.map(e => e.class_id);

      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .in("class_id", classIds)
        .gte("date", new Date().toISOString().split('T')[0])
        .order("date", { ascending: true });

      if (error) throw error;
      setExams(data || []);
    } catch (error: any) {
      toast.error("Error loading exams");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntil = (examDate: string) => {
    const today = new Date();
    const exam = new Date(examDate);
    const diffTime = exam.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyBadge = (days: number) => {
    if (days <= 3) return <Badge variant="destructive">Urgent</Badge>;
    if (days <= 7) return <Badge variant="default">This Week</Badge>;
    return <Badge variant="secondary">Upcoming</Badge>;
  };

  if (loading) return <div>Loading exams...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Exams
        </CardTitle>
        <CardDescription>Track your exam schedule</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {exams.map((exam) => {
              const daysUntil = getDaysUntil(exam.date);
              return (
                <Card key={exam.id} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{exam.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <BookOpen className="h-3 w-3" />
                          {exam.subject}
                        </CardDescription>
                      </div>
                      {getUrgencyBadge(daysUntil)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(exam.date).toLocaleDateString()}</span>
                      <span className="text-muted-foreground">({daysUntil} days)</span>
                    </div>
                    
                    {exam.time && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{exam.time}</span>
                        {exam.duration_minutes && (
                          <span className="text-muted-foreground">
                            ({exam.duration_minutes} mins)
                          </span>
                        )}
                      </div>
                    )}

                    {exam.total_marks && (
                      <div className="text-sm">
                        <span className="font-semibold">Total Marks:</span> {exam.total_marks}
                      </div>
                    )}

                    {exam.syllabus && (
                      <div className="text-sm mt-2">
                        <span className="font-semibold">Syllabus:</span>
                        <p className="text-muted-foreground whitespace-pre-wrap mt-1">
                          {exam.syllabus}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            
            {exams.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No upcoming exams scheduled</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}