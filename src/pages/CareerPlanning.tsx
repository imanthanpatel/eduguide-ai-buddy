import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const mockCareerResponse = (userMessage: string): string => {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes("engineer") || lowerMessage.includes("coding")) {
    return "Engineering is a fantastic choice! 🚀\n\nEngineering careers are diverse and rewarding. Here are some popular streams:\n\n• Computer Science Engineering - Focus on software, AI, and technology\n• Mechanical Engineering - Design machines and mechanical systems\n• Civil Engineering - Build infrastructure and buildings\n• Electrical Engineering - Work with electrical systems and power\n\nFor engineering, focus on:\n- Strong foundation in Math and Physics\n- Problem-solving skills\n- Practical projects and internships\n- Entrance exams like JEE Main/Advanced\n\nWould you like to know more about any specific engineering field?";
  }
  
  if (lowerMessage.includes("doctor") || lowerMessage.includes("medical")) {
    return "Medicine is a noble profession! 🏥\n\nTo become a doctor:\n- Excel in Biology, Chemistry, and Physics\n- Prepare for NEET exam\n- Consider MBBS or specialized fields like:\n  • General Medicine\n  • Surgery\n  • Pediatrics\n  • Dentistry\n\nKey qualities needed:\n- Strong dedication and patience\n- Excellent memory and analytical skills\n- Compassion for helping others\n- Ability to handle pressure\n\nIt's a challenging but incredibly rewarding career!";
  }
  
  if (lowerMessage.includes("science") || lowerMessage.includes("stream")) {
    return "Great question! 🎓\n\nAfter Class 10, you can choose:\n\n**Science Stream:**\n- PCM (Physics, Chemistry, Math) → Engineering, Architecture, Pure Sciences\n- PCB (Physics, Chemistry, Biology) → Medical, Pharmacy, Life Sciences\n- PCMB (All four) → Keep all options open\n\n**Commerce Stream:**\n- Accounting, Economics → CA, MBA, Finance\n\n**Arts/Humanities:**\n- Psychology, History, Political Science → Law, Design, Media\n\nChoose based on:\n✓ Your interests and strengths\n✓ Career goals\n✓ Subject enjoyment\n\nWhat subjects do you enjoy most?";
  }
  
  return "That's an interesting question! 🌟\n\nI'm here to help you explore career paths, streams, and subjects. Feel free to ask me about:\n\n• Different career options (Engineering, Medical, Arts, etc.)\n• Stream selection after Class 10 or 12\n• Subject choices and their importance\n• Skills needed for specific careers\n• Entrance exams and preparation\n\nWhat specific aspect of your future would you like to discuss?";
};

const CareerPlanning = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your Career Mentor 🌟\n\nI'm here to help you explore different career paths, understand subject choices, and plan your future. Ask me anything about:\n\n• Career options and streams\n• Subject selection\n• Skills you need to develop\n• Entrance exams\n• Your interests and strengths\n\nWhat would you like to know about your future?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    setTimeout(() => {
      const response = mockCareerResponse(userMessage);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 flex flex-col">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
              🧭 Career Planning
            </h1>
            <p className="text-sm text-muted-foreground">Talk to your Career Mentor</p>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col max-w-4xl">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              >
                <Card className={`max-w-[80%] ${
                  message.role === "user" 
                    ? "bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20" 
                    : "bg-card"
                }`}>
                  <CardContent className="p-4">
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-cyan-500" />
                        <span className="text-xs font-medium text-cyan-500">Career Mentor</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <Card className="bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-500 animate-pulse" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="mt-4 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about your future, careers, or subjects..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default CareerPlanning;
