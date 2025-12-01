import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/services/api";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface MataKuliah {
  id: number;
  kode: string;
  nama: string;
  sks: number;
  semester?: number;
}

const MataKuliahManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    kode: "",
    nama: "",
    sks: 3,
    semester: 1
  });

  const { data: matakuliahData, isLoading } = useQuery({
    queryKey: ["matakuliah"],
    queryFn: async () => {
      const response = await apiGet<MataKuliah[]>("/matakuliah");
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost("/matakuliah", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matakuliah"] });
      toast({ title: "Berhasil", description: "Mata kuliah berhasil ditambahkan" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Gagal menambahkan mata kuliah",
        variant: "destructive",
        duration: 7000
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiPut(`/matakuliah/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matakuliah"] });
      toast({ title: "Berhasil", description: "Mata kuliah berhasil diupdate" });
      handleCloseDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/matakuliah/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matakuliah"] });
      toast({ title: "Berhasil", description: "Mata kuliah berhasil dihapus" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (mk: MataKuliah) => {
    setEditingId(mk.id);
    setFormData({
      kode: mk.kode,
      nama: mk.nama,
      sks: mk.sks,
      semester: mk.semester || 1
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Yakin ingin menghapus mata kuliah ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({ kode: "", nama: "", sks: 3, semester: 1 });
  };

  if (isLoading) return <div className="flex justify-center p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Data Mata Kuliah</h2>
          <p className="text-muted-foreground">Kelola mata kuliah</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCloseDialog}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Mata Kuliah
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Tambah"} Mata Kuliah</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label>Kode</Label>
                  <Input value={formData.kode} onChange={(e) => setFormData({ ...formData, kode: e.target.value })} required />
                </div>
                <div>
                  <Label>Nama Mata Kuliah</Label>
                  <Input value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} required />
                </div>
                <div>
                  <Label>SKS</Label>
                  <Input type="number" min="1" max="6" value={formData.sks} onChange={(e) => setFormData({ ...formData, sks: parseInt(e.target.value) })} required />
                </div>
                <div>
                  <Label>Semester</Label>
                  <Input type="number" min="1" max="14" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })} />
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
          <CardTitle>Daftar Mata Kuliah</CardTitle>
          <CardDescription>Total: {matakuliahData?.length || 0} mata kuliah</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>SKS</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matakuliahData?.map((mk) => (
                <TableRow key={mk.id}>
                  <TableCell className="font-medium">{mk.kode}</TableCell>
                  <TableCell>{mk.nama}</TableCell>
                  <TableCell>{mk.sks}</TableCell>
                  <TableCell>{mk.semester || "-"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(mk)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(mk.id)}>
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

export default MataKuliahManagement;
