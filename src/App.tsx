
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import StudentTrainer from "./pages/StudentTrainer";
import QualityAnalytics from "./pages/QualityAnalytics";
import QualityAnalysisTool from "./pages/QualityAnalysisTool";
import LessonCardBuilder from "./pages/LessonCardBuilder";
import TaskCardBuilder from "./pages/TaskCardBuilder";
import PmTaskBuilder from "./pages/PmTaskBuilder";
import ProjectBuilder from "./pages/ProjectBuilder";
import GameCardBuilder from "./pages/GameCardBuilder";
import PresentationBuilder from "./pages/PresentationBuilder";
import ExtracurricularAnalytics from "./pages/ExtracurricularAnalytics";
import TechMatrix from "./pages/TechMatrix";
import ProjectActivity from "./pages/ProjectActivity";
import CorrectionWork from "./pages/CorrectionWork";
import EventCardBuilder from "./pages/EventCardBuilder";
import Admin from "./pages/Admin";
import TeacherMiniTest from "./pages/TeacherMiniTest";
import WorksheetBuilder from "./pages/WorksheetBuilder";
import UserAgreement from "./pages/UserAgreement";
import RpdBuilder from "./pages/RpdBuilder";
import MemberChat from "./pages/MemberChat";
import VisitTracker from "./components/VisitTracker";
import ScrollToTop from "./components/ScrollToTop";
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
            <ScrollToTop />
            <VisitTracker />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/trenazher-dlya-uchenikov" element={<StudentTrainer />} />
              <Route path="/analitika-kachestva" element={<QualityAnalytics />} />
              <Route path="/kachestvo-znaniy" element={<QualityAnalysisTool />} />
              <Route path="/konstruktor-uroka" element={<LessonCardBuilder />} />
              <Route path="/konstruktor-zadaniy" element={<TaskCardBuilder />} />
              <Route path="/generator-proektov" element={<ProjectBuilder />} />
              <Route path="/generator-zadaniy-pm" element={<PmTaskBuilder />} />
              <Route path="/generator-prezentaciy" element={<PresentationBuilder />} />
              <Route path="/konstruktor-igry" element={<GameCardBuilder />} />
              <Route path="/konstruktor-masterklassov" element={<EventCardBuilder />} />
              <Route path="/vneauditornaya-deyatelnost" element={<ExtracurricularAnalytics />} />
              <Route path="/matritsa-tehnologiy" element={<TechMatrix />} />
              <Route path="/proektnaya-deyatelnost" element={<ProjectActivity />} />
              <Route path="/korrektsionnaya-rabota" element={<CorrectionWork />} />
              <Route path="/konstruktor-rabochih-listov" element={<WorksheetBuilder />} />
              <Route path="/polzovatelskoe-soglashenie" element={<UserAgreement />} />
              <Route path="/konstruktor-rabochih-programm" element={<RpdBuilder />} />
              <Route path="/mini-test-pedagogov" element={<TeacherMiniTest />} />
              <Route path="/chat" element={<MemberChat />} />
              <Route path="/admin" element={<Admin />} />
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