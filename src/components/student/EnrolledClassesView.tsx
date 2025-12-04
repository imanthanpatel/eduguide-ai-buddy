import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, Users, FileText, Megaphone, MessageSquare, ArrowRight, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ClassDetailsView from "./ClassDetailsView";

interface EnrolledClass {
  id: string;
  class_id: string;
  enrolled_at: string;
  classes: {
    name: string;
    section: string | null;
    subject: string | null;
    description: string | null;
    teacher_id: string | null;
  };
}

export default function EnrolledClassesView() {
  const navigate = useNavigate();
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedClassName, setSelectedClassName] = useState<string>("");

  useEffect(() => {
    loadEnrolledClasses();
  }, []);

  const loadEnrolledClasses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("class_enrollments")
        .select(`
          *,
          classes(name, section, subject, description, teacher_id)
        `)
        .eq("student_id", user?.id || "")
        .order("enrolled_at", { ascending: false });

      if (error) throw error;
      setEnrolledClasses(data || []);
    } catch (error: any) {
      toast.error("Error loading enrolled classes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassClick = (classId: string, className: string) => {
    setSelectedClassId(classId);
    setSelectedClassName(className);
  };

  const handleBack = () => {
    setSelectedClassId(null);
    setSelectedClassName("");
  };

  if (loading) return <div>Loading classes...</div>;

  // Show class details view if a class is selected
  if (selectedClassId) {
    return (
      <ClassDetailsView
        classId={selectedClassId}
        className={selectedClassName}
        onBack={handleBack}
      />
    );
  }

  return (
      <Card className="w-full">
        <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
            My Classes
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">Classes you are currently enrolled in</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        {enrolledClasses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>You are not enrolled in any classes yet.</p>
            <p className="text-sm mt-1">Contact your admin to get enrolled.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {enrolledClasses.map((enrollment, index) => {
              // Extract number from class name if available, otherwise use index + 1
              const classNumberMatch = enrollment.classes.name.match(/\d+/);
              const displayNumber = classNumberMatch ? classNumberMatch[0] : (index + 1).toString();
              
              return (
              <Card 
                key={enrollment.id} 
                className="hover:shadow-lg transition-shadow min-h-[380px] flex flex-col "
              >
                <CardHeader className="pb-6 px-8 pt-8 py-12 ">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-5">
                      <div className="text-6xl font-bold text-muted-foreground leading-none">
                        {displayNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-4">
                          {enrollment.classes.section && (
                            <Badge className="bg-primary text-primary-foreground text-sm px-4 py-1.5">
                              Section {enrollment.classes.section}
                            </Badge>
                          )}
                        </div>
                        {enrollment.classes.subject && (
                          <div className="text-lg mb-3">
                            <span className="font-semibold">Subject: </span>
                            <span>{enrollment.classes.subject}</span>
                          </div>
                        )}
                        {enrollment.classes.description && (
                          <p className="text-base text-muted-foreground mb-4 leading-relaxed">
                            {enrollment.classes.description}
                          </p>
                        )}
                        <div className="text-base text-muted-foreground">
                          Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate("/student-dashboard?tab=notifications")}>
                          <Megaphone className="h-4 w-4 mr-2" />
                          Class announcements
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/student-dashboard?tab=messages")}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Chat with teacher via Messages tab
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 px-8 pb-8 mt-auto">
                  <Button
                    variant="outline"
                    size="default"
                    className="w-full justify-between items-center h-12 text-base"
                    onClick={() => handleClassClick(enrollment.class_id, enrollment.classes.name)}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <span className="text-base justify-start text-left">View Resources <p>& Assignments</p></span>
                    </div>
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}