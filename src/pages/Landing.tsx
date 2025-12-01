import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Shield, Camera, Clock, TrendingUp, Users, Zap, GraduationCap, CheckCircle2 } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Camera,
      title: "Face Recognition",
      description: "Sistem pengenalan wajah AI untuk verifikasi identitas yang akurat"
    },
    {
      icon: Shield,
      title: "Anti Proxy",
      description: "Eliminasi kecurangan absensi dengan verifikasi biometrik real-time"
    },
    {
      icon: Clock,
      title: "Real-Time Tracking",
      description: "Monitor sesi absensi secara langsung dengan notifikasi instan"
    },
    {
      icon: TrendingUp,
      title: "Dashboard Analitik",
      description: "Wawasan komprehensif tentang pola dan tren kehadiran"
    },
    {
      icon: Users,
      title: "Multi-Role Access",
      description: "Interface khusus untuk admin, dosen, dan mahasiswa"
    },
    {
      icon: Zap,
      title: "Proses Instan",
      description: "Pencocokan wajah super cepat dengan waktu respons sub-detik"
    }
  ];

  const benefits = [
    "Keamanan dan akurasi tinggi",
    "Mudah digunakan",
    "Laporan lengkap dan detail",
    "Hemat waktu dan efisien"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50">
      {/* Header/Navbar */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Sistem Absensi</span>
            </div>
            <Button 
              onClick={() => navigate("/login")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block px-4 py-2 bg-blue-100 rounded-full">
              <span className="text-sm font-medium text-blue-600">Sistem Absensi Modern</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
              Sistem Absensi
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Face Recognition
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-lg">
              Eliminasi kecurangan absensi dengan teknologi pengenalan wajah terkini. 
              Sistem absensi yang aman, akurat, dan real-time untuk kampus modern.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/login")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 h-14"
              >
                Mulai Sekarang
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 text-lg px-8 h-14"
              >
                Pelajari Lebih Lanjut
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-blue-600">99.9%</div>
                <div className="text-sm text-gray-600">Akurasi</div>
              </div>
              <div className="h-12 w-px bg-gray-300" />
              <div>
                <div className="text-3xl font-bold text-blue-600">&lt;1s</div>
                <div className="text-sm text-gray-600">Waktu Respon</div>
              </div>
              <div className="h-12 w-px bg-gray-300" />
              <div>
                <div className="text-3xl font-bold text-blue-600">0%</div>
                <div className="text-sm text-gray-600">Kecurangan</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 shadow-2xl flex items-center justify-center">
              <Camera className="w-32 h-32 text-white" />
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-200 rounded-full opacity-50 blur-2xl" />
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-indigo-200 rounded-full opacity-50 blur-2xl" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Fitur Unggulan</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Teknologi terdepan untuk sistem absensi yang lebih baik
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-gray-900">
                Mengapa Memilih Sistem Kami?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Solusi absensi modern dengan teknologi terkini untuk meningkatkan 
                efisiensi dan keamanan proses absensi di kampus Anda.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <Card className="p-8 bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
              <h3 className="text-2xl font-bold mb-4">Siap untuk Memulai?</h3>
              <p className="mb-6 text-blue-50">
                Bergabunglah dengan ribuan institusi yang sudah menggunakan sistem kami 
                untuk mengelola absensi dengan lebih efisien.
              </p>
              <Button 
                size="lg"
                onClick={() => navigate("/auth")}
                className="w-full bg-white text-blue-600 hover:bg-gray-100"
              >
                Mulai Sekarang
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold">Sistem Absensi</span>
              </div>
              <p className="text-gray-400">
                Sistem absensi modern dengan teknologi face recognition untuk kampus Anda.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Fitur</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Face Recognition</li>
                <li>Dashboard Analitik</li>
                <li>Laporan Real-time</li>
                <li>Multi-role Access</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Kontak</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Email: info@absensi.com</li>
                <li>Phone: +62 xxx xxxx xxxx</li>
                <li>Support: support@absensi.com</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Sistem Absensi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
