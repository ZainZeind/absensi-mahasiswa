# Setup HTTPS untuk Development (Opsional)

## Kenapa Perlu HTTPS?

Jika Anda ingin mengakses aplikasi dari komputer lain di jaringan yang sama (misalnya testing dari laptop lain), kamera akan diblokir browser pada HTTP.

Solusi: Setup HTTPS dengan self-signed certificate.

## Cara Setup HTTPS (macOS/Linux)

### 1. Install mkcert
```bash
# macOS
brew install mkcert

# Linux
sudo apt install mkcert  # Ubuntu/Debian
# atau
sudo pacman -S mkcert    # Arch Linux
```

### 2. Setup Certificate Authority
```bash
mkcert -install
```

### 3. Generate Certificate
```bash
cd /Users/adrianobawan/Study/Iyan/Projek/absensi-mahasiswa

# Generate cert untuk localhost dan IP lokal
mkcert localhost 127.0.0.1 192.168.1.25 ::1

# File yang dihasilkan:
# localhost+3.pem (certificate)
# localhost+3-key.pem (private key)
```

### 4. Update vite.config.ts
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    https: {
      key: fs.readFileSync('./localhost+3-key.pem'),
      cert: fs.readFileSync('./localhost+3.pem'),
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
```

### 5. Update .env
```bash
VITE_API_URL=https://localhost:3001/api
```

### 6. Setup Backend HTTPS (Express)
```typescript
// backend/src/index.ts
import https from 'https';
import fs from 'fs';

const httpsOptions = {
  key: fs.readFileSync('../localhost+3-key.pem'),
  cert: fs.readFileSync('../localhost+3.pem')
};

https.createServer(httpsOptions, app).listen(3001, () => {
  console.log('🔒 HTTPS Server running on https://localhost:3001');
});
```

### 7. Restart Aplikasi
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
npm run dev
```

### 8. Akses Aplikasi
Sekarang bisa akses dari:
- ✅ `https://localhost:8080`
- ✅ `https://192.168.1.25:8080` (dari komputer lain)
- ✅ Kamera akan berfungsi di semua URL

## Verifikasi

1. Buka `https://localhost:8080`
2. Browser akan menampilkan warning "Your connection is not private"
3. Klik "Advanced" → "Proceed to localhost" (Chrome)
4. Atau "Accept the Risk and Continue" (Firefox)
5. Kamera seharusnya berfungsi

## Catatan

- Certificate ini hanya untuk development
- Untuk production, gunakan certificate dari Let's Encrypt atau penyedia SSL lainnya
- Browser mungkin masih menampilkan warning karena self-signed, tapi kamera akan tetap berfungsi

## Troubleshooting

**Error: "unable to get local issuer certificate"**
```bash
# Reinstall mkcert CA
mkcert -uninstall
mkcert -install
```

**Error: "EACCES permission denied"**
```bash
# Gunakan sudo untuk install
sudo mkcert -install
```

**Certificate tidak dikenali di Firefox**
1. Settings → Privacy & Security → Certificates
2. View Certificates → Authorities
3. Import mkcert CA certificate secara manual
