import { useRef, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiPost, apiGet } from "@/services/api";
import { Camera, X, CheckCircle, AlertCircle } from "lucide-react";

const CameraAbsensi = () => {
  const [searchParams] = useSearchParams();
  const sesiId = searchParams.get('sesi_id');
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [nim, setNim] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [sesiInfo, setSesiInfo] = useState<any>(null);
  const [cameraSupported, setCameraSupported] = useState(true);

  // Check camera support
  useEffect(() => {
    const checkCameraSupport = () => {
      
      // Check if we're on HTTPS or localhost
      const isSecureContext = window.isSecureContext || 
                              window.location.protocol === 'https:' || 
                              window.location.hostname === 'localhost' ||
                              window.location.hostname === '127.0.0.1';
      
      if (!isSecureContext) {
        const currentUrl = window.location.href;
        const localhostUrl = currentUrl.replace(/http:\/\/[^\/]+/, 'http://localhost:8081');
        
        setCameraSupported(false);
        toast({
          title: "Koneksi Tidak Aman - Akses Kamera Diblokir",
          description: `Browser memblokir akses kamera melalui ${window.location.hostname}. Buka aplikasi melalui localhost untuk menggunakan kamera.`,
          variant: "destructive",
          duration: 15000
        });
        
        // Show a more prominent alert after 1 second
        setTimeout(() => {
          const shouldRedirect = confirm(
            `⚠️ AKSES KAMERA DIBLOKIR\n\n` +
            `URL saat ini: ${currentUrl}\n\n` +
            `Browser memblokir akses kamera untuk koneksi HTTP yang tidak aman.\n\n` +
            `Solusi:\n` +
            `1. Buka http://localhost:8081 (bukan IP address)\n` +
            `2. Atau gunakan HTTPS\n\n` +
            `Klik OK untuk membuka localhost secara otomatis.`
          );
          
          if (shouldRedirect) {
            window.location.href = localhostUrl;
          }
        }, 1000);
        
        return;
      }

      // Check if mediaDevices API is available
      if (!navigator.mediaDevices) {
        setCameraSupported(false);
        toast({
          title: "API Tidak Tersedia",
          description: "navigator.mediaDevices tidak tersedia. Pastikan Anda menggunakan browser modern dan mengakses melalui HTTPS atau localhost.",
          variant: "destructive",
          duration: 10000
        });
        return;
      }

      if (!navigator.mediaDevices.getUserMedia) {
        setCameraSupported(false);
        toast({
          title: "getUserMedia Tidak Tersedia",
          description: "getUserMedia tidak tersedia. Update browser Anda ke versi terbaru.",
          variant: "destructive",
          duration: 10000
        });
        return;
      }

      setCameraSupported(true);
    };

    checkCameraSupport();
  }, []);

  // Fetch sesi info
  useEffect(() => {
    if (sesiId) {
      apiGet(`/sesi/${sesiId}`).then(res => {
        setSesiInfo(res.data);
      });
    }
  }, [sesiId]);

  // Start camera
  const startCamera = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Browser Tidak Didukung",
          description: "Browser Anda tidak mendukung akses kamera. Gunakan browser modern seperti Chrome, Firefox, atau Safari.",
          variant: "destructive"
        });
        return;
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: "user"
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
        
        toast({
          title: "Kamera Aktif",
          description: "Kamera berhasil diaktifkan",
        });
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      
      let errorMessage = "Tidak dapat mengakses kamera.";
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = "Izin kamera ditolak. Klik ikon kamera di address bar browser dan izinkan akses kamera.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = "Kamera tidak ditemukan. Pastikan kamera terhubung ke perangkat Anda.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = "Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi tersebut dan coba lagi.";
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = "Kamera tidak mendukung resolusi yang diminta.";
      } else if (err.name === 'SecurityError') {
        errorMessage = "Akses kamera diblokir karena alasan keamanan. Pastikan Anda menggunakan HTTPS atau localhost.";
      }
      
      toast({
        title: "Error Kamera",
        description: errorMessage,
        variant: "destructive",
        duration: 7000
      });
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  // Capture and submit
  const handleCapture = async () => {
    if (!nim) {
      toast({
        title: "Error",
        description: "Masukkan NIM mahasiswa terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    if (!videoRef.current || !canvasRef.current) return;

    setCapturing(true);

    // Capture image from video
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    
    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setCapturing(false);
        return;
      }

      try {
        // In real implementation, you would send the image to face recognition API
        // For now, we just submit the attendance
        
        if (!sesiId) {
          toast({
            title: "Error",
            description: "Sesi ID tidak ditemukan. Refresh halaman dan coba lagi.",
            variant: "destructive"
          });
          setCapturing(false);
          return;
        }
        
        const response = await apiPost('/absensi', {
          sesi_id: parseInt(sesiId),
          nim: nim.trim(),
          status: 'hadir',
          metode: 'webcam'
        });

        if (response.success) {
          toast({
            title: "Berhasil",
            description: `Absensi untuk NIM ${nim} berhasil dicatat`,
          });
          setNim("");
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Gagal mencatat absensi",
          variant: "destructive"
        });
      } finally {
        setCapturing(false);
      }
    }, 'image/jpeg', 0.8);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Absensi Kamera</h1>
            {sesiInfo && (
              <p className="text-sm text-gray-600">
                {sesiInfo.kelas_nama} - {sesiInfo.mata_kuliah_nama}
              </p>
            )}
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <X className="mr-2 h-4 w-4" /> Tutup
          </Button>
        </div>

        {!cameraSupported && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <strong className="text-lg">⚠️ Akses Kamera Diblokir</strong>
                <p>Browser memblokir akses kamera karena koneksi tidak aman.</p>
                <div className="bg-red-50 p-3 rounded mt-2 border border-red-200">
                  <p className="font-semibold mb-1">Solusi:</p>
                  <ol className="list-decimal list-inside text-sm space-y-1">
                    <li>Buka <code className="bg-red-100 px-2 py-0.5 rounded">http://localhost:8081</code> (bukan IP address)</li>
                    <li>Atau hubungi admin untuk setup HTTPS</li>
                  </ol>
                  <Button 
                    onClick={() => {
                      const currentUrl = window.location.href;
                      const localhostUrl = currentUrl.replace(/http:\/\/[^\/]+/, 'http://localhost:8081');
                      window.location.href = localhostUrl;
                    }}
                    className="mt-3 w-full"
                    size="sm"
                  >
                    Buka di Localhost
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Camera View */}
          <Card>
            <CardHeader>
              <CardTitle>Kamera</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {!isCameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-50">
                    <Button onClick={startCamera} size="lg" disabled={!cameraSupported}>
                      <Camera className="mr-2" />
                      Nyalakan Kamera
                    </Button>
                    <p className="text-white text-xs mt-2 opacity-75">
                      Klik untuk mengaktifkan kamera
                    </p>
                  </div>
                )}
              </div>

              {isCameraActive && (
                <Button 
                  onClick={stopCamera} 
                  variant="outline" 
                  className="w-full mt-4"
                >
                  Matikan Kamera
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Input Absensi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nim">NIM Mahasiswa</Label>
                <Input
                  id="nim"
                  placeholder="Masukkan NIM"
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCapture();
                    }
                  }}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Tekan Enter atau klik tombol untuk mencatat absensi
                </p>
              </div>

              <Button
                onClick={handleCapture}
                disabled={!isCameraActive || !nim || capturing}
                className="w-full"
                size="lg"
              >
                {capturing ? (
                  <>Loading...</>
                ) : (
                  <>
                    <CheckCircle className="mr-2" />
                    Catat Absensi
                  </>
                )}
              </Button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">Instruksi:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Nyalakan kamera</li>
                  <li>Mahasiswa berdiri di depan kamera</li>
                  <li>Masukkan NIM mahasiswa</li>
                  <li>Tekan Enter atau klik "Catat Absensi"</li>
                </ol>
              </div>

              {!isCameraActive && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2 text-yellow-800">⚠️ Izin Kamera Diperlukan</h4>
                  <p className="text-xs text-yellow-700 mb-2">
                    Jika kamera tidak menyala, pastikan Anda telah memberikan izin:
                  </p>
                  <ul className="text-xs space-y-1 list-disc list-inside text-yellow-700">
                    <li>Klik ikon kamera/kunci di address bar browser</li>
                    <li>Pilih "Allow" atau "Izinkan" untuk kamera</li>
                    <li>Refresh halaman jika perlu</li>
                    <li>Pastikan tidak ada aplikasi lain yang menggunakan kamera</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CameraAbsensi;
