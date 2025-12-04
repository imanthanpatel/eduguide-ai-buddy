import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Target, Bot, BookOpen, MessageCircle, Brain, 
  Heart, TrendingUp, Star, Award, Lightbulb, 
  MessageSquare, Users, LogOut, Trophy, User, School, ClipboardCheck
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserName(session.user.user_metadata?.full_name || "Student");
    };
    checkUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const features = [
    { icon: School, title: "Classroom", description: "Access your classes, resources & assignments", path: "/student-dashboard", color: "text-primary" },
    { icon: ClipboardCheck, title: "Attendance", description: "View your attendance records", path: "/attendance", color: "text-primary" },
    { icon: Target, title: "Predict Marks", description: "AI-powered performance prediction", path: "/predict", color: "text-primary" },
    { icon: Bot, title: "AI Guide", description: "Chat with your supportive companion", path: "/guide", color: "text-secondary" },
    { icon: BookOpen, title: "Tutors", description: "Curated learning resources", path: "/tutors", color: "text-accent" },
    { icon: MessageCircle, title: "Motivated Message", description: "Daily encouragement", path: "/motivation", color: "text-success" },
    { icon: Brain, title: "Mood Check-In", description: "Track your emotional wellbeing", path: "/mood", color: "text-warning" },
    { icon: Heart, title: "You're Not Alone", description: "Inspiring success stories", path: "/stories", color: "text-primary" },
    { icon: Award, title: "Goal Journal", description: "Set and track your goals", path: "/goals", color: "text-secondary" },
    { icon: TrendingUp, title: "Progress Tracker", description: "Candy Crush style journey", path: "/progress-tracker", color: "text-accent" },
    { icon: Star, title: "Achievements", description: "Badges & certificates", path: "/achievements", color: "text-success" },
    { icon: Lightbulb, title: "Study Tips", description: "Smart learning strategies", path: "/tips", color: "text-warning" },
    { icon: MessageSquare, title: "Feedback", description: "Share your thoughts", path: "/feedback", color: "text-primary" },
    { icon: Users, title: "AI Friend Mode", description: "Your comforting companion", path: "/friend", color: "text-secondary" },
    { icon: BookOpen, title: "Valuable Books", description: "Life-improving books", path: "/books", color: "text-primary" },
    { icon: Brain, title: "Motivational Movies", description: "Films that inspire", path: "/movies", color: "text-secondary" },
    { icon: Trophy, title: "Competitions", description: "Online & offline contests", path: "/competitions", color: "text-accent" },
    { icon: Brain, title: "Puzzle Games", description: "Brain & IQ boosters", path: "/puzzles", color: "text-warning" },
    { icon: Brain, title: "IQ & GK Quiz", description: "Test your knowledge", path: "/quiz", color: "text-primary" },
    { icon: Target, title: "Career Planning", description: "Chat with career mentor", path: "/career-planning", color: "text-secondary" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              EduGuide AI
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <span className="text-sm sm:text-base text-muted-foreground hidden sm:inline">Hello, {userName}!</span>
              <span className="text-xs sm:hidden text-muted-foreground">Hi, {userName.split(' ')[0]}!</span>
              <Button variant="outline" size="sm" onClick={() => navigate("/profile")} className="flex-1 sm:flex-initial">
                <User className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="flex-1 sm:flex-initial">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8 text-center animate-fade-in">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Your Learning Hub 🚀</h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg px-2">Choose a feature to get started on your journey</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <Card 
              key={feature.path}
              className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-card to-card/50 animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => navigate(feature.path)}
            >
              <CardHeader>
                <feature.icon className={`w-8 h-8 mb-2 ${feature.color}`} />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
