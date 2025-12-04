import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2 } from "lucide-react";

const TeacherPending = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkApprovalStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if already approved and in teachers table
      const { data: teacherData } = await supabase
        .from("teachers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (teacherData) {
        navigate("/teacher-dashboard");
        return;
      }

      // Check if request is still pending
      const { data: requestData } = await supabase
        .from("teacher_requests")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

      if (!requestData) {
        // No pending request, might be rejected or not submitted
        navigate("/auth");
      }
    };

    checkApprovalStatus();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Clock className="h-16 w-16 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-3xl">Application Under Review</CardTitle>
          <CardDescription className="text-lg mt-2">
            Thank you for your interest in joining EduGuide AI as a teacher!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-6 rounded-lg space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold">Request Submitted Successfully</h3>
                <p className="text-sm text-muted-foreground">
                  Your teacher application has been received by our admin team
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold">Under Admin Review</h3>
                <p className="text-sm text-muted-foreground">
                  Our administrators are currently reviewing your application
                </p>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <h4 className="font-semibold mb-2">What happens next?</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Admin will review your qualifications and experience</li>
              <li>• You will receive a notification once approved</li>
              <li>• After approval, you can access the Teacher Dashboard</li>
              <li>• This usually takes 24-48 hours</li>
            </ul>
          </div>

          <div className="flex justify-center pt-4">
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherPending;
