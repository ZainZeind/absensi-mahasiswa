import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiDelete } from "@/services/api";
import { Plus, Trash2 } from "lucide-react";

interface Enrollment {
  id: number;
  kelas_id: number;
  mahasiswa_id: number;
  kelas_nama: string;
  matakuliah_nama: string;
  mahasiswa_nama: string;
  mahasiswa_nim: string;
  tanggal_enroll: string;
}

interface Kelas {
  id: number;
  nama: string;
  matakuliah_nama: string;
}

interface Mahasiswa {
  id: number;
  nim: string;
  nama: string;
  jurusan: string;
}

const EnrollmentManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedMahasiswa, setSelectedMahasiswa] = useState("");

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["enrollments"],
    queryFn: async () => {
      const response = await apiGet<Enrollment[]>("/enrollment");
      return response.data;
    }
  });

  const { data: kelasList } = useQuery({
    queryKey: ["kelas"],
    queryFn: async () => {
      const response = await apiGet<Kelas[]>("/kelas");
      return response.data;
    }
  });

  const { data: mahasiswaList } = useQuery({
    queryKey: ["mahasiswa"],
    queryFn: async () => {
      const response = await apiGet<Mahasiswa[]>("/mahasiswa");
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost("/enrollment", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      toast({ title: "Berhasil", description: "Mahasiswa berhasil didaftarkan ke kelas" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Gagal mendaftarkan mahasiswa",
        variant: "destructive" 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/enrollment/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      toast({ title: "Berhasil", description: "Enrollment berhasil dihapus" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKelas || !selectedMahasiswa) {
      toast({
        title: "Error",
        description: "Pilih kelas dan mahasiswa terlebih dahulu",
        variant: "destructive"
      });
      return;
    }
    createMutation.mutate({
      kelas_id: parseInt(selectedKelas),
      mahasiswa_id: parseInt(selectedMahasiswa)
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Yakin ingin menghapus enrollment ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedKelas("");
    setSelectedMahasiswa("");
  };

  if (isLoading) return <div className="flex justify-center p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Enrollment Mahasiswa</h2>
          <p className="text-muted-foreground">Kelola pendaftaran mahasiswa ke kelas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCloseDialog}>
              <Plus className="mr-2 h-4 w-4" /> Daftarkan Mahasiswa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Daftarkan Mahasiswa ke Kelas</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
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
                          {kelas.nama} - {kelas.matakuliah_nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Pilih Mahasiswa</label>
                  <Select value={selectedMahasiswa} onValueChange={setSelectedMahasiswa} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Mahasiswa" />
                    </SelectTrigger>
                    <SelectContent>
                      {mahasiswaList?.map((mhs) => (
                        <SelectItem key={mhs.id} value={mhs.id.toString()}>
                          {mhs.nim} - {mhs.nama} ({mhs.jurusan})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>Batal</Button>
                <Button type="submit">Daftarkan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Enrollment</CardTitle>
          <CardDescription>Total: {enrollments?.length || 0} enrollment</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIM</TableHead>
                <TableHead>Nama Mahasiswa</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Mata Kuliah</TableHead>
                <TableHead>Tanggal Daftar</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments?.map((enroll) => (
                <TableRow key={enroll.id}>
                  <TableCell className="font-medium">{enroll.mahasiswa_nim}</TableCell>
                  <TableCell>{enroll.mahasiswa_nama}</TableCell>
                  <TableCell>{enroll.kelas_nama}</TableCell>
                  <TableCell>{enroll.matakuliah_nama}</TableCell>
                  <TableCell>{new Date(enroll.tanggal_enroll).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(enroll.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnrollmentManagement;
