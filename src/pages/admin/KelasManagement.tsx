import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/services/api";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Kelas {
  id: number;
  nama: string;
  matkul_id: number;
  dosen_id: number;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruang: string;
  kapasitas: number;
  semester: string;
  tahun_ajaran: string;
  mata_kuliah_nama?: string;
  dosen_nama?: string;
}

interface MataKuliah {
  id: number;
  kode: string;
  nama: string;
}

interface Dosen {
  id: number;
  nip: string;
  nama: string;
}

const KelasManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    matkul_id: "",
    dosen_id: "",
    hari: "Senin",
    jam_mulai: "",
    jam_selesai: "",
    ruang: "",
    kapasitas: 30,
    semester: "Ganjil",
    tahun_ajaran: "2024/2025"
  });

  const { data: kelasData, isLoading, error } = useQuery({
    queryKey: ["kelas"],
    queryFn: async () => {
      const response = await apiGet<Kelas[]>("/kelas");
      console.log('Kelas data received:', response);
      return response.data;
    }
  });

  console.log('Kelas list:', kelasData, 'Loading:', isLoading, 'Error:', error);

  const { data: matakuliahData } = useQuery({
    queryKey: ["matakuliah"],
    queryFn: async () => {
      const response = await apiGet<MataKuliah[]>("/matakuliah");
      return response.data;
    }
  });

  const { data: dosenData } = useQuery({
    queryKey: ["dosen"],
    queryFn: async () => {
      const response = await apiGet<Dosen[]>("/dosen");
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost("/kelas", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kelas"] });
      toast({ title: "Berhasil", description: "Kelas berhasil ditambahkan", duration: 3000 });
      handleCloseDialog();
    },
    onError: (error: any) => {
      console.error('Error creating kelas:', error);
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || error.message || "Gagal menambahkan kelas",
        variant: "destructive",
        duration: 7000
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiPut(`/kelas/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kelas"] });
      toast({ title: "Berhasil", description: "Kelas berhasil diupdate" });
      handleCloseDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/kelas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kelas"] });
      toast({ title: "Berhasil", description: "Kelas berhasil dihapus" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      matkul_id: parseInt(formData.matkul_id),
      dosen_id: parseInt(formData.dosen_id)
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (kelas: Kelas) => {
    setEditingId(kelas.id);
    setFormData({
      nama: kelas.nama,
      matkul_id: kelas.matkul_id.toString(),
      dosen_id: kelas.dosen_id.toString(),
      hari: kelas.hari,
      jam_mulai: kelas.jam_mulai,
      jam_selesai: kelas.jam_selesai,
      ruang: kelas.ruang,
      kapasitas: kelas.kapasitas,
      semester: kelas.semester,
      tahun_ajaran: kelas.tahun_ajaran
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Yakin ingin menghapus kelas ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({ 
      nama: "",
      matkul_id: "",
      dosen_id: "",
      hari: "Senin",
      jam_mulai: "",
      jam_selesai: "",
      ruang: "",
      kapasitas: 30,
      semester: "Ganjil",
      tahun_ajaran: "2024/2025"
    });
  };

  if (isLoading) return <div className="flex justify-center p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Data Kelas</h2>
          <p className="text-muted-foreground">Kelola kelas perkuliahan</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCloseDialog}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Kelas
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Tambah"} Kelas</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label>Nama Kelas</Label>
                  <Input value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} required placeholder="Contoh: Kelas A" />
                </div>
                
                <div>
                  <Label>Mata Kuliah</Label>
                  <Select value={formData.matkul_id} onValueChange={(value) => setFormData({ ...formData, matkul_id: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Mata Kuliah" />
                    </SelectTrigger>
                    <SelectContent>
                      {matakuliahData?.map((mk) => (
                        <SelectItem key={mk.id} value={mk.id.toString()}>
                          {mk.kode} - {mk.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Dosen Pengampu</Label>
                  <Select value={formData.dosen_id} onValueChange={(value) => setFormData({ ...formData, dosen_id: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Dosen" />
                    </SelectTrigger>
                    <SelectContent>
                      {dosenData?.map((dosen) => (
                        <SelectItem key={dosen.id} value={dosen.id.toString()}>
                          {dosen.nip} - {dosen.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Hari</Label>
                    <Select value={formData.hari} onValueChange={(value) => setFormData({ ...formData, hari: value })} required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Senin">Senin</SelectItem>
                        <SelectItem value="Selasa">Selasa</SelectItem>
                        <SelectItem value="Rabu">Rabu</SelectItem>
                        <SelectItem value="Kamis">Kamis</SelectItem>
                        <SelectItem value="Jumat">Jumat</SelectItem>
                        <SelectItem value="Sabtu">Sabtu</SelectItem>
                        <SelectItem value="Minggu">Minggu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ruang</Label>
                    <Input value={formData.ruang} onChange={(e) => setFormData({ ...formData, ruang: e.target.value })} required placeholder="Contoh: A301" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Jam Mulai</Label>
                    <Input type="time" value={formData.jam_mulai} onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Jam Selesai</Label>
                    <Input type="time" value={formData.jam_selesai} onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })} required />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Kapasitas</Label>
                    <Input type="number" min="1" value={formData.kapasitas} onChange={(e) => setFormData({ ...formData, kapasitas: parseInt(e.target.value) })} required />
                  </div>
                  <div>
                    <Label>Semester</Label>
                    <Select value={formData.semester} onValueChange={(value) => setFormData({ ...formData, semester: value })} required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ganjil">Ganjil</SelectItem>
                        <SelectItem value="Genap">Genap</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tahun Ajaran</Label>
                    <Input value={formData.tahun_ajaran} onChange={(e) => setFormData({ ...formData, tahun_ajaran: e.target.value })} required placeholder="2024/2025" />
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>Batal</Button>
                <Button type="submit">{editingId ? "Update" : "Simpan"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kelas</CardTitle>
          <CardDescription>Total: {kelasData?.length || 0} kelas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Kelas</TableHead>
                <TableHead>Mata Kuliah</TableHead>
                <TableHead>Dosen</TableHead>
                <TableHead>Jadwal</TableHead>
                <TableHead>Ruang</TableHead>
                <TableHead>Kapasitas</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kelasData?.map((kelas) => (
                <TableRow key={kelas.id}>
                  <TableCell className="font-medium">{kelas.nama}</TableCell>
                  <TableCell>{kelas.mata_kuliah_nama || "-"}</TableCell>
                  <TableCell>{kelas.dosen_nama || "-"}</TableCell>
                  <TableCell>{kelas.hari}, {kelas.jam_mulai}-{kelas.jam_selesai}</TableCell>
                  <TableCell>{kelas.ruang}</TableCell>
                  <TableCell>{kelas.kapasitas}</TableCell>
                  <TableCell>{kelas.semester} {kelas.tahun_ajaran}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(kelas)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(kelas.id)}>
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

export default KelasManagement;
