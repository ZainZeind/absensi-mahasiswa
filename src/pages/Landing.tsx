import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Users, Calendar, CheckCircle, Smartphone, Shield, ArrowRight, Sparkles } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <div className="glass-strong rounded-3xl p-8 md:p-12 shadow-2xl hover-lift">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-gray-800">Sistem Absensi Modern</span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Absensi Kampus
              </span>
            </h1>
            
            {/* Subheading */}
            <p className="text-lg md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed font-medium">
              Tutup Celah Titip Absen — Semua Tercatat Secara Real-Time.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/login" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto text-lg px-8 py-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Masuk Sekarang
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 mt-12 pt-8 border-t border-white/30">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">99.9%</div>
                <div className="text-xs md:text-sm text-gray-600 mt-1 font-medium">Akurasi</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Real-Time</div>
                <div className="text-xs md:text-sm text-gray-600 mt-1 font-medium">Tracking</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">24/7</div>
                <div className="text-xs md:text-sm text-gray-600 mt-1 font-medium">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-gray-800">Fitur Unggulan</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Kenapa Memilih Kami?
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Solusi lengkap untuk kebutuhan absensi kampus modern
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Feature 1 */}
            <Card className="glass-card border-0 hover-lift cursor-pointer group">
              <CardContent className="p-6 md:p-8">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-800">Multi-Role</h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                  Akses terpisah untuk Admin, Dosen, dan Mahasiswa dengan fitur sesuai kebutuhan masing-masing
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="glass-card border-0 hover-lift cursor-pointer group">
              <CardContent className="p-6 md:p-8">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-800">Real-Time</h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                  Catat dan pantau kehadiran secara langsung dengan sistem yang responsif dan akurat
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="glass-card border-0 hover-lift cursor-pointer group">
              <CardContent className="p-6 md:p-8">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-pink-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-800">Otomatis</h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                  Rekap otomatis, notifikasi real-time, dan laporan lengkap untuk kemudahan monitoring
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="glass-card border-0 hover-lift cursor-pointer group">
              <CardContent className="p-6 md:p-8">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Smartphone className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-800">Responsive</h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                  Akses dari perangkat apapun - desktop, tablet, atau smartphone dengan tampilan optimal
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="glass-card border-0 hover-lift cursor-pointer group">
              <CardContent className="p-6 md:p-8">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-800">Aman</h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                  Data terenkripsi dengan sistem keamanan berlapis untuk melindungi privasi pengguna
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="glass-card border-0 hover-lift cursor-pointer group">
              <CardContent className="p-6 md:p-8">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <GraduationCap className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-800">User Friendly</h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                  Interface intuitif dan mudah digunakan bahkan untuk pengguna pertama kali
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-strong rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-gray-800">Mulai Sekarang</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Siap Memulai?
            </h2>
            <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Bergabung sekarang dan rasakan kemudahan sistem absensi modern
            </p>
            <Link to="/login">
              <Button 
                size="lg" 
                className="text-lg px-10 py-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <GraduationCap className="mr-2 h-5 w-5" />
                Mulai Sekarang
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-4 border-t border-white/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-purple-600" />
              <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Absensi Kampus
              </span>
            </div>
            <p className="text-gray-600 text-sm md:text-base text-center md:text-left">
              © 2025 Absensi Kampus. Semua Hak Dilindungi.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Landing;
