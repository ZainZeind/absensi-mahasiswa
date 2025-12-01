import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Fingerprint,
  Camera,
  Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/services/api';
import { DashboardStats, Kelas, Absensi } from '@/types';

const MahasiswaDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  // Fetch dashboard statistics
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'mahasiswa'],
    queryFn: () => apiGet<DashboardStats>('/reports/dashboard'),
  });

  const stats = dashboardData?.data;
  const enrolledClasses = stats?.mahasiswa?.enrolledClasses || [];
  const recentAttendances = stats?.mahasiswa?.recentAbsensis || [];

  const attendanceStats = [
    {
      label: 'Hadir',
      value: stats?.mahasiswa?.hadir || 0,
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'bg-green-500',
    },
    {
      label: 'Izin',
      value: stats?.mahasiswa?.izin || 0,
      icon: <AlertCircle className="w-4 h-4" />,
      color: 'bg-yellow-500',
    },
    {
      label: 'Sakit',
      value: stats?.mahasiswa?.sakit || 0,
      icon: <AlertCircle className="w-4 h-4" />,
      color: 'bg-blue-500',
    },
    {
      label: 'Alfa',
      value: stats?.mahasiswa?.alfa || 0,
      icon: <AlertCircle className="w-4 h-4" />,
      color: 'bg-red-500',
    },
  ];

  const getTodaySchedule = () => {
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
    return enrolledClasses.filter(kelas => kelas.hari === today);
  };

  const todaySchedule = getTodaySchedule();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error memuat data</h3>
        <p className="text-gray-600">Terjadi kesalahan saat memuat data dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Mahasiswa</h1>
          <p className="text-gray-600">
            Selamat datang, {stats?.mahasiswa?.enrolledClasses?.[0]?.mahasiswas?.[0]?.nama || 'Mahasiswa'}
          </p>
        </div>
        <Button onClick={() => navigate('/mahasiswa/profile')}>
          <User className="w-4 h-4 mr-2" />
          Profil Saya
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Absensi</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.mahasiswa?.totalAbsensi || 0}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tingkat Kehadiran</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.mahasiswa?.kehadiranPersentase?.toFixed(1) || 0}%
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg text-green-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Kelas Diambil</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {enrolledClasses.length}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg text-purple-600">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status Foto</p>
                  <p className="text-lg font-bold text-green-600">Terverifikasi</p>
                </div>
                <div className="bg-cyan-100 p-3 rounded-lg text-cyan-600">
                  <Fingerprint className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Rekap Kehadiran
            </CardTitle>
            <CardDescription>
              Statistik kehadiran Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {attendanceStats.map((stat, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      {stat.icon}
                      <span className="ml-2 text-sm font-medium">{stat.label}</span>
                    </div>
                    <span className="font-bold">{stat.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${stat.color} h-2 rounded-full transition-all duration-300`}
                      style={{
                        width: `${(stat.value / (stats?.mahasiswa?.totalAbsensi || 1)) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Jadwal Hari Ini
            </CardTitle>
            <CardDescription>
              Kelas yang Anda ikuti hari ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todaySchedule.length > 0 ? (
              <div className="space-y-4">
                {todaySchedule.map((kelas, index) => (
                  <motion.div
                    key={kelas.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{kelas.nama}</h3>
                        <p className="text-sm text-gray-600">{kelas.matkul?.nama}</p>
                        <p className="text-xs text-gray-500">Pengampu: {kelas.dosen?.nama}</p>
                      </div>
                      <Badge variant="outline">
                        {kelas.hari}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {kelas.jamMulai} - {kelas.jamSelesai}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {kelas.ruang}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        <Camera className="w-3 h-3 mr-1" />
                        Face Recognition
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">Tidak ada jadwal kelas hari ini</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Riwayat Absensi
          </CardTitle>
          <CardDescription>
            Histori kehadiran Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recent" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recent">Terbaru</TabsTrigger>
              <TabsTrigger value="all">Semua</TabsTrigger>
            </TabsList>
            <TabsContent value="recent" className="space-y-4">
              {recentAttendances.length > 0 ? (
                <div className="space-y-4">
                  {recentAttendances.map((attendance, index) => (
                    <motion.div
                      key={attendance.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {attendance.sesiAbsensi?.kelas?.matkul?.nama || 'Unknown Kelas'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(attendance.waktuAbsen).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(attendance.waktuAbsen).toLocaleTimeString('id-ID')}
                        </p>
                      </div>
                      <Badge variant={
                        attendance.status === 'hadir' ? 'default' :
                        attendance.status === 'izin' ? 'secondary' :
                        attendance.status === 'sakit' ? 'outline' : 'destructive'
                      }>
                        {attendance.status}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">Belum ada riwayat absensi</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="all" className="space-y-4">
              <div className="text-center py-8">
                <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">
                  Klik tombol di bawah untuk melihat riwayat lengkap
                </p>
                <Button className="mt-4" onClick={() => navigate('/mahasiswa/riwayat')}>
                  Lihat Riwayat Lengkap
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default MahasiswaDashboard;