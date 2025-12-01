import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut } from "@/services/api";
import { BookOpen, Users, Calendar, LogOut, Plus, Camera } from "lucide-react";

interface Kelas {
  id: number;
  nama: string;
  matakuliah_nama: string;
  matakuliah_kode: string;
  sks: number;
  semester: number;
  dosen_nama: string;
  dosen_nidn: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruang: string;
  total_mahasiswa?: number;
}

interface SesiAbsensi {
  id: number;
  kelas_id: number;
  kelas_nama: string;
  matakuliah_nama: string;
  matakuliah_kode: string;
  sks: number;
  dosen_nama: string;
  dosen_nidn: string;
  ruang: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  materi: string;
  status: "active" | "completed" | "scheduled" | "cancelled";
  total_hadir?: number;
  total_mahasiswa?: number;
}

interface Absensi {
  id: number;
  mahasiswa_id: number;
  mahasiswa_nim: string;
  mahasiswa_nama: string;
  status: "hadir" | "tidak_hadir" | "izin" | "sakit";
  waktu_absen?: string;
}

const LecturerDashboard = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedSesi, setSelectedSesi] = useState<number | null>(null);
  const [tanggal, setTanggal] = useState("");
  const [waktuMulai, setWaktuMulai] = useState("");
  const [waktuSelesai, setWaktuSelesai] = useState("");

  // Fetch kelas yang diajar oleh dosen ini
  const { data: kelasList } = useQuery({
    queryKey: ["kelas-dosen", user?.id],
    queryFn: async () => {
      console.log('Fetching kelas for dosen, user:', user);
      const response = await apiGet<Kelas[]>("/kelas");
      console.log('Kelas response:', response);
      return response.data;
    }
  });

  // Fetch semua sesi absensi
  const { data: sesiList } = useQuery({
    queryKey: ["sesi-absensi", user?.id],
    queryFn: async () => {
      const response = await apiGet<SesiAbsensi[]>("/sesi");
      // Filter hanya kelas yang diajar dosen ini
      return response.data.filter(sesi => 
        kelasList?.some(kelas => kelas.id === sesi.kelas_id)
      );
    },
    enabled: !!kelasList
  });

  // Fetch mahasiswa di kelas tertentu
  const { data: mahasiswaList } = useQuery({
    queryKey: ["enrollment", selectedSesi],
    queryFn: async () => {
      if (!selectedSesi) return [];
      const sesi = sesiList?.find(s => s.id === selectedSesi);
      if (!sesi) return [];
      const response = await apiGet<any[]>(`/enrollment?kelas_id=${sesi.kelas_id}`);
      return response.data;
    },
    enabled: !!selectedSesi
  });

  // Fetch absensi untuk sesi tertentu
  const { data: absensiList } = useQuery({
    queryKey: ["absensi", selectedSesi],
    queryFn: async () => {
      if (!selectedSesi) return [];
      const response = await apiGet<Absensi[]>(`/absensi?sesi_id=${selectedSesi}`);
      return response.data;
    },
    enabled: !!selectedSesi
  });

  // Mutation untuk create sesi
  const createSesiMutation = useMutation({
    mutationFn: (data: any) => {
      console.log('Mutation sending data:', data);
      return apiPost("/sesi", data);
    },
    onSuccess: (response) => {
      console.log('Sesi created successfully:', response);
      queryClient.invalidateQueries({ queryKey: ["sesi-absensi"] });
      toast({ title: "Berhasil", description: "Sesi absensi berhasil dibuat", duration: 3000 });
      handleCloseCreateDialog();
    },
    onError: (error: any) => {
      console.error('Error creating sesi:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || error.response?.data?.details || error.message || "Gagal membuat sesi absensi",
        variant: "destructive",
        duration: 7000
      });
    }
  });

  // Mutation untuk update status absensi
  const updateAbsensiMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      apiPut(`/absensi/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absensi"] });
      toast({ title: "Berhasil", description: "Status absensi diupdate" });
    }
  });

  // Mutation untuk mengubah status sesi (activate/deactivate)
  const updateSesiStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      apiPut(`/sesi/${id}/status`, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sesi-absensi"] });
      const statusText = variables.status === 'active' ? 'diaktifkan' : 
                        variables.status === 'completed' ? 'diselesaikan' : 
                        variables.status === 'scheduled' ? 'dijadwalkan' : 'dibatalkan';
      toast({ title: "Berhasil", description: `Sesi berhasil ${statusText}` });
    }
  });

  const handleCreateSesi = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating sesi with:', { selectedKelas, tanggal, waktuMulai, waktuSelesai });
    
    if (!selectedKelas || !tanggal || !waktuMulai || !waktuSelesai) {
      console.error('Validation failed - missing fields');
      toast({ title: "Error", description: "Lengkapi semua field", variant: "destructive" });
      return;
    }
    
    const payload = {
      kelas_id: parseInt(selectedKelas),
      tanggal,
      jam_mulai: waktuMulai,
      jam_selesai: waktuSelesai,
      status: "scheduled"
    };
    
    console.log('Sending payload:', payload);
    createSesiMutation.mutate(payload);
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setSelectedKelas("");
    setTanggal("");
    setWaktuMulai("");
    setWaktuSelesai("");
  };

  const handleUpdateStatus = (absensiId: number, status: string) => {
    updateAbsensiMutation.mutate({ id: absensiId, status });
  };

  const stats = {
    totalKelas: kelasList?.length || 0,
    totalMahasiswa: kelasList?.reduce((sum, kelas) => sum + (kelas.total_mahasiswa || 0), 0) || 0,
    sesiHariIni: sesiList?.filter(s => s.tanggal === new Date().toISOString().split('T')[0]).length || 0
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
                  <span className="text-lg font-semibold text-white">{getInitials(user?.username || 'D')}</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">Dashboard Dosen</h1>
                  <p className="text-xs text-muted-foreground">{user?.username}</p>
                </div>
              </div>
            </div>
            <Button onClick={logout} variant="ghost" size="sm" className="hover:bg-blue-50">
              <LogOut className="mr-2 h-4 w-4" /> Keluar
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Kelas Saya</p>
                  <p className="text-3xl font-semibold text-foreground">{stats.totalKelas}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Mahasiswa</p>
                  <p className="text-3xl font-semibold text-foreground">{stats.totalMahasiswa}</p>
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
                  <p className="text-sm text-muted-foreground mb-1">Sesi Hari Ini</p>
                  <p className="text-3xl font-semibold text-foreground">{stats.sesiHariIni}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-300 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-800" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="kelas" className="space-y-6">
          <TabsList className="bg-card border border-border p-1">
            <TabsTrigger value="kelas" className="data-[state=active]:bg-primary data-[state=active]:text-white">Kelas Saya</TabsTrigger>
            <TabsTrigger value="sesi" className="data-[state=active]:bg-primary data-[state=active]:text-white">Sesi Absensi</TabsTrigger>
          </TabsList>

          {/* Tab Kelas */}
          <TabsContent value="kelas" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle>Daftar Kelas</CardTitle>
                <CardDescription>Kelas yang Anda ajar</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Mata Kuliah</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>SKS</TableHead>
                      <TableHead>Jadwal</TableHead>
                      <TableHead>Ruang</TableHead>
                      <TableHead>Mahasiswa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kelasList?.map((kelas) => (
                      <TableRow key={kelas.id}>
                        <TableCell className="font-mono text-xs">{kelas.matakuliah_kode}</TableCell>
                        <TableCell className="font-medium">{kelas.matakuliah_nama}</TableCell>
                        <TableCell>{kelas.nama}</TableCell>
                        <TableCell>{kelas.sks}</TableCell>
                        <TableCell className="text-sm">
                          <div>{kelas.hari}</div>
                          <div className="text-muted-foreground text-xs">{kelas.jam_mulai} - {kelas.jam_selesai}</div>
                        </TableCell>
                        <TableCell>{kelas.ruang}</TableCell>
                        <TableCell>{kelas.total_mahasiswa || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Sesi */}
          <TabsContent value="sesi" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Kelola Sesi Absensi</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    const activeSesi = sesiList?.find(s => s.status === 'active');
                    if (activeSesi) {
                      navigate(`/dashboard/camera-absensi?sesi_id=${activeSesi.id}`);
                    } else {
                      toast({ 
                        title: "Tidak ada sesi aktif", 
                        description: "Aktifkan sesi terlebih dahulu untuk menggunakan kamera",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <Camera className="mr-2 h-4 w-4" /> Buka Kamera Absensi
                </Button>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Buat Sesi Baru
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Buat Sesi Absensi</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateSesi}>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Pilih Kelas</label>
                        <Select value={selectedKelas} onValueChange={setSelectedKelas} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Kelas" />
                          </SelectTrigger>
                          <SelectContent>
                            {kelasList?.map((kelas) => (
                              <SelectItem key={kelas.id} value={kelas.id.toString()}>
                                {kelas.matakuliah_kode} - {kelas.matakuliah_nama} ({kelas.nama})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Tanggal</label>
                        <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Waktu Mulai</label>
                        <Input type="time" value={waktuMulai} onChange={(e) => setWaktuMulai(e.target.value)} required />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Waktu Selesai</label>
                        <Input type="time" value={waktuSelesai} onChange={(e) => setWaktuSelesai(e.target.value)} required />
                      </div>
                    </div>
                    <DialogFooter className="mt-6">
                      <Button type="button" variant="outline" onClick={handleCloseCreateDialog}>Batal</Button>
                      <Button type="submit">Buat Sesi</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Daftar Sesi</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Mata Kuliah</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jam</TableHead>
                      <TableHead>Ruang</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Kehadiran</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sesiList?.map((sesi) => (
                      <TableRow key={sesi.id}>
                        <TableCell className="font-mono text-xs">{sesi.matakuliah_kode}</TableCell>
                        <TableCell className="font-medium">{sesi.matakuliah_nama}</TableCell>
                        <TableCell>{sesi.kelas_nama}</TableCell>
                        <TableCell>{new Date(sesi.tanggal).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell className="text-sm">{sesi.jam_mulai} - {sesi.jam_selesai}</TableCell>
                        <TableCell>{sesi.ruang}</TableCell>
                        <TableCell>
                          <Badge variant={
                            sesi.status === 'active' ? 'default' : 
                            sesi.status === 'completed' ? 'secondary' : 
                            sesi.status === 'cancelled' ? 'destructive' : 
                            'outline'
                          }>
                            {sesi.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{sesi.total_hadir || 0} / {sesi.total_mahasiswa || 0}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {sesi.status === 'scheduled' && (
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => updateSesiStatusMutation.mutate({ id: sesi.id, status: 'active' })}
                              >
                                Aktifkan
                              </Button>
                            )}
                            {sesi.status === 'active' && (
                              <Button 
                                size="sm" 
                                variant="secondary"
                                onClick={() => updateSesiStatusMutation.mutate({ id: sesi.id, status: 'completed' })}
                              >
                                Selesaikan
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => setSelectedSesi(sesi.id)}>
                              Kelola
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Detail Sesi */}
            {selectedSesi && (
              <Card>
                <CardHeader>
                  <CardTitle>Detail Kehadiran</CardTitle>
                  <CardDescription>
                    Sesi: {sesiList?.find(s => s.id === selectedSesi)?.kelas_nama}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>NIM</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Waktu Absen</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mahasiswaList?.map((mhs: any) => {
                        const absensi = absensiList?.find(a => a.mahasiswa_id === mhs.mahasiswa_id);
                        return (
                          <TableRow key={mhs.mahasiswa_id}>
                            <TableCell>{mhs.mahasiswa_nim}</TableCell>
                            <TableCell>{mhs.mahasiswa_nama}</TableCell>
                            <TableCell>
                              {absensi ? (
                                <Badge 
                                  className={
                                    absensi.status === 'hadir' 
                                      ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                                      : absensi.status === 'izin' || absensi.status === 'sakit'
                                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                      : 'bg-red-500 hover:bg-red-600 text-white'
                                  }
                                >
                                  {absensi.status}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Belum Absen</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {absensi?.waktu_absen 
                                ? new Date(absensi.waktu_absen).toLocaleTimeString('id-ID') 
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {absensi && (
                                <Select 
                                  value={absensi.status} 
                                  onValueChange={(val) => handleUpdateStatus(absensi.id, val)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="hadir">Hadir</SelectItem>
                                    <SelectItem value="tidak_hadir">Tidak Hadir</SelectItem>
                                    <SelectItem value="izin">Izin</SelectItem>
                                    <SelectItem value="sakit">Sakit</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
};

export default LecturerDashboard;
