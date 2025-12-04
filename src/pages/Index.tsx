import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroStudents from "@/assets/hero-students.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${heroStudents})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="backdrop-blur-lg bg-card/90 rounded-3xl p-8 md:p-12 max-w-3xl text-center shadow-2xl animate-fade-in">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          EduGuide AI
        </h1>
        <p className="text-xl md:text-2xl text-foreground/90 mb-4">
          Your Academic & Emotional Companion 💫
        </p>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Get personalized academic predictions, chat with a supportive AI companion, 
          track your mood, set goals, and receive encouragement on your learning journey.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate("/auth")}
            size="lg"
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all transform hover:scale-105 text-lg px-8 py-6"
          >
            Get Started →
          </Button>
          <Button 
            onClick={() => navigate("/auth")}
            size="lg"
            variant="outline"
            className="text-lg px-8 py-6 backdrop-blur-sm"
          >
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
