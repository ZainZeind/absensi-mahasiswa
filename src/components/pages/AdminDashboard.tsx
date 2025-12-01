import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserCheck,
  BookOpen,
  Monitor,
  TrendingUp,
  Activity,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/services/api';
import { DashboardStats } from '@/types';

const AdminDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  // Fetch dashboard statistics
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => apiGet<DashboardStats>('/reports/dashboard'),
  });

  const stats = dashboardData?.data;

  const recentActivity = stats?.recentActivities?.slice(0, 5) || [];

  const statCards = [
    {
      title: 'Total Mahasiswa',
      value: stats?.base?.totalMahasiswa || 0,
      icon: <Users className="w-5 h-5" />,
      color: 'from-blue-500 to-blue-600',
      change: '+12%',
      changeType: 'increase' as const,
    },
    {
      title: 'Total Dosen',
      value: stats?.base?.totalDosen || 0,
      icon: <UserCheck className="w-5 h-5" />,
      color: 'from-green-500 to-green-600',
      change: '+5%',
      changeType: 'increase' as const,
    },
    {
      title: 'Total Kelas',
      value: stats?.base?.totalKelas || 0,
      icon: <BookOpen className="w-5 h-5" />,
      color: 'from-purple-500 to-purple-600',
      change: '+8%',
      changeType: 'increase' as const,
    },
    {
      title: 'Device Online',
      value: stats?.base?.activeDevices || 0,
      icon: <Monitor className="w-5 h-5" />,
      color: 'from-orange-500 to-orange-600',
      change: '+2',
      changeType: 'increase' as const,
      subtitle: `dari ${stats?.base?.totalDevices || 0} total`,
    },
  ];

  const attendanceStats = [
    {
      label: 'Hadir',
      value: stats?.today?.hadir || 0,
      percentage: stats?.today?.hadirPercentage || 0,
      color: 'bg-green-500',
      icon: <CheckCircle className="w-4 h-4" />,
    },
    {
      label: 'Alfa',
      value: stats?.today?.alfa || 0,
      percentage: 100 - (stats?.today?.hadirPercentage || 0),
      color: 'bg-red-500',
      icon: <AlertTriangle className="w-4 h-4" />,
    },
  ];

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
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-600">Monitor sistem absensi kampus secara real-time</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 p-1">
            {(['today', 'week', 'month'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="capitalize"
              >
                {range === 'today' ? 'Hari Ini' : range === 'week' ? 'Minggu Ini' : 'Bulan Ini'}
              </Button>
            ))}
          </div>
          <Button>
            <Calendar className="w-4 h-4 mr-2" />
            Export Laporan
          </Button>
        </div>
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
                    <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                    {stat.subtitle && (
                      <p className="text-xs text-gray-500">{stat.subtitle}</p>
                    )}
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">{stat.change}</span>
                      <span className="text-sm text-gray-500 ml-1">dari bulan lalu</span>
                    </div>
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

      {/* Attendance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Overview Kehadiran Hari Ini
            </CardTitle>
            <CardDescription>
              Statistik kehadiran mahasiswa untuk hari ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Sesi Aktif</span>
                <span className="text-2xl font-bold">{stats?.today?.totalSessions || 0}</span>
              </div>
              <div className="space-y-3">
                {attendanceStats.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {item.icon}
                        <span className="ml-2 text-sm font-medium">{item.label}</span>
                      </div>
                      <span className="font-bold">{item.value}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Persentase Kehadiran</span>
                  <span className="text-lg font-bold text-blue-600">
                    {stats?.today?.hadirPercentage?.toFixed(1) || 0}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="w-5 h-5 mr-2" />
              Status Perangkat
            </CardTitle>
            <CardDescription>
              Monitoring status device face recognition
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Device</span>
                <span className="font-bold">{stats?.base?.totalDevices || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Device Online</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {stats?.base?.activeDevices || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Device Offline</span>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {(stats?.base?.totalDevices || 0) - (stats?.base?.activeDevices || 0)}
                </Badge>
              </div>
              <Button variant="outline" className="w-full mt-4">
                <MapPin className="w-4 h-4 mr-2" />
                Lihat Lokasi Device
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Aktivitas Terkini
          </CardTitle>
          <CardDescription>
            Log aktivitas absensi terbaru
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'hadir' ? 'bg-green-500' :
                      activity.status === 'izin' ? 'bg-yellow-500' :
                      activity.status === 'sakit' ? 'bg-blue-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="font-medium">
                        {activity.mahasiswa?.nama || 'Unknown Mahasiswa'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.sesiAbsensi?.kelas?.matkul?.nama || 'Unknown Kelas'} -
                        {activity.sesiAbsensi?.kelas?.ruang || 'Unknown Room'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      activity.status === 'hadir' ? 'default' :
                      activity.status === 'izin' ? 'secondary' :
                      activity.status === 'sakit' ? 'outline' : 'destructive'
                    }>
                      {activity.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.waktuAbsen).toLocaleTimeString('id-ID')}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">Belum ada aktivitas terkini</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;