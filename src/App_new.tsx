import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from '@/components/pages/LandingPage';
import MainLayout from '@/components/layout/MainLayout';
import AdminDashboard from '@/components/pages/AdminDashboard';
import DosenDashboard from '@/components/pages/DosenDashboard';
import MahasiswaDashboard from '@/components/pages/MahasiswaDashboard';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles
}) => {
  const { user, isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Dashboard redirect component
const DashboardRedirect: React.FC = () => {
  const { user, hasRole } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (hasRole('admin')) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (hasRole('dosen')) {
    return <Navigate to="/dosen/dashboard" replace />;
  }

  if (hasRole('mahasiswa')) {
    return <Navigate to="/mahasiswa/dashboard" replace />;
  }

  return <Navigate to="/" replace />;
};

// Unauthorized page
const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center p-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">403</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mt-2">Akses Ditolak</h2>
          <p className="mt-4 text-gray-600">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
        </div>
        <div className="space-y-4">
          <button
            onClick={() => window.history.back()}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kembali
          </button>
          <a
            href="/"
            className="block w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Halaman Utama
          </a>
        </div>
      </div>
    </div>
  );
};

// Not found page
const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center p-8">
        <div>
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mt-2">Halaman Tidak Ditemukan</h2>
          <p className="mt-4 text-gray-600">
            Halaman yang Anda cari tidak ada atau telah dipindahkan.
          </p>
        </div>
        <div className="space-y-4">
          <a
            href="/"
            className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LandingPage />} />
                <Route path="/demo" element={<LandingPage />} />

                {/* Protected Routes */}
                <Route path="/admin/*" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <MainLayout />
                  </ProtectedRoute>
                }>
                  <Route path="dashboard" element={<AdminDashboard />} />
                </Route>

                <Route path="/dosen/*" element={
                  <ProtectedRoute allowedRoles={['dosen']}>
                    <MainLayout />
                  </ProtectedRoute>
                }>
                  <Route path="dashboard" element={<DosenDashboard />} />
                </Route>

                <Route path="/mahasiswa/*" element={
                  <ProtectedRoute allowedRoles={['mahasiswa']}>
                    <MainLayout />
                  </ProtectedRoute>
                }>
                  <Route path="dashboard" element={<MahasiswaDashboard />} />
                </Route>

                {/* Default redirect based on role */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardRedirect />
                  </ProtectedRoute>
                } />

                {/* Fallback routes */}
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
          </Router>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;