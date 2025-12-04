import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, ExternalLink } from "lucide-react";

const tutors = [
  {
    category: "Programming",
    channels: [
      { name: "freeCodeCamp", url: "https://www.youtube.com/@freecodecamp", description: "Comprehensive programming tutorials" },
      { name: "Traversy Media", url: "https://www.youtube.com/@TraversyMedia", description: "Web development tutorials" },
      { name: "The Net Ninja", url: "https://www.youtube.com/@NetNinja", description: "Modern web development" },
    ],
  },
  {
    category: "Mathematics",
    channels: [
      { name: "3Blue1Brown", url: "https://www.youtube.com/@3blue1brown", description: "Beautiful math visualizations" },
      { name: "Khan Academy", url: "https://www.youtube.com/@khanacademy", description: "Complete math curriculum" },
      { name: "MathAntics", url: "https://www.youtube.com/@mathantics", description: "Simple math explanations" },
    ],
  },
  {
    category: "Science",
    channels: [
      { name: "CrashCourse", url: "https://www.youtube.com/@crashcourse", description: "All science subjects" },
      { name: "Kurzgesagt", url: "https://www.youtube.com/@kurzgesagt", description: "Science explained simply" },
      { name: "Veritasium", url: "https://www.youtube.com/@veritasium", description: "Science and engineering" },
    ],
  },
  {
    category: "Study Skills",
    channels: [
      { name: "Ali Abdaal", url: "https://www.youtube.com/@aliabdaal", description: "Productivity and study tips" },
      { name: "Thomas Frank", url: "https://www.youtube.com/@Thomasfrank", description: "College info and study strategies" },
      { name: "Study With Jess", url: "https://www.youtube.com/@studywithjess", description: "Study techniques" },
    ],
  },
];

const Tutors = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/5 p-4">
      <div className="container mx-auto max-w-6xl">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold mb-8 text-center">Curated Learning Resources 📚</h1>

        <div className="grid gap-8">
          {tutors.map((category) => (
            <div key={category.category}>
              <h2 className="text-2xl font-semibold mb-4">{category.category}</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {category.channels.map((channel) => (
                  <Card
                    key={channel.name}
                    className="hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => window.open(channel.url, "_blank")}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-lg">
                        {channel.name}
                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CardTitle>
                      <CardDescription>{channel.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tutors;
