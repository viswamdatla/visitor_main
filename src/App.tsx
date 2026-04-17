import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth.tsx";
import Dashboard from "./pages/Dashboard";
import CreatePass from "./pages/CreatePass";
import AllVisits from "./pages/AllVisits";
import SecurityDashboard from "./pages/SecurityDashboard";
import AdminPanel from "./pages/AdminPanel";
import VisitorPass from "./pages/VisitorPass";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

import { Navigate } from 'react-router-dom';

function AppRoutes() {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/pass/:token" element={<VisitorPass />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  const isDepartmentUser = role && !['admin', 'guard', 'receptionist'].includes(role);

  return (
    <Routes>
      <Route path="/" element={isDepartmentUser ? <Navigate to="/create-pass" replace /> : <Dashboard />} />
      <Route path="/create-pass" element={<CreatePass />} />
      <Route path="/visits" element={<AllVisits />} />
      <Route path="/security" element={<SecurityDashboard />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/pass/:token" element={<VisitorPass />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
