import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Fingerprint, Shield, Clock, BarChart3, Smartphone, CheckCircle } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(loginForm.username, loginForm.password);

      // Navigate based on user role
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      switch (userInfo.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'dosen':
          navigate('/dosen/dashboard');
          break;
        case 'mahasiswa':
          navigate('/mahasiswa/dashboard');
          break;
        default:
          navigate('/login');
      }
    } catch (error: any) {
      setError(error.message || 'Login gagal. Silakan coba kembali.');
    }
  };

  const features = [
    {
      icon: <Fingerprint className="w-8 h-8 text-purple-600" />,
      title: 'Face Recognition',
      description: 'Teknologi pengenalan wajah canggih untuk memastikan kehadiran otentik',
    },
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: 'Anti Titip Absen',
      description: 'Sistem yang mencegah praktik titip absen dengan validasi biometrik',
    },
    {
      icon: <Clock className="w-8 h-8 text-green-600" />,
      title: 'Real-time Tracking',
      description: 'Pantau kehadiran mahasiswa secara real-time di dalam kelas',
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-orange-600" />,
      title: 'Analytics Dashboard',
      description: 'Analisis kehadiran komprehensif dengan visualisasi data interaktif',
    },
    {
      icon: <Smartphone className="w-8 h-8 text-pink-600" />,
      title: 'Multi-Device Support',
      description: 'Kompatibel dengan berbagai perangkat scanning dan kamera',
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-cyan-600" />,
      title: '100% Accurate',
      description: 'Akurasi tinggi dalam pengenalan wajah dan validasi kehadiran',
    },
  ];

  const stats = [
    { label: 'Titip Absen', value: '0%', description: 'Dengan sistem face recognition' },
    { label: 'Akurasi', value: '99.9%', description: 'Dalam pengenalan wajah' },
    { label: 'Waktu Proses', value: '< 2s', description: 'Per mahasiswa' },
    { label: 'Kampus', value: '100+', description: 'Telah menggunakan sistem kami' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2">
                <Fingerprint className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FaceAbsensi Kampus
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Masuk
              </Button>
              <Button onClick={() => navigate('/demo')}>
                Demo
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Sistem Absensi{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Anti Titip Absen
                </span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 max-w-2xl">
                Solusi modern untuk sistem absensi kampus dengan teknologi Face Recognition yang
                memastikan kehadiran otentik dan mencegah praktik titip absen 100%.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => setActiveTab('login')}
                >
                  Mulai Sekarang
                </Button>
                <Button variant="outline" size="lg">
                  Pelajari Lebih Lanjut
                </Button>
              </div>

              {/* Stats */}
              <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div className="text-center">
                      <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {stat.value}
                      </div>
                      <div className="text-sm font-medium text-gray-900 mt-1">{stat.label}</div>
                      <div className="text-xs text-gray-500">{stat.description}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Content - Login Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold">Selamat Datang</CardTitle>
                  <CardDescription>
                    Masuk ke sistem absensi face recognition
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login">Masuk</TabsTrigger>
                      <TabsTrigger value="info">Info Sistem</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="space-y-4">
                      <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="username">Username atau Email</Label>
                          <Input
                            id="username"
                            type="text"
                            placeholder="Masukkan username atau email"
                            value={loginForm.username}
                            onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Masukkan password"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                            required
                          />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? 'Memproses...' : 'Masuk'}
                        </Button>
                      </form>

                      <div className="text-center text-sm text-gray-600">
                        <p>Default login:</p>
                        <p>Admin: admin / admin123</p>
                        <p>Mahasiswa: [nim] / [nim]</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="info" className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Face Recognition</p>
                            <p className="text-sm text-gray-600">Pengenalan wajah akurat dengan confidence rate 99.9%</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Real-time Processing</p>
                            <p className="text-sm text-gray-600">Proses absensi kurang dari 2 detik per mahasiswa</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Location Based</p>
                            <p className="text-sm text-gray-600">Absensi hanya bisa dilakukan di lokasi kelas yang ditentukan</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Multi Role Support</p>
                            <p className="text-sm text-gray-600">Dashboard untuk Admin, Dosen, dan Mahasiswa</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Fitur Unggulan Sistem Kami
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Teknologi terkini untuk solusi absensi yang modern, aman, dan efisien
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-purple-100">
                  <CardContent className="p-6">
                    <div className="mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Solution Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Solusi Masalah Absensi Traditional
              </h2>
              <div className="space-y-6">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Masalah: QR Code Rentan</h3>
                  <p className="text-red-700">
                    Mahasiswa bisa memfoto QR Code dari LCD dan kirim ke teman untuk scan dari rumah.
                  </p>
                </div>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Solusi: Face Recognition</h3>
                  <p className="text-green-700">
                    Sistem hanya mengenali wajah asli mahasiswa dan memvalidasi lokasi fisik di dalam kelas.
                  </p>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Hasil: 0% Titip Absen</h3>
                  <p className="text-blue-700">
                    Data kehadiran akurat, real-time, dan terverifikasi secara biometrik.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white"
            >
              <h3 className="text-2xl font-bold mb-6">Cara Kerja Sistem</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Dosen Mulai Sesi</h4>
                    <p className="text-white/90">Dosen mengaktifkan sesi absensi untuk kelas yang diajar</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Scanning Wajah</h4>
                    <p className="text-white/90">Mahasiswa melakukan scanning wajah di device kelas</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Validasi Real-time</h4>
                    <p className="text-white/90">Sistem memvalidasi wajah dan lokasi secara otomatis</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Data Tersimpan</h4>
                    <p className="text-white/90">Kehadiran tercatat di dashboard secara real-time</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Siap Implementasi Sistem Absensi Modern?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Hubungi kami untuk demo dan implementasi di kampus Anda
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" variant="secondary" onClick={() => navigate('/login')}>
                Coba Demo Sistem
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
                Hubungi Kami
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Fingerprint className="w-6 h-6" />
                <span className="text-xl font-bold">FaceAbsensi</span>
              </div>
              <p className="text-gray-400">
                Sistem absensi modern dengan teknologi Face Recognition untuk kampus Indonesia.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Fitur</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Face Recognition</li>
                <li>Real-time Tracking</li>
                <li>Analytics Dashboard</li>
                <li>Multi-device Support</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Solusi</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Untuk Universitas</li>
                <li>Untuk Fakultas</li>
                <li>Untuk Program Studi</li>
                <li>Custom Integration</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Kontak</h3>
              <ul className="space-y-2 text-gray-400">
                <li>info@faceabsensi.id</li>
                <li>+62 812-3456-7890</li>
                <li>Jakarta, Indonesia</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 FaceAbsensi Kampus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;