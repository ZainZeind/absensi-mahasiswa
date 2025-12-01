import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Play,
  Clock,
  Calendar,
  MapPin,
  BookOpen,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Activity,
  BarChart3,
  Monitor
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/services/api';
import { DashboardStats, Kelas, SesiAbsensi } from '@/types';

const DosenDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Fetch dashboard statistics
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'dosen'],
    queryFn: () => apiGet<DashboardStats>('/reports/dashboard'),
  });

  const stats = dashboardData?.data;
  const dosenClasses = stats?.dosen?.classes || [];

  const statCards = [
    {
      title: 'Kelas Aktif',
      value: dosenClasses.length,
      icon: <BookOpen className="w-5 h-5" />,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Total Mahasiswa',
      value: dosenClasses.reduce((acc, kelas) => acc + (kelas.kapasitas || 0), 0),
      icon: <Users className="w-5 h-5" />,
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Sesi Hari Ini',
      value: stats?.dosen?.todaySessions || 0,
      icon: <Calendar className="w-5 h-5" />,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Tingkat Kehadiran',
      value: `${stats?.dosen?.todayHadirPercentage?.toFixed(1) || 0}%`,
      icon: <UserCheck className="w-5 h-5" />,
      color: 'from-orange-500 to-orange-600',
    },
  ];

  const getTodaySchedule = () => {
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
    return dosenClasses.filter(kelas => kelas.hari === today);
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Dosen</h1>
          <p className="text-gray-600">
            Selamat datang, {stats?.dosen?.classes?.[0]?.dosen?.nama || 'Dosen'}
          </p>
        </div>
        <Button onClick={() => navigate('/dosen/kelas')}>
          <BookOpen className="w-4 h-4 mr-2" />
          Kelola Kelas
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`bg-gradient-to-r ${stat.color} p-3 rounded-lg text-white`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Jadwal Hari Ini
            </CardTitle>
            <CardDescription>
              Kelas yang akan di hari ini
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
                      </div>
                      <Badge variant="outline">
                        {kelas.kapasitas} mahasiswa
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
                      <Button
                        size="sm"
                        onClick={() => navigate(`/dosen/sesi-absensi?kelasId=${kelas.id}`)}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Mulai Absen
                      </Button>
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>
              Akses fitur-fitur yang sering digunakan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/dosen/sesi-absensi')}
            >
              <Activity className="w-4 h-4 mr-2" />
              Kelola Sesi Absensi
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/dosen/laporan')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Laporan Kehadiran
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/dosen/perangkat')}
            >
              <Monitor className="w-4 h-4 mr-2" />
              Status Perangkat
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Sesi Absensi Terkini
          </CardTitle>
          <CardDescription>
            Histori sesi absensi yang telah dijalankan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Sesi Aktif</TabsTrigger>
              <TabsTrigger value="recent">Selesai</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="space-y-4">
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                <p className="text-gray-600">Tidak ada sesi absensi yang sedang aktif</p>
                <Button className="mt-4" onClick={() => navigate('/dosen/sesi-absensi')}>
                  Mulai Sesi Baru
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="recent" className="space-y-4">
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">Belum ada sesi absensi yang selesai</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DosenDashboard;