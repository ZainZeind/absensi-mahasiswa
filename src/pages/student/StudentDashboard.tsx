import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut } from "lucide-react";

const StudentDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Mahasiswa</h1>
            <p className="text-muted-foreground">Selamat datang, {user?.username}</p>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Kelas Terdaftar</h3>
            <p className="text-3xl font-bold">0</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Kehadiran</h3>
            <p className="text-3xl font-bold">0%</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Total Pertemuan</h3>
            <p className="text-3xl font-bold">0</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
