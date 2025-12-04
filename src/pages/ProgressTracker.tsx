import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Flame, Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const zones = [
  { name: "Messy Mind Lane", color: "from-red-500/20 to-orange-500/20", icon: "🌪️" },
  { name: "Growing Discipline Fields", color: "from-yellow-500/20 to-green-500/20", icon: "🌱" },
  { name: "Focus Forest", color: "from-green-500/20 to-emerald-500/20", icon: "🌲" },
  { name: "Mastery Mountain", color: "from-blue-500/20 to-purple-500/20", icon: "⛰️" }
];

const ProgressTracker = () => {
  const navigate = useNavigate();
  const [currentDay, setCurrentDay] = useState(0);
  const [streak, setStreak] = useState(0);
  const [studyDone, setStudyDone] = useState(false);
  const [homeworkDone, setHomeworkDone] = useState(false);
  const [sleepDone, setSleepDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const currentZone = Math.min(Math.floor(currentDay / 10), zones.length - 1);
  const totalSteps = 40;
  const canMoveForward = studyDone && homeworkDone && sleepDone;

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/auth");
          return;
        }

        setUserId(session.user.id);

        const { data, error } = await supabase
          .from("progress_tracker")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Error loading progress:", error);
          toast.error("Failed to load progress");
          return;
        }

        if (data) {
          setCurrentDay(data.current_day);
          setStreak(data.streak);
          setStudyDone(data.study_done);
          setHomeworkDone(data.homework_done);
          setSleepDone(data.sleep_done);
        } else {
          const { error: insertError } = await supabase
            .from("progress_tracker")
            .insert({
              user_id: session.user.id,
              current_day: 0,
              streak: 0,
              study_done: false,
              homework_done: false,
              sleep_done: false
            });

          if (insertError) {
            console.error("Error creating progress:", insertError);
          }
        }
      } catch (error) {
        console.error("Error in loadProgress:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [navigate]);

  const updateProgress = async (updates: Partial<{
    current_day: number;
    streak: number;
    study_done: boolean;
    homework_done: boolean;
    sleep_done: boolean;
  }>) => {
    if (!userId) return;

    const { error } = await supabase
      .from("progress_tracker")
      .update(updates)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to save progress");
    }
  };

  const handleCheckboxChange = (field: "study" | "homework" | "sleep", checked: boolean) => {
    const updates: Record<string, boolean> = {};
    
    if (field === "study") {
      setStudyDone(checked);
      updates.study_done = checked;
    } else if (field === "homework") {
      setHomeworkDone(checked);
      updates.homework_done = checked;
    } else {
      setSleepDone(checked);
      updates.sleep_done = checked;
    }

    updateProgress(updates);
  };

  const handleMoveForward = async () => {
    if (!canMoveForward) {
      toast.error("Complete all tasks to move forward!");
      return;
    }

    const newDay = Math.min(currentDay + 1, totalSteps);
    const newStreak = streak + 1;

    setCurrentDay(newDay);
    setStreak(newStreak);
    setStudyDone(false);
    setHomeworkDone(false);
    setSleepDone(false);

    await updateProgress({
      current_day: newDay,
      streak: newStreak,
      study_done: false,
      homework_done: false,
      sleep_done: false
    });

    toast.success(`Day ${newDay} complete! 🎉`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎮</div>
          <p className="text-muted-foreground">Loading your journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              🎮 Your Growth Journey
            </h1>
            <p className="text-sm text-muted-foreground">Level up your habits every day</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="flex gap-4 animate-fade-in">
            <Card className="flex-1">
              <CardContent className="flex items-center gap-3 p-4">
                <Flame className="w-8 h-8 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">{streak}</div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="flex items-center gap-3 p-4">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{currentDay}</div>
                  <div className="text-sm text-muted-foreground">Total Days</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-3xl">{zones[currentZone].icon}</span>
                {zones[currentZone].name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`bg-gradient-to-r ${zones[currentZone].color} p-8 rounded-lg relative overflow-hidden`}>
                <div className="flex justify-between items-end h-32 relative">
                  {Array.from({ length: totalSteps }).map((_, index) => {
                    const isPast = index < currentDay;
                    const isCurrent = index === currentDay;
                    const zoneIndex = Math.floor(index / 10);
                    
                    return (
                      <div
                        key={index}
                        className={`relative transition-all duration-500 ${
                          index % 10 === 0 ? "h-4" : "h-2"
                        }`}
                        style={{
                          width: `${100 / totalSteps}%`,
                          transform: isCurrent ? "translateY(-8px)" : "translateY(0)"
                        }}
                      >
                        <div
                          className={`w-full h-full rounded-full transition-all ${
                            isPast
                              ? "bg-primary"
                              : isCurrent
                              ? "bg-primary animate-pulse"
                              : "bg-muted"
                          }`}
                        />
                        {isCurrent && (
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-4xl animate-bounce">
                            🚶
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex justify-around text-xs text-muted-foreground">
                {zones.map((zone, index) => (
                  <Badge
                    key={index}
                    variant={currentZone === index ? "default" : "outline"}
                  >
                    {zone.icon} Day {index * 10 + 1}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle>Today's Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/5 transition-colors">
                <Checkbox
                  id="study"
                  checked={studyDone}
                  onCheckedChange={(checked) => handleCheckboxChange("study", checked as boolean)}
                />
                <label htmlFor="study" className="flex-1 cursor-pointer">
                  <div className="font-medium">Study Session Complete</div>
                  <div className="text-sm text-muted-foreground">Spend focused time learning</div>
                </label>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/5 transition-colors">
                <Checkbox
                  id="homework"
                  checked={homeworkDone}
                  onCheckedChange={(checked) => handleCheckboxChange("homework", checked as boolean)}
                />
                <label htmlFor="homework" className="flex-1 cursor-pointer">
                  <div className="font-medium">Homework Done</div>
                  <div className="text-sm text-muted-foreground">Complete all assignments</div>
                </label>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/5 transition-colors">
                <Checkbox
                  id="sleep"
                  checked={sleepDone}
                  onCheckedChange={(checked) => handleCheckboxChange("sleep", checked as boolean)}
                />
                <label htmlFor="sleep" className="flex-1 cursor-pointer">
                  <div className="font-medium">Healthy Sleep</div>
                  <div className="text-sm text-muted-foreground">Get 7-8 hours of rest</div>
                </label>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleMoveForward}
                disabled={!canMoveForward}
              >
                {canMoveForward ? "Move Forward 🚀" : "Complete All Tasks to Continue"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProgressTracker;
