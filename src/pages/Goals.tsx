import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Check, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Goal {
  id: string;
  subject: string;
  hours_target: number;
  deadline: string;
  completed: boolean;
}

const Goals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    hoursTarget: "",
    deadline: "",
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setGoals(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const { error } = await supabase.from("goals").insert({
        user_id: session.user.id,
        subject: formData.subject,
        hours_target: parseFloat(formData.hoursTarget),
        deadline: formData.deadline,
      });

      if (error) throw error;

      toast({
        title: "Goal created!",
        description: "Keep working towards it! 🎯",
      });

      setFormData({ subject: "", hoursTarget: "", deadline: "" });
      setShowForm(false);
      fetchGoals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from("goals")
      .update({ completed: !completed })
      .eq("id", id);

    if (!error) {
      fetchGoals();
      if (!completed) {
        toast({
          title: "Congratulations! 🎉",
          description: "You've completed your goal!",
        });
      }
    }
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (!error) {
      fetchGoals();
      toast({
        title: "Goal deleted",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-success/5 p-4">
      <div className="container mx-auto max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Goal Journal 🏆</h1>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            New Goal
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6 shadow-xl">
            <CardHeader>
              <CardTitle>Create a New Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject/Topic</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Mathematics"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours">Target Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.5"
                    value={formData.hoursTarget}
                    onChange={(e) => setFormData({ ...formData, hoursTarget: e.target.value })}
                    placeholder="e.g., 20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">Create Goal</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {goals.map((goal) => (
            <Card
              key={goal.id}
              className={`shadow-lg transition-all ${
                goal.completed ? "bg-success/5 border-success" : ""
              }`}
            >
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => toggleComplete(goal.id, goal.completed)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      goal.completed
                        ? "bg-success border-success"
                        : "border-muted-foreground hover:border-primary"
                    }`}
                  >
                    {goal.completed && <Check className="w-4 h-4 text-white" />}
                  </button>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg ${goal.completed ? "line-through text-muted-foreground" : ""}`}>
                      {goal.subject}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {goal.hours_target} hours • Deadline: {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteGoal(goal.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}

          {goals.length === 0 && (
            <Card className="shadow-lg">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No goals yet. Create your first goal to get started! 🎯</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Goals;
