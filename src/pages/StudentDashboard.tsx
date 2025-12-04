import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NotificationsView from "@/components/student/NotificationsView";
import ExamTracker from "@/components/student/ExamTracker";
import EnrolledClassesView from "@/components/student/EnrolledClassesView";
import MessagingSystem from "@/components/shared/MessagingSystem";
import { LogOut, User, Bell, Calendar, MessageSquare, Target, BookOpen, GraduationCap } from "lucide-react";
import { toast } from "sonner";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    checkAuth();
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      setUserName(profile?.full_name || user.user_metadata?.full_name || "Student");
    } catch (error: any) {
      toast.error("Error loading dashboard");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/student-dashboard")}
                className="hover:bg-primary/10 h-8 w-8 sm:h-10 sm:w-10"
                title="Go to Student Dashboard"
              >
                <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </Button>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
                EduGuide AI - Student Portal
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">Hello, {userName}!</span>
              <span className="text-xs sm:hidden text-muted-foreground">Hi, {userName.split(' ')[0]}!</span>
              <Button variant="outline" size="sm" onClick={() => navigate("/profile")} className="flex-1 sm:flex-initial text-xs sm:text-sm">
                <User className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")} className="flex-1 sm:flex-initial text-xs sm:text-sm">
                <span className="hidden sm:inline">All Features</span>
                <span className="sm:hidden">Features</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="flex-1 sm:flex-initial text-xs sm:text-sm">
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <TabsList className="grid w-full min-w-[500px] sm:min-w-0 grid-cols-5 lg:w-auto lg:inline-flex">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">
                <Target className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="classes" className="text-xs sm:text-sm">
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">My Classes</span>
                <span className="sm:hidden">Classes</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs sm:text-sm">
                <Bell className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Notifications</span>
                <span className="sm:hidden">Alerts</span>
              </TabsTrigger>
              <TabsTrigger value="exams" className="text-xs sm:text-sm">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Exams</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="text-xs sm:text-sm">
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Messages</span>
                <span className="sm:hidden">Chat</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <EnrolledClassesView />
              <div className="space-y-6">
                <ExamTracker />
                <NotificationsView />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="classes">
            <EnrolledClassesView />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsView />
          </TabsContent>

          <TabsContent value="exams">
            <ExamTracker />
          </TabsContent>

          <TabsContent value="messages">
            <MessagingSystem />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;