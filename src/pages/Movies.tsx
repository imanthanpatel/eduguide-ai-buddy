import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Film, ExternalLink } from "lucide-react";

const movies = [
  {
    id: 1,
    title: "3 Idiots",
    summary: "Three friends challenge the education system and find their own path to success",
    lesson: "True learning comes from passion, not pressure. Question everything and follow your dreams.",
    ageGroup: "Class 8+",
    poster: "🎓"
  },
  {
    id: 2,
    title: "Taare Zameen Par",
    summary: "A dyslexic child discovers his true potential with the help of an art teacher",
    lesson: "Every child is special. Learning difficulties don't define you - your unique talents do.",
    ageGroup: "Class 5+",
    poster: "🌟"
  },
  {
    id: 3,
    title: "The Pursuit of Happyness",
    summary: "A struggling salesman fights homelessness while raising his son",
    lesson: "Never give up on your dreams. Hard work and persistence can overcome any obstacle.",
    ageGroup: "Class 9+",
    poster: "💼"
  },
  {
    id: 4,
    title: "Dead Poets Society",
    summary: "An English teacher inspires students to seize the day and make their lives extraordinary",
    lesson: "Think for yourself. Challenge conformity. Make your life extraordinary.",
    ageGroup: "Class 10+",
    poster: "📖"
  },
  {
    id: 5,
    title: "Hidden Figures",
    summary: "African-American women mathematicians help NASA win the space race",
    lesson: "Intelligence and determination can break any barrier. Your background doesn't limit your future.",
    ageGroup: "Class 7+",
    poster: "🚀"
  },
  {
    id: 6,
    title: "October Sky",
    summary: "A coal miner's son pursues his dream of becoming a rocket scientist",
    lesson: "Dreams can come true when you combine passion with science and determination.",
    ageGroup: "Class 8+",
    poster: "🎯"
  }
];

const Movies = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              🎬 Motivational Movies
            </h1>
            <p className="text-sm text-muted-foreground">Films that inspire and teach</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {movies.map((movie, index) => (
            <Card 
              key={movie.id}
              className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in bg-gradient-to-br from-card to-card/50 overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="h-32 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <span className="text-6xl">{movie.poster}</span>
              </div>
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Film className="w-6 h-6 text-primary" />
                  <Badge variant="secondary">{movie.ageGroup}</Badge>
                </div>
                <CardTitle className="text-xl">{movie.title}</CardTitle>
                <CardDescription>{movie.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-accent/10 p-3 rounded-lg border-l-4 border-accent">
                  <p className="text-sm font-medium text-accent-foreground">What you'll learn:</p>
                  <p className="text-sm text-muted-foreground mt-1">{movie.lesson}</p>
                </div>
                <Button variant="outline" size="sm" className="w-full group">
                  Watch Trailer
                  <ExternalLink className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Movies;
