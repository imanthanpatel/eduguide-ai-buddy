import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen } from "lucide-react";

const tags = ["All", "Habits", "Mindset", "Motivation", "Focus", "Productivity"];

const books = [
  {
    id: 1,
    title: "Atomic Habits",
    author: "James Clear",
    description: "Tiny changes that create remarkable results",
    value: "Learn how small habits compound into extraordinary achievements over time",
    ageGroup: "Class 8-12",
    tags: ["Habits", "Productivity"]
  },
  {
    id: 2,
    title: "Mindset",
    author: "Carol S. Dweck",
    description: "The new psychology of success",
    value: "Develop a growth mindset and believe in your ability to learn and improve",
    ageGroup: "Class 6-12",
    tags: ["Mindset", "Motivation"]
  },
  {
    id: 3,
    title: "Deep Work",
    author: "Cal Newport",
    description: "Rules for focused success in a distracted world",
    value: "Master the art of concentration and eliminate distractions for better learning",
    ageGroup: "Class 9-12",
    tags: ["Focus", "Productivity"]
  },
  {
    id: 4,
    title: "The 7 Habits of Highly Effective Teens",
    author: "Sean Covey",
    description: "The ultimate teenage success guide",
    value: "Build character, self-confidence, and life skills for teenage years",
    ageGroup: "Class 8-10",
    tags: ["Habits", "Mindset"]
  },
  {
    id: 5,
    title: "Grit",
    author: "Angela Duckworth",
    description: "The power of passion and perseverance",
    value: "Understand how persistence and passion lead to long-term success",
    ageGroup: "Class 7-12",
    tags: ["Motivation", "Mindset"]
  },
  {
    id: 6,
    title: "Make It Stick",
    author: "Peter C. Brown",
    description: "The science of successful learning",
    value: "Learn evidence-based study techniques that actually work",
    ageGroup: "Class 6-12",
    tags: ["Focus", "Productivity"]
  }
];

const Books = () => {
  const navigate = useNavigate();
  const [selectedTag, setSelectedTag] = useState("All");

  const filteredBooks = selectedTag === "All" 
    ? books 
    : books.filter(book => book.tags.includes(selectedTag));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              📚 Valuable Books
            </h1>
            <p className="text-sm text-muted-foreground">Life-improving books for students</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-6 animate-fade-in">
          {tags.map((tag) => (
            <Button
              key={tag}
              variant={selectedTag === tag ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTag(tag)}
              className="transition-all"
            >
              {tag}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book, index) => (
            <Card 
              key={book.id}
              className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in bg-gradient-to-br from-card to-card/50"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <BookOpen className="w-8 h-8 text-primary" />
                  <Badge variant="secondary">{book.ageGroup}</Badge>
                </div>
                <CardTitle className="text-xl">{book.title}</CardTitle>
                <CardDescription className="text-muted-foreground">by {book.author}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{book.description}</p>
                <div className="bg-primary/5 p-3 rounded-lg border-l-4 border-primary">
                  <p className="text-sm font-medium text-primary">Why it's valuable:</p>
                  <p className="text-sm text-muted-foreground mt-1">{book.value}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {book.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Books;
