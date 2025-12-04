import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PredictMarks = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [formData, setFormData] = useState({
    hoursStudied: "",
    attendance: "",
    sleepHours: "",
    parentalInvolvement: "",
    familyIncome: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("predict-marks", {
        body: {
          hoursStudied: parseFloat(formData.hoursStudied),
          attendance: parseFloat(formData.attendance),
          sleepHours: parseFloat(formData.sleepHours),
          parentalInvolvement: parseInt(formData.parentalInvolvement),
          familyIncome: parseFloat(formData.familyIncome),
        },
      });

      if (error) throw error;
      setPrediction(data);
      
      if (data.predicted_score < 50) {
        toast({
          title: "Don't worry! 🌱",
          description: "You can improve. Let's plan a roadmap together!",
        });
      } else {
        toast({
          title: "Great work! 💪",
          description: "You're doing amazing. Keep building consistency!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to predict marks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-4">
      <div className="container mx-auto max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl">Predict Your Marks</CardTitle>
            </div>
            <CardDescription>
              Enter your details below to get an AI-powered prediction of your exam performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hoursStudied">Hours Studied (per week)</Label>
                <Input
                  id="hoursStudied"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g., 20"
                  value={formData.hoursStudied}
                  onChange={(e) => handleChange("hoursStudied", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendance">Attendance (%)</Label>
                <Input
                  id="attendance"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="e.g., 85"
                  value={formData.attendance}
                  onChange={(e) => handleChange("attendance", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sleepHours">Average Sleep Hours (per night)</Label>
                <Input
                  id="sleepHours"
                  type="number"
                  step="0.1"
                  min="0"
                  max="24"
                  placeholder="e.g., 7"
                  value={formData.sleepHours}
                  onChange={(e) => handleChange("sleepHours", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentalInvolvement">Parental Involvement (1-5)</Label>
                <Input
                  id="parentalInvolvement"
                  type="number"
                  min="1"
                  max="5"
                  placeholder="e.g., 3"
                  value={formData.parentalInvolvement}
                  onChange={(e) => handleChange("parentalInvolvement", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="familyIncome">Family Income (annual, in thousands)</Label>
                <Input
                  id="familyIncome"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="e.g., 50"
                  value={formData.familyIncome}
                  onChange={(e) => handleChange("familyIncome", e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-secondary"
                disabled={loading}
              >
                {loading ? "Predicting..." : "Predict My Score"}
              </Button>
            </form>

            {prediction && (
              <div className="mt-6 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg animate-fade-in">
                <h3 className="text-2xl font-bold mb-2">
                  Predicted Score: {prediction.predicted_score.toFixed(1)}%
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Confidence: {prediction.confidence}
                </p>
                <p className="text-foreground">{prediction.analysis}</p>
                
                {prediction.predicted_score < 50 && (
                  <div className="mt-4 p-4 bg-warning/10 rounded-lg border border-warning/20">
                    <h4 className="font-semibold mb-2">💡 Improvement Roadmap</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Increase study hours gradually (aim for 25-30 hrs/week)</li>
                      <li>• Improve attendance - every class matters!</li>
                      <li>• Ensure 7-8 hours of quality sleep</li>
                      <li>• Use active learning techniques</li>
                      <li>• Join study groups or seek tutoring</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PredictMarks;
