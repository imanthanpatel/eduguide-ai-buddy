import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const puzzles = [
  {
    id: 1,
    question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
    options: ["A painting", "A map", "A dream", "A photograph"],
    correct: 1
  },
  {
    id: 2,
    question: "What has 13 hearts but no other organs?",
    options: ["A zombie", "A deck of cards", "A tree", "A hospital"],
    correct: 1
  },
  {
    id: 3,
    question: "I speak without a mouth and hear without ears. I have no body, but come alive with wind. What am I?",
    options: ["A ghost", "An echo", "A radio", "A thought"],
    correct: 1
  },
  {
    id: 4,
    question: "The more you take, the more you leave behind. What am I?",
    options: ["Memories", "Footsteps", "Time", "Photographs"],
    correct: 1
  },
  {
    id: 5,
    question: "What can travel around the world while staying in a corner?",
    options: ["A stamp", "A coin", "A fly", "A spider"],
    correct: 0
  }
];

const Puzzles = () => {
  const navigate = useNavigate();
  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const puzzle = puzzles[currentPuzzle];

  const handleAnswer = (index: number) => {
    if (answered) return;
    
    setSelectedAnswer(index);
    setAnswered(true);

    if (index === puzzle.correct) {
      toast.success("Correct! 🎉 Great thinking!");
    } else {
      toast.error("Try again! 💪 Keep practicing!");
    }
  };

  const nextPuzzle = () => {
    setCurrentPuzzle((prev) => (prev + 1) % puzzles.length);
    setSelectedAnswer(null);
    setAnswered(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              🧩 Puzzle Games
            </h1>
            <p className="text-sm text-muted-foreground">Brain teasers to boost your IQ</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="animate-fade-in shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Puzzle {currentPuzzle + 1} of {puzzles.length}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPuzzle}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  New Puzzle
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-primary/5 p-6 rounded-lg border-2 border-primary/20">
                <p className="text-lg font-medium text-center">{puzzle.question}</p>
              </div>

              <div className="space-y-3">
                {puzzle.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = index === puzzle.correct;
                  const showResult = answered && isSelected;

                  return (
                    <Button
                      key={index}
                      variant={showResult ? (isCorrect ? "default" : "destructive") : "outline"}
                      className={`w-full justify-start text-left h-auto py-4 transition-all ${
                        !answered && "hover:bg-accent"
                      }`}
                      onClick={() => handleAnswer(index)}
                      disabled={answered}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <span className="font-bold text-lg">{String.fromCharCode(65 + index)}.</span>
                        <span className="flex-1">{option}</span>
                        {showResult && (
                          isCorrect ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>

              {answered && (
                <div className="text-center animate-fade-in">
                  {selectedAnswer === puzzle.correct ? (
                    <p className="text-lg font-medium text-primary">
                      🎯 Excellent! Your logical thinking is sharp!
                    </p>
                  ) : (
                    <p className="text-lg font-medium text-muted-foreground">
                      💡 The correct answer is <span className="text-primary">{String.fromCharCode(65 + puzzle.correct)}</span>
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Puzzles;
