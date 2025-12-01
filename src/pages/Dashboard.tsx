import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Users, BookOpen, Calendar, Settings, 
  LogOut, Home, GraduationCap, UserCog, ClipboardList, UserPlus
} from "lucide-react";

// Admin Pages
import AdminDashboardHome from "./admin/AdminDashboardHome";
import MahasiswaManagement from "./admin/MahasiswaManagement";
import DosenManagement from "./admin/DosenManagement";
import MataKuliahManagement from "./admin/MataKuliahManagement";
import KelasManagement from "./admin/KelasManagement";
import EnrollmentManagement from "./admin/EnrollmentManagement";

// Dosen Pages  
import DosenDashboard from "./lecturer/LecturerDashboard";
import CameraAbsensi from "./lecturer/CameraAbsensi";

// Mahasiswa Pages
import MahasiswaDashboard from "./student/StudentDashboard";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isActive = (path: string) => location.pathname === path;

  // Sidebar untuk Admin
  const AdminSidebar = () => (
    <aside className="w-64 glass-strong border-r border-white/20 min-h-screen p-4">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg">
          <span className="text-2xl font-bold text-white">UI</span>
        </div>
        <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Teknik Industri</h2>
        <p className="text-xs text-gray-600 font-medium">Universitas Diponegoro</p>
        <p className="text-xs text-gray-500 mt-1">Admin Panel</p>
      </div>
      
      <nav className="space-y-2">
        <Link to="/dashboard">
          <Button 
            variant={isActive("/dashboard") ? "default" : "ghost"} 
            className="w-full justify-start"
          >
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </Link>
        
        <Link to="/dashboard/mahasiswa">
          <Button 
            variant={isActive("/dashboard/mahasiswa") ? "default" : "ghost"} 
            className="w-full justify-start"
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Mahasiswa
          </Button>
        </Link>
        
        <Link to="/dashboard/dosen">
          <Button 
            variant={isActive("/dashboard/dosen") ? "default" : "ghost"} 
            className="w-full justify-start"
          >
            <UserCog className="w-4 h-4 mr-2" />
            Dosen
          </Button>
        </Link>
        
        <Link to="/dashboard/matakuliah">
          <Button 
            variant={isActive("/dashboard/matakuliah") ? "default" : "ghost"} 
            className="w-full justify-start"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Mata Kuliah
          </Button>
        </Link>
        
        <Link to="/dashboard/kelas">
          <Button 
            variant={isActive("/dashboard/kelas") ? "default" : "ghost"} 
            className="w-full justify-start"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Kelas
          </Button>
        </Link>
        
        <Link to="/dashboard/enrollment">
          <Button 
            variant={isActive("/dashboard/enrollment") ? "default" : "ghost"} 
            className="w-full justify-start"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Enrollment
          </Button>
        </Link>
      </nav>

      <div className="mt-auto pt-8 border-t">
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm font-medium">{user.username}</p>
          <p className="text-xs text-gray-600">{user.email}</p>
          <p className="text-xs text-blue-600 mt-1 capitalize">{user.role}</p>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );

  // Render berdasarkan role
  if (user.role === "admin") {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <Routes>
            <Route index element={<AdminDashboardHome />} />
            <Route path="mahasiswa" element={<MahasiswaManagement />} />
            <Route path="dosen" element={<DosenManagement />} />
            <Route path="matakuliah" element={<MataKuliahManagement />} />
            <Route path="kelas" element={<KelasManagement />} />
            <Route path="enrollment" element={<EnrollmentManagement />} />
          </Routes>
        </main>
      </div>
    );
  }

  if (user.role === "dosen") {
    return (
      <Routes>
        <Route index element={<DosenDashboard />} />
        <Route path="camera-absensi" element={<CameraAbsensi />} />
      </Routes>
    );
  }

  if (user.role === "mahasiswa") {
    return <MahasiswaDashboard />;
  }

  return <Navigate to="/" replace />;
};

export default Dashboard;
