import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, Trophy } from "lucide-react";

const quizQuestions = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correct: 2
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correct: 1
  },
  {
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correct: 1
  },
  {
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correct: 3
  },
  {
    question: "How many continents are there?",
    options: ["5", "6", "7", "8"],
    correct: 2
  },
  {
    question: "What is the smallest prime number?",
    options: ["0", "1", "2", "3"],
    correct: 2
  },
  {
    question: "Which element has the chemical symbol 'O'?",
    options: ["Gold", "Oxygen", "Silver", "Iron"],
    correct: 1
  },
  {
    question: "What is the largest mammal in the world?",
    options: ["African Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
    correct: 1
  },
  {
    question: "In which year did India gain independence?",
    options: ["1942", "1945", "1947", "1950"],
    correct: 2
  },
  {
    question: "What is the speed of light?",
    options: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "600,000 km/s"],
    correct: 0
  }
];

const Quiz = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;
  const score = selectedAnswers.filter((answer, index) => answer === quizQuestions[index].correct).length;

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShowResults(false);
  };

  if (showResults) {
    const percentage = (score / quizQuestions.length) * 100;
    let message = "";
    let emoji = "";

    if (percentage >= 80) {
      message = "Outstanding! Your knowledge is impressive! 🌟";
      emoji = "🏆";
    } else if (percentage >= 60) {
      message = "Great job! You're doing well! 🌱";
      emoji = "🎯";
    } else {
      message = "Nice attempt! Keep learning and try again! 💪";
      emoji = "📚";
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5">
        <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ❓ Quiz Results
            </h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="animate-fade-in text-center shadow-lg">
              <CardHeader>
                <div className="text-6xl mb-4">{emoji}</div>
                <CardTitle className="text-3xl mb-2">Quiz Complete!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="text-5xl font-bold text-primary mb-2">
                    {score}/{quizQuestions.length}
                  </div>
                  <p className="text-xl text-muted-foreground">
                    {percentage.toFixed(0)}% Correct
                  </p>
                </div>

                <div className="bg-accent/10 p-6 rounded-lg">
                  <p className="text-lg font-medium">{message}</p>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button onClick={handleRestart} size="lg">
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/dashboard")} size="lg">
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const question = quizQuestions[currentQuestion];
  const selectedAnswer = selectedAnswers[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ❓ IQ & GK Quiz
            </h1>
            <p className="text-sm text-muted-foreground">Test your knowledge</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Question {currentQuestion + 1} of {quizQuestions.length}</span>
              <span className="text-sm text-muted-foreground">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Card className="animate-fade-in shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">{question.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {question.options.map((option, index) => (
                <Button
                  key={index}
                  variant={selectedAnswer === index ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto py-4 transition-all"
                  onClick={() => handleAnswer(index)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg">{String.fromCharCode(65 + index)}.</span>
                    <span className="flex-1">{option}</span>
                    {selectedAnswer === index && <CheckCircle className="w-5 h-5" />}
                  </div>
                </Button>
              ))}

              <Button
                className="w-full mt-6"
                onClick={handleNext}
                disabled={selectedAnswer === undefined}
                size="lg"
              >
                {currentQuestion === quizQuestions.length - 1 ? "See Results" : "Next Question"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Quiz;
