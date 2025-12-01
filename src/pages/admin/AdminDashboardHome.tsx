import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiGet } from "@/services/api";
import { Users, GraduationCap, BookOpen, Calendar, ClipboardList } from "lucide-react";

interface AdminStats {
  total_mahasiswa: number;
  total_dosen: number;
  total_kelas: number;
  total_matakuliah: number;
  sesi_hari_ini: number;
}

const AdminDashboardHome = () => {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Dashboard Admin</h2>
        <p className="text-muted-foreground">Selamat datang di sistem absensi kampus</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mahasiswa</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_mahasiswa || 0}</div>
            <p className="text-xs text-muted-foreground">Mahasiswa terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dosen</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_dosen || 0}</div>
            <p className="text-xs text-muted-foreground">Dosen aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mata Kuliah</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_matakuliah || 0}</div>
            <p className="text-xs text-muted-foreground">Mata kuliah tersedia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_kelas || 0}</div>
            <p className="text-xs text-muted-foreground">Kelas aktif</p>
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
