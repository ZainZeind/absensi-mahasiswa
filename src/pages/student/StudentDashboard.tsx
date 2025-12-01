import { useState, useRef } from "react";
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
import { BookOpen, Calendar, Clock, LogOut, Camera, CheckCircle, Video, X, Upload } from "lucide-react";

interface EnrolledKelas {
  id: number;
  kelas_id: number;
  kelas_nama: string;
  matakuliah_nama: string;
  matakuliah_kode: string;
  sks: number;
  dosen_nama: string;
  dosen_nidn: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruang: string;
  tanggal_enroll: string;
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
  status: "active" | "completed" | "scheduled";
}

interface AbsensiHistory {
  id: number;
  sesi_id: number;
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
  const [captureMode, setCaptureMode] = useState<'upload' | 'camera'>('camera');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
    formData.append("metode", "webcam");
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
    stopCamera();
    setIsAbsenDialogOpen(false);
    setSelectedSesi(null);
    setFotoWajah(null);
    setCapturedImage(null);
    setCaptureMode('camera');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFotoWajah(e.target.files[0]);
      setCapturedImage(null);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.",
        variant: "destructive" 
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
        
        // Convert base64 to file
        fetch(imageData)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            setFotoWajah(file);
          });
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setFotoWajah(null);
    startCamera();
  };

  const stats = {
    totalKelas: enrolledKelas?.length || 0,
    sesiAktif: activeSessions?.length || 0,
    totalKehadiran: absensiHistory?.filter(a => a.status === 'hadir').length || 0
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
                  <span className="text-lg font-semibold text-white">{getInitials(user?.username || 'S')}</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">Dashboard Mahasiswa</h1>
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
                  <p className="text-sm text-muted-foreground mb-1">Sesi Aktif</p>
                  <p className="text-3xl font-semibold text-foreground">{stats.sesiAktif}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-200 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Kehadiran</p>
                  <p className="text-3xl font-semibold text-foreground">{stats.totalKehadiran}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-300 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-blue-800" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="jadwal" className="space-y-6">
          <TabsList className="bg-card border border-border p-1">
            <TabsTrigger value="jadwal" className="data-[state=active]:bg-primary data-[state=active]:text-white">Jadwal Kelas</TabsTrigger>
            <TabsTrigger value="sesi" className="data-[state=active]:bg-primary data-[state=active]:text-white">Sesi Aktif</TabsTrigger>
            <TabsTrigger value="riwayat" className="data-[state=active]:bg-primary data-[state=active]:text-white">Riwayat Absensi</TabsTrigger>
          </TabsList>

          {/* Tab Jadwal Kelas */}
          <TabsContent value="jadwal" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-semibold">Kelas yang Diikuti</CardTitle>
                <CardDescription className="text-sm">Daftar kelas semester ini</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Mata Kuliah</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>SKS</TableHead>
                      <TableHead>Dosen</TableHead>
                      <TableHead>Jadwal</TableHead>
                      <TableHead>Ruang</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrolledKelas?.map((kelas) => (
                      <TableRow key={kelas.id}>
                        <TableCell className="font-mono text-sm">{kelas.matakuliah_kode}</TableCell>
                        <TableCell className="font-medium">{kelas.matakuliah_nama}</TableCell>
                        <TableCell>{kelas.kelas_nama}</TableCell>
                        <TableCell>{kelas.sks}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{kelas.dosen_nama}</div>
                            <div className="text-xs text-muted-foreground">NIDN: {kelas.dosen_nidn}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{kelas.hari}</div>
                            <div className="text-muted-foreground">{kelas.jam_mulai} - {kelas.jam_selesai}</div>
                          </div>
                        </TableCell>
                        <TableCell>{kelas.ruang}</TableCell>
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
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="font-mono text-xs">{sesi.matakuliah_kode}</Badge>
                                  <Badge variant="default">AKTIF</Badge>
                                </div>
                                <CardTitle className="text-lg">{sesi.matakuliah_nama}</CardTitle>
                                <CardDescription className="mt-1">
                                  <div className="space-y-1">
                                    <div><strong>Kelas:</strong> {sesi.kelas_nama} | {sesi.ruang}</div>
                                    <div><strong>Dosen:</strong> {sesi.dosen_nama} (NIDN: {sesi.dosen_nidn})</div>
                                    {sesi.materi && <div><strong>Materi:</strong> {sesi.materi}</div>}
                                  </div>
                                </CardDescription>
                              </div>
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
                                  {sesi.jam_mulai} - {sesi.jam_selesai}
                                </div>
                              </div>
                              {sudahAbsen && (
                                <Badge variant="secondary">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Sudah Absen
                                </Badge>
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
                      <TableHead>Kode</TableHead>
                      <TableHead>Mata Kuliah</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Dosen</TableHead>
                      <TableHead>Jam</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Waktu Absen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {absensiHistory?.map((absen) => (
                      <TableRow key={absen.id}>
                        <TableCell>{new Date(absen.tanggal).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell className="font-mono text-xs">{absen.matakuliah_kode}</TableCell>
                        <TableCell className="font-medium">{absen.matakuliah_nama}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{absen.kelas_nama}</div>
                            <div className="text-xs text-muted-foreground">{absen.ruang}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{absen.dosen_nama}</div>
                            <div className="text-xs text-muted-foreground">NIDN: {absen.dosen_nidn}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{absen.jam_mulai} - {absen.jam_selesai}</TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              absen.status === 'hadir' 
                                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                                : absen.status === 'izin' || absen.status === 'sakit'
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                            }
                          >
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit Absensi</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitAbsen}>
              <div className="space-y-4">
                {/* Mode Toggle */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={captureMode === 'camera' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => {
                      setCaptureMode('camera');
                      setCapturedImage(null);
                      setFotoWajah(null);
                      if (!isCameraActive && !capturedImage) {
                        startCamera();
                      }
                    }}
                  >
                    <Video className="mr-2 h-4 w-4" />
                    Ambil Foto
                  </Button>
                  <Button
                    type="button"
                    variant={captureMode === 'upload' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => {
                      setCaptureMode('upload');
                      stopCamera();
                      setCapturedImage(null);
                    }}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                </div>

                {/* Camera Mode */}
                {captureMode === 'camera' && (
                  <div className="space-y-4">
                    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                      {!capturedImage ? (
                        <>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                          />
                          {!isCameraActive && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                              <Button onClick={startCamera} size="lg">
                                <Camera className="mr-2 h-5 w-5" />
                                Aktifkan Kamera
                              </Button>
                            </div>
                          )}
                          <canvas ref={canvasRef} className="hidden" />
                          
                          {/* Camera Overlay */}
                          {isCameraActive && (
                            <div className="absolute inset-0 pointer-events-none">
                              <div className="absolute inset-0 border-4 border-white/30 rounded-lg m-8"></div>
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <div className="w-48 h-64 border-2 border-white/50 rounded-full"></div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="relative">
                          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={retakePhoto}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Ambil Ulang
                          </Button>
                        </div>
                      )}
                    </div>

                    {isCameraActive && !capturedImage && (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={capturePhoto}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          size="lg"
                        >
                          <Camera className="mr-2 h-5 w-5" />
                          Ambil Foto
                        </Button>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground text-center">
                      Posisikan wajah Anda di tengah frame untuk hasil terbaik
                    </p>
                  </div>
                )}

                {/* Upload Mode */}
                {captureMode === 'upload' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Upload Foto Wajah</label>
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
                      <div className="glass-card p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">File dipilih:</p>
                        <p className="text-sm text-muted-foreground">{fotoWajah.name}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={handleCloseAbsenDialog}>
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={absensiMutation.isPending || (!fotoWajah && !capturedImage)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
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
