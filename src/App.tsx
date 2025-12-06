import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Profile from "./pages/Profile";
import PredictMarks from "./pages/PredictMarks";
import AIGuide from "./pages/AIGuide";
import Tutors from "./pages/Tutors";
import Motivation from "./pages/Motivation";
import MoodCheckIn from "./pages/MoodCheckIn";
import SuccessStories from "./pages/SuccessStories";
import Goals from "./pages/Goals";
import Feedback from "./pages/Feedback";
import Books from "./pages/Books";
import Movies from "./pages/Movies";
import Competitions from "./pages/Competitions";
import Puzzles from "./pages/Puzzles";
import Quiz from "./pages/Quiz";
import CareerPlanning from "./pages/CareerPlanning";
import ProgressTracker from "./pages/ProgressTracker";
import Achievements from "./pages/Achievements";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherPending from "./pages/TeacherPending";
import TeacherRequests from "./pages/TeacherRequests";
import NotFound from "./pages/NotFound";
import ClassesManager from "@/components/admin/ClassesManager";
import EmailConfirmation from "./pages/EmailConfirmation";
import StudentAttendanceView from "@/components/student/StudentAttendanceView";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/confirm" element={<EmailConfirmation />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/attendance" element={<StudentAttendanceView />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/predict" element={<PredictMarks />} />
            <Route path="/guide" element={<AIGuide />} />
            <Route path="/tutors" element={<Tutors />} />
            <Route path="/motivation" element={<Motivation />} />
            <Route path="/mood" element={<MoodCheckIn />} />
            <Route path="/stories" element={<SuccessStories />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/books" element={<Books />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/competitions" element={<Competitions />} />
            <Route path="/puzzles" element={<Puzzles />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/career-planning" element={<CareerPlanning />} />
            <Route path="/progress-tracker" element={<ProgressTracker />} />
            <Route path="/achievements" element={<Achievements />} />
          <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher-pending" element={<TeacherPending />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin/teacher-requests" element={<TeacherRequests />} />
          {/* <Route path="/admin/classes" element={<ClassesManager />} /> */}
            <Route path="/tips" element={<Dashboard />} />
            <Route path="/friend" element={<AIGuide />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
