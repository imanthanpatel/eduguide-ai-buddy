import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, ExternalLink, Calendar, MapPin } from "lucide-react";

const categories = ["All", "Science", "Language", "Arts", "Coding", "Math"];

const competitions = [
  {
    id: 1,
    name: "Science Olympiad (NSO)",
    category: "Science",
    mode: "Online",
    classes: "Class 1-12",
    period: "November-December",
    description: "Test your science knowledge against students nationwide",
    url: "#"
  },
  {
    id: 2,
    name: "International English Olympiad",
    category: "Language",
    mode: "Online & Offline",
    classes: "Class 1-12",
    period: "October-February",
    description: "Compete in English language proficiency and comprehension",
    url: "#"
  },
  {
    id: 3,
    name: "National Level Painting Competition",
    category: "Arts",
    mode: "Offline",
    classes: "Class 1-10",
    period: "August-September",
    description: "Showcase your artistic talent and creativity",
    url: "#"
  },
  {
    id: 4,
    name: "Code Quest Junior",
    category: "Coding",
    mode: "Online",
    classes: "Class 6-12",
    period: "Year-round",
    description: "Monthly coding challenges and hackathons for students",
    url: "#"
  },
  {
    id: 5,
    name: "Mathematics Olympiad (IMO)",
    category: "Math",
    mode: "Online & Offline",
    classes: "Class 1-12",
    period: "November-January",
    description: "Challenge yourself with advanced mathematical problems",
    url: "#"
  },
  {
    id: 6,
    name: "National Spell Bee",
    category: "Language",
    mode: "Offline",
    classes: "Class 1-8",
    period: "September-November",
    description: "Test your spelling prowess in this classic competition",
    url: "#"
  },
  {
    id: 7,
    name: "Science Fair Innovation",
    category: "Science",
    mode: "Offline",
    classes: "Class 6-12",
    period: "March-April",
    description: "Present your science project and innovative ideas",
    url: "#"
  },
  {
    id: 8,
    name: "Digital Art Challenge",
    category: "Arts",
    mode: "Online",
    classes: "Class 5-12",
    period: "Year-round",
    description: "Monthly digital art and design competitions",
    url: "#"
  }
];

const Competitions = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredCompetitions = selectedCategory === "All" 
    ? competitions 
    : competitions.filter(comp => comp.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              🧪 Competitions & Exams
            </h1>
            <p className="text-sm text-muted-foreground">Discover opportunities to showcase your talents</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-6 animate-fade-in">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="transition-all"
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompetitions.map((comp, index) => (
            <Card 
              key={comp.id}
              className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in bg-gradient-to-br from-card to-card/50"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Trophy className="w-8 h-8 text-primary" />
                  <Badge variant="secondary">{comp.category}</Badge>
                </div>
                <CardTitle className="text-lg">{comp.name}</CardTitle>
                <CardDescription>{comp.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{comp.mode}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{comp.period}</span>
                  </div>
                  <Badge variant="outline">{comp.classes}</Badge>
                </div>
                <Button variant="outline" size="sm" className="w-full group">
                  Learn More
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

export default Competitions;
