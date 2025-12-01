import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/services/api";
import { BookOpen, Calendar, Clock, LogOut, Camera, CheckCircle } from "lucide-react";

interface EnrolledKelas {
  id: number;
  kelas_id: number;
  kelas_nama: string;
  matakuliah_nama: string;
  dosen_nama: string;
  tanggal_enroll: string;
}

interface SesiAbsensi {
  id: number;
  kelas_id: number;
  kelas_nama: string;
  matakuliah_nama: string;
  dosen_nama: string;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  status: "active" | "completed" | "scheduled";
}

interface AbsensiHistory {
  id: number;
  sesi_id: number;
  kelas_nama: string;
  matakuliah_nama: string;
  tanggal: string;
  waktu_mulai: string;
  status: "hadir" | "tidak_hadir" | "izin" | "sakit";
  waktu_absen: string;
}

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSesi, setSelectedSesi] = useState<number | null>(null);
  const [isAbsenDialogOpen, setIsAbsenDialogOpen] = useState(false);
  const [fotoWajah, setFotoWajah] = useState<File | null>(null);

  // Fetch kelas yang diikuti mahasiswa
  const { data: enrolledKelas } = useQuery({
    queryKey: ["enrollment", user?.id],
    queryFn: async () => {
      const response = await apiGet<EnrolledKelas[]>(`/enrollment?mahasiswa_id=${user?.id}`);
      return response.data;
    }
  });

  // Fetch sesi absensi aktif untuk kelas yang diikuti
  const { data: activeSessions } = useQuery({
    queryKey: ["active-sessions", user?.id],
    queryFn: async () => {
      const response = await apiGet<SesiAbsensi[]>("/sesi");
      // Filter hanya kelas yang diikuti mahasiswa dan status active
      return response.data.filter(sesi => 
        sesi.status === "active" && 
        enrolledKelas?.some(kelas => kelas.kelas_id === sesi.kelas_id)
      );
    },
    enabled: !!enrolledKelas
  });

  // Fetch riwayat absensi mahasiswa
  const { data: absensiHistory } = useQuery({
    queryKey: ["absensi-history", user?.id],
    queryFn: async () => {
      const response = await apiGet<AbsensiHistory[]>(`/absensi?mahasiswa_id=${user?.id}`);
      return response.data;
    }
  });

  // Mutation untuk submit absensi
  const absensiMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiPost("/absensi", data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absensi-history"] });
      queryClient.invalidateQueries({ queryKey: ["active-sessions"] });
      toast({ title: "Berhasil", description: "Absensi berhasil dicatat" });
      handleCloseAbsenDialog();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Gagal mencatat absensi",
        variant: "destructive" 
      });
    }
  });

  const handleSubmitAbsen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSesi) {
      toast({ title: "Error", description: "Pilih sesi terlebih dahulu", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("sesi_id", selectedSesi.toString());
    formData.append("mahasiswa_id", user?.id.toString() || "");
    formData.append("status", "hadir");
    if (fotoWajah) {
      formData.append("foto_wajah", fotoWajah);
    }

    absensiMutation.mutate(formData);
  };

  const handleOpenAbsenDialog = (sesiId: number) => {
    setSelectedSesi(sesiId);
    setIsAbsenDialogOpen(true);
  };

  const handleCloseAbsenDialog = () => {
    setIsAbsenDialogOpen(false);
    setSelectedSesi(null);
    setFotoWajah(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFotoWajah(e.target.files[0]);
    }
  };

  const stats = {
    totalKelas: enrolledKelas?.length || 0,
    sesiAktif: activeSessions?.length || 0,
    totalKehadiran: absensiHistory?.filter(a => a.status === 'hadir').length || 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user?.foto_wajah} />
              <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Mahasiswa</h1>
              <p className="text-sm text-gray-600">{user?.username}</p>
            </div>
          </div>
          <Button onClick={logout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Kelas Saya</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalKelas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sesi Aktif</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sesiAktif}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Kehadiran</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalKehadiran}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="jadwal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="jadwal">Jadwal Kelas</TabsTrigger>
            <TabsTrigger value="sesi">Sesi Aktif</TabsTrigger>
            <TabsTrigger value="riwayat">Riwayat Absensi</TabsTrigger>
          </TabsList>

          {/* Tab Jadwal Kelas */}
          <TabsContent value="jadwal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Kelas yang Diikuti</CardTitle>
                <CardDescription>Daftar kelas yang Anda ambil semester ini</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Kelas</TableHead>
                      <TableHead>Mata Kuliah</TableHead>
                      <TableHead>Dosen</TableHead>
                      <TableHead>Tanggal Daftar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrolledKelas?.map((kelas) => (
                      <TableRow key={kelas.id}>
                        <TableCell className="font-medium">{kelas.kelas_nama}</TableCell>
                        <TableCell>{kelas.matakuliah_nama}</TableCell>
                        <TableCell>{kelas.dosen_nama}</TableCell>
                        <TableCell>{new Date(kelas.tanggal_enroll).toLocaleDateString('id-ID')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Sesi Aktif */}
          <TabsContent value="sesi" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sesi Absensi Aktif</CardTitle>
                <CardDescription>Sesi yang sedang berlangsung dan dapat diabsen</CardDescription>
              </CardHeader>
              <CardContent>
                {activeSessions && activeSessions.length > 0 ? (
                  <div className="space-y-4">
                    {activeSessions.map((sesi) => {
                      const sudahAbsen = absensiHistory?.some(
                        a => a.sesi_id === sesi.id
                      );
                      
                      return (
                        <Card key={sesi.id} className="border-2 border-primary">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{sesi.kelas_nama}</CardTitle>
                                <CardDescription>
                                  {sesi.matakuliah_nama} - {sesi.dosen_nama}
                                </CardDescription>
                              </div>
                              <Badge variant="default">AKTIF</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  {new Date(sesi.tanggal).toLocaleDateString('id-ID')}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  {sesi.waktu_mulai} - {sesi.waktu_selesai}
                                </div>
                              </div>
                              {sudahAbsen ? (
                                <Badge variant="secondary">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Sudah Absen
                                </Badge>
                              ) : (
                                <Button onClick={() => handleOpenAbsenDialog(sesi.id)}>
                                  <Camera className="mr-2 h-4 w-4" /> Absen Sekarang
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Tidak ada sesi aktif saat ini
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Riwayat */}
          <TabsContent value="riwayat" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Absensi</CardTitle>
                <CardDescription>Catatan kehadiran Anda</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Mata Kuliah</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Waktu Absen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {absensiHistory?.map((absen) => (
                      <TableRow key={absen.id}>
                        <TableCell>{new Date(absen.tanggal).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>{absen.waktu_mulai}</TableCell>
                        <TableCell className="font-medium">{absen.kelas_nama}</TableCell>
                        <TableCell>{absen.matakuliah_nama}</TableCell>
                        <TableCell>
                          <Badge variant={
                            absen.status === 'hadir' ? 'default' : 
                            absen.status === 'izin' || absen.status === 'sakit' ? 'secondary' : 
                            'destructive'
                          }>
                            {absen.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {absen.waktu_absen 
                            ? new Date(absen.waktu_absen).toLocaleTimeString('id-ID')
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Absen */}
        <Dialog open={isAbsenDialogOpen} onOpenChange={setIsAbsenDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Absensi</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitAbsen}>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Upload Foto Wajah (Opsional)</label>
                  <Input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload foto wajah untuk verifikasi kehadiran
                  </p>
                </div>
                {fotoWajah && (
                  <div className="text-sm text-muted-foreground">
                    File dipilih: {fotoWajah.name}
                  </div>
                )}
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={handleCloseAbsenDialog}>
                  Batal
                </Button>
                <Button type="submit" disabled={absensiMutation.isPending}>
                  {absensiMutation.isPending ? "Mengirim..." : "Kirim Absensi"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default StudentDashboard;
