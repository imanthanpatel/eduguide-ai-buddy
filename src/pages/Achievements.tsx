import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Upload, Award, Lock } from "lucide-react";
import { toast } from "sonner";

const milestones = [
  { days: 7, title: "Consistency Starter", desc: "Complete 7 days", icon: "🌱", unlocked: true },
  { days: 30, title: "Discipline Builder", desc: "Complete 30 days", icon: "💪", unlocked: false },
  { days: 90, title: "Habit Hero", desc: "Complete 3 months", icon: "⭐", unlocked: false },
  { days: 180, title: "Half-Year Champion", desc: "Complete 6 months", icon: "🏆", unlocked: false },
  { days: 365, title: "Best Version Achiever", desc: "Complete 1 year", icon: "👑", unlocked: false }
];

type Certificate = {
  id: number;
  title: string;
  category: string;
  date: string;
  description: string;
};

const Achievements = () => {
  const navigate = useNavigate();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([
    {
      id: 1,
      title: "Science Olympiad Winner",
      category: "Academic",
      date: "2024-01-15",
      description: "1st Place in National Science Olympiad"
    }
  ]);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    date: "",
    description: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !formData.date) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newCertificate: Certificate = {
      id: Date.now(),
      ...formData
    };

    setCertificates([...certificates, newCertificate]);
    setFormData({ title: "", category: "", date: "", description: "" });
    setShowUploadForm(false);
    toast.success("Certificate added successfully! 🎉");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
              🏅 Achievements & Certificates
            </h1>
            <p className="text-sm text-muted-foreground">Your journey to excellence</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        <section className="animate-fade-in">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Progress Milestones
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {milestones.map((milestone, index) => (
              <Card
                key={milestone.days}
                className={`text-center transition-all duration-300 ${
                  milestone.unlocked
                    ? "bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20 hover:shadow-lg hover:-translate-y-1"
                    : "opacity-50 grayscale"
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="text-5xl mb-3">
                    {milestone.unlocked ? milestone.icon : <Lock className="w-12 h-12 mx-auto text-muted-foreground" />}
                  </div>
                  <h3 className="font-bold mb-1">{milestone.title}</h3>
                  <p className="text-sm text-muted-foreground">{milestone.desc}</p>
                  {milestone.unlocked && (
                    <Badge variant="secondary" className="mt-2">Unlocked!</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Award className="w-6 h-6 text-primary" />
              Your Certificates
            </h2>
            <Button onClick={() => setShowUploadForm(!showUploadForm)}>
              <Upload className="w-4 h-4 mr-2" />
              Add Certificate
            </Button>
          </div>

          {showUploadForm && (
            <Card className="mb-6 animate-fade-in">
              <CardHeader>
                <CardTitle>Upload New Certificate</CardTitle>
                <CardDescription>Add your achievements and certificates</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Certificate Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Science Olympiad Winner"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Academic">Academic</SelectItem>
                        <SelectItem value="Sports">Sports</SelectItem>
                        <SelectItem value="Arts">Arts</SelectItem>
                        <SelectItem value="Music">Music</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of your achievement"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">Save Certificate</Button>
                    <Button type="button" variant="outline" onClick={() => setShowUploadForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map((cert, index) => (
              <Card
                key={cert.id}
                className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in bg-gradient-to-br from-card to-card/50"
                style={{ animationDelay: `${(index + 2) * 0.1}s` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Award className="w-8 h-8 text-yellow-500" />
                    <Badge variant="secondary">{cert.category}</Badge>
                  </div>
                  <CardTitle className="text-lg">{cert.title}</CardTitle>
                  <CardDescription>{new Date(cert.date).toLocaleDateString()}</CardDescription>
                </CardHeader>
                {cert.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{cert.description}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {certificates.length === 0 && !showUploadForm && (
            <Card className="text-center p-12">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-bold mb-2">No certificates yet</h3>
              <p className="text-muted-foreground mb-4">Start adding your achievements!</p>
              <Button onClick={() => setShowUploadForm(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Add Your First Certificate
              </Button>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
};

export default Achievements;
