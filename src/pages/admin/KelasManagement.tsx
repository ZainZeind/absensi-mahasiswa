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
  kode: string;
  nama: string;
  matkul_id: number;
  dosen_id: number;
  semester: number;
  tahun_ajaran: string;
  ruangan?: string;
  matakuliah_nama?: string;
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
    kode: "",
    nama: "",
    matkul_id: "",
    dosen_id: "",
    semester: 1,
    tahun_ajaran: "2024/2025",
    ruangan: ""
  });

  const { data: kelasData, isLoading } = useQuery({
    queryKey: ["kelas"],
    queryFn: async () => {
      const response = await apiGet<Kelas[]>("/kelas");
      return response.data;
    }
  });

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
      toast({ title: "Berhasil", description: "Kelas berhasil ditambahkan" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Gagal menambahkan kelas",
        variant: "destructive" 
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
      kode: kelas.kode,
      nama: kelas.nama,
      matkul_id: kelas.matkul_id.toString(),
      dosen_id: kelas.dosen_id.toString(),
      semester: kelas.semester,
      tahun_ajaran: kelas.tahun_ajaran,
      ruangan: kelas.ruangan || ""
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
      kode: "", 
      nama: "", 
      matkul_id: "", 
      dosen_id: "", 
      semester: 1, 
      tahun_ajaran: "2024/2025",
      ruangan: ""
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Kode Kelas</Label>
                    <Input value={formData.kode} onChange={(e) => setFormData({ ...formData, kode: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Nama Kelas</Label>
                    <Input value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} required />
                  </div>
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
                    <Label>Semester</Label>
                    <Input type="number" min="1" max="14" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })} required />
                  </div>
                  <div>
                    <Label>Tahun Ajaran</Label>
                    <Input value={formData.tahun_ajaran} onChange={(e) => setFormData({ ...formData, tahun_ajaran: e.target.value })} required placeholder="2024/2025" />
                  </div>
                </div>

                <div>
                  <Label>Ruangan</Label>
                  <Input value={formData.ruangan} onChange={(e) => setFormData({ ...formData, ruangan: e.target.value })} placeholder="Contoh: A301" />
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
                <TableHead>Kode</TableHead>
                <TableHead>Nama Kelas</TableHead>
                <TableHead>Mata Kuliah</TableHead>
                <TableHead>Dosen</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Tahun Ajaran</TableHead>
                <TableHead>Ruangan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kelasData?.map((kelas) => (
                <TableRow key={kelas.id}>
                  <TableCell className="font-medium">{kelas.kode}</TableCell>
                  <TableCell>{kelas.nama}</TableCell>
                  <TableCell>{kelas.matakuliah_nama || "-"}</TableCell>
                  <TableCell>{kelas.dosen_nama || "-"}</TableCell>
                  <TableCell>{kelas.semester}</TableCell>
                  <TableCell>{kelas.tahun_ajaran}</TableCell>
                  <TableCell>{kelas.ruangan || "-"}</TableCell>
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
