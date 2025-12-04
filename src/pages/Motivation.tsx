import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Motivation = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchMessage = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("motivational-message");
      if (error) throw error;
      setMessage(data.message);
    } catch (error) {
      setMessage("You are capable of amazing things! Keep pushing forward. 🌟");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessage();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-success/10 p-4">
      <div className="container mx-auto max-w-2xl">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="shadow-xl bg-gradient-to-br from-card to-accent/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-accent" />
                <CardTitle className="text-2xl">Your Daily Motivation</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMessage}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 px-6">
              <p className="text-2xl md:text-3xl font-medium leading-relaxed text-foreground">
                {message || "Loading your motivation..."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Motivation;
