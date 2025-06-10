import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

/* Shared Global Views */
import GV_TopNav from "@/components/views/GV_TopNav.tsx";
import GV_Footer from "@/components/views/GV_Footer.tsx";
import GV_Notification from "@/components/views/GV_Notification.tsx";

/* Unique Views */
import UV_Home from "@/components/views/UV_Home.tsx";
import UV_AdvancedSearch from "@/components/views/UV_AdvancedSearch.tsx";
import UV_PropertyList from "@/components/views/UV_PropertyList.tsx";
import UV_PropertyDetail from "@/components/views/UV_PropertyDetail.tsx";
import UV_Login from "@/components/views/UV_Login.tsx";
import UV_Registration_Seeker from "@/components/views/UV_Registration_Seeker.tsx";
import UV_Registration_Agent from "@/components/views/UV_Registration_Agent.tsx";
import UV_PasswordRecovery from "@/components/views/UV_PasswordRecovery.tsx";
import UV_SeekerDashboard from "@/components/views/UV_SeekerDashboard.tsx";
import UV_AgentDashboard from "@/components/views/UV_AgentDashboard.tsx";
import UV_CreateListing from "@/components/views/UV_CreateListing.tsx";
import UV_EditListing from "@/components/views/UV_EditListing.tsx";
import UV_AdminDashboard from "@/components/views/UV_AdminDashboard.tsx";
import UV_About from "@/components/views/UV_About.tsx";
import UV_Contact from "@/components/views/UV_Contact.tsx";

/* 
  Note: The provided Redux store implementation uses Zustand.
  Since Zustand does not require a provider, we simply assume that a custom hook 
  (e.g., useAuthStore) is available to access authentication state.
*/
import useAuthStore from "@/stores/auth"; // this hook should return { auth_state }

/* Create a query client once so it is not recreated on every render */
const queryClient = new QueryClient();

/* Global Error Fallback Component */
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div role="alert" className="p-4 m-4 bg-red-100">
      <p className="text-red-600">Something went wrong:</p>
      <pre className="text-red-500">{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

/* ProtectedRoute Component to guard authenticated pages */
const ProtectedRoute: React.FC<{ allowedRoles: string[]; children: JSX.Element }> = ({ allowedRoles, children }) => {
  const { auth_state } = useAuthStore();
  
  // If not authenticated, redirect to login.
  if (!auth_state?.token) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user's role is allowed
  if (allowedRoles && !allowedRoles.includes(auth_state.role)) {
    return <div>You do not have permission to view this page.</div>;
  }
  
  return children;
};

/* 404 Not Found Component */
const NotFound: React.FC = () => (
  <div className="p-8 text-center">
    <h2 className="text-2xl font-bold">404 - Page Not Found</h2>
    <p>The page you are looking for does not exist.</p>
  </div>
);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <div className="flex flex-col min-h-screen">
            {/* Global Top Navigation */}
            <GV_TopNav />

            {/* Global Notification Bar */}
            <GV_Notification />

            {/* Main Content Area */}
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<UV_Home />} />
                <Route path="/advanced-search" element={<UV_AdvancedSearch />} />
                <Route path="/properties" element={<UV_PropertyList />} />
                <Route path="/properties/:id" element={<UV_PropertyDetail />} />
                <Route path="/about" element={<UV_About />} />
                <Route path="/contact" element={<UV_Contact />} />
                <Route path="/login" element={<UV_Login />} />
                <Route path="/register/seeker" element={<UV_Registration_Seeker />} />
                <Route path="/register/agent" element={<UV_Registration_Agent />} />
                <Route path="/password-recovery" element={<UV_PasswordRecovery />} />
                
                {/* Protected routes with role-based access */}
                <Route
                  path="/dashboard/seeker"
                  element={
                    <ProtectedRoute allowedRoles={["seeker"]}>
                      <UV_SeekerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/agent"
                  element={
                    <ProtectedRoute allowedRoles={["agent"]}>
                      <UV_AgentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/agent/create"
                  element={
                    <ProtectedRoute allowedRoles={["agent"]}>
                      <UV_CreateListing />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/agent/edit/:id"
                  element={
                    <ProtectedRoute allowedRoles={["agent"]}>
                      <UV_EditListing />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/admin"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <UV_AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all route for 404 Not Found */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>

            {/* Global Footer */}
            <GV_Footer />
          </div>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;