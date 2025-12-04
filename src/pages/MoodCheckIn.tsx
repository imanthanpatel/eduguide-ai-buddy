import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const moods = [
  { emoji: "😊", label: "Happy", value: "happy", color: "bg-success/20 hover:bg-success/30" },
  { emoji: "😐", label: "Neutral", value: "neutral", color: "bg-muted hover:bg-muted/80" },
  { emoji: "😢", label: "Sad", value: "sad", color: "bg-primary/20 hover:bg-primary/30" },
  { emoji: "😤", label: "Stressed", value: "stressed", color: "bg-warning/20 hover:bg-warning/30" },
];

const MoodCheckIn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedMood, setSelectedMood] = useState("");
  const [note, setNote] = useState("");
  const [response, setResponse] = useState("");

  const handleSubmit = async () => {
    if (!selectedMood) {
      toast({
        title: "Please select a mood",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      await supabase.from("mood_entries").insert({
        user_id: session.user.id,
        mood: selectedMood,
        note: note || null,
      });

      const responses: Record<string, string> = {
        happy: "That's wonderful! Keep spreading that positive energy! 🌟",
        neutral: "Sometimes neutral is okay. Remember, every day is a new opportunity! 💙",
        sad: "I hear you. It's okay to feel this way. Remember, tough times don't last. You've got this! 💪",
        stressed: "Take a deep breath. You're doing your best, and that's enough. Consider taking a short break! 🧘",
      };

      setResponse(responses[selectedMood]);
      toast({
        title: "Mood saved!",
        description: "Thank you for checking in with yourself.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4">
      <div className="container mx-auto max-w-2xl">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">How are you feeling today?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {moods.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`p-6 rounded-2xl transition-all ${mood.color} ${
                    selectedMood === mood.value ? "ring-4 ring-primary scale-105" : ""
                  }`}
                >
                  <div className="text-5xl mb-2">{mood.emoji}</div>
                  <div className="font-medium">{mood.label}</div>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Anything you'd like to share? (Optional)</label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write about your day..."
                rows={4}
                className="resize-none"
              />
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-primary to-secondary"
              disabled={!selectedMood}
            >
              Save Mood Check-In
            </Button>

            {response && (
              <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg animate-fade-in">
                <p className="text-center text-lg">{response}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MoodCheckIn;
