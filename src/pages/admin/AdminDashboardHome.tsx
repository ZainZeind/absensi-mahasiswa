import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiGet } from "@/services/api";
import { Users, GraduationCap, BookOpen, Calendar, ClipboardList } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AdminStats {
  total_mahasiswa: number;
  total_dosen: number;
  total_kelas: number;
  total_matakuliah: number;
  sesi_hari_ini: number;
}

const AdminDashboardHome = () => {
  const { user } = useAuth();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const response = await apiGet<AdminStats>("/stats/admin");
      return response.data;
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Dashboard Admin</h2>
          <p className="text-sm text-muted-foreground mt-1">Kelola sistem absensi kampus</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground">{user?.username}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
            <span className="text-lg font-bold text-white">{getInitials(user?.username || 'AD')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Mahasiswa</p>
                <p className="text-3xl font-semibold text-foreground">{stats?.total_mahasiswa || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Dosen</p>
                <p className="text-3xl font-semibold text-foreground">{stats?.total_dosen || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-200 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Mata Kuliah</p>
                <p className="text-3xl font-semibold text-foreground">{stats?.total_matakuliah || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-300 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-800" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Kelas Aktif</p>
                <p className="text-3xl font-semibold text-foreground">{stats?.total_kelas || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-400 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-900" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sesi Absensi Hari Ini</CardTitle>
          <CardDescription>Total sesi yang berlangsung hari ini</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <ClipboardList className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-3xl font-bold">{stats?.sesi_hari_ini || 0}</div>
              <p className="text-sm text-muted-foreground">Sesi berlangsung</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Sistem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Total Pengguna:</span>
              <span className="text-sm font-medium">
                {(stats?.total_mahasiswa || 0) + (stats?.total_dosen || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Program Studi:</span>
              <span className="text-sm font-medium">{stats?.total_matakuliah || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Kelas Aktif:</span>
              <span className="text-sm font-medium">{stats?.total_kelas || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Gunakan menu sidebar untuk mengakses fitur management
            </p>
            <ul className="text-sm space-y-1 mt-4">
              <li>• Kelola data mahasiswa dan dosen</li>
              <li>• Atur mata kuliah dan kelas</li>
              <li>• Kelola enrollment mahasiswa</li>
              <li>• Monitor sesi absensi</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardHome;
