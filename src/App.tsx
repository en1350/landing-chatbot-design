
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import StudentTrainer from "./pages/StudentTrainer";
import QualityAnalytics from "./pages/QualityAnalytics";
import QualityAnalysisTool from "./pages/QualityAnalysisTool";
import LessonCardBuilder from "./pages/LessonCardBuilder";
import TaskCardBuilder from "./pages/TaskCardBuilder";
import ExtracurricularAnalytics from "./pages/ExtracurricularAnalytics";
import EventCardBuilder from "./pages/EventCardBuilder";
import { UsageProvider } from "./context/UsageContext";
import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UsageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/trenazher-dlya-uchenikov" element={<StudentTrainer />} />
              <Route path="/analitika-kachestva" element={<QualityAnalytics />} />
              <Route path="/kachestvo-znaniy" element={<QualityAnalysisTool />} />
              <Route path="/konstruktor-uroka" element={<LessonCardBuilder />} />
              <Route path="/konstruktor-zadaniy" element={<TaskCardBuilder />} />
              <Route path="/konstruktor-masterklassov" element={<EventCardBuilder />} />
              <Route path="/vneauditornaya-deyatelnost" element={<ExtracurricularAnalytics />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </UsageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;