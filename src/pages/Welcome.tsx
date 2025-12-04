import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import heroStudents from "@/assets/hero-students.jpg";

const Welcome = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      const name = session.user.user_metadata?.full_name || "Student";
      setUserName(name);
    };
    checkUser();
  }, [navigate]);

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${heroStudents})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="backdrop-blur-lg bg-card/90 rounded-3xl p-8 md:p-12 max-w-2xl text-center shadow-2xl animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Welcome, {userName}! 💫
        </h1>
        <p className="text-xl md:text-2xl text-foreground/80 mb-8">
          Welcome to EduGuide AI — Your Academic & Emotional Companion
        </p>
        <p className="text-lg text-muted-foreground mb-8">
          We're here to support you on your learning journey, help you achieve your goals, 
          and provide guidance when you need it most. Let's build something amazing together! 🌟
        </p>
        <Button 
          onClick={() => navigate("/dashboard")}
          size="lg"
          className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all transform hover:scale-105 text-lg px-8 py-6"
        >
          Enter Dashboard →
        </Button>
      </div>
    </div>
  );
};

export default Welcome;
