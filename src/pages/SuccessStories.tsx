import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const stories = [
  {
    name: "Maya Chen",
    story: "Failed calculus twice, but didn't give up. Started studying 2 hours daily, joined study groups, and sought help when needed. Now she's a computer science major with a 3.8 GPA.",
    lesson: "Persistence and asking for help are not weaknesses—they're superpowers.",
  },
  {
    name: "James Rodriguez",
    story: "Struggled with anxiety during exams. Learned mindfulness techniques, improved sleep habits, and practiced self-compassion. Now manages stress effectively and performs confidently.",
    lesson: "Mental health is just as important as studying. Take care of yourself first.",
  },
  {
    name: "Aisha Patel",
    story: "Balanced family responsibilities with studies. Created a strict schedule, communicated her needs, and used every spare moment wisely. Graduated top of her class.",
    lesson: "Your circumstances don't define your potential. Hard work and smart planning do.",
  },
  {
    name: "Marcus Thompson",
    story: "Learning disability made reading difficult. Discovered audio learning, used assistive technology, and found his own learning style. Now pursuing a PhD in literature.",
    lesson: "Different doesn't mean less capable. Find what works for YOU.",
  },
];

const SuccessStories = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-success/5 p-4">
      <div className="container mx-auto max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-4">You're Not Alone 🌈</h1>
          <p className="text-xl text-muted-foreground">
            Real stories from students who overcame challenges
          </p>
        </div>

        <div className="grid gap-6">
          {stories.map((story, index) => (
            <Card
              key={story.name}
              className="shadow-xl bg-gradient-to-br from-card to-primary/5 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-4 text-primary">{story.name}</h3>
                <p className="text-foreground mb-4 leading-relaxed">{story.story}</p>
                <div className="p-4 bg-success/10 rounded-lg border-l-4 border-success">
                  <p className="font-semibold text-success-foreground">
                    💡 {story.lesson}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 shadow-xl bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Your Story Matters Too</h2>
            <p className="text-lg text-muted-foreground">
              Every challenge you overcome makes you stronger. Keep going, and one day 
              you'll inspire others with your journey. We believe in you! ✨
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuccessStories;
