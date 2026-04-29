# 📦 Tutorial Deploy ke VPS Ubuntu dengan aPanel

Project ini adalah aplikasi fullstack dengan:
- **Frontend**: React + Vite + TypeScript (Static Files)
- **Backend**: Express.js + SQLite

---

## 🏠 Bagian 1: Persiapan di Komputer Lokal

### Step 1.1 - Install Dependencies & Build Frontend

```bash
# Install dependencies frontend
npm install

# Install dependencies backend
cd server
npm install
cd ..

# Build frontend untuk production
npm run build
```

 Setelah build, akan terbuat folder `dist/` yang berisi static files.

---

## 🖥️ Bagian 2: Setup VPS dengan aPanel

### Step 2.1 - Login ke aPanel
Buka browser dan login ke panel server kamu:
```
https://alamat-ip-atau-domain-anda:8888
```

### Step 2.2 - Buat Website Baru
1. Di sidebar, klik **Website**
2. Klik **Create Site**
3. Isi informasi:
   - **Domain**: `file.alamat-anda.com` (atau subdomain)
   - **Website Root**: `/www/wwwroot/file-app`
   - **PHP Version**: `Select PHP` → `Disable PHP` (karena ini project Node.js)
4. Klik **Create**

### Step 2.3 -Install Node.js (jika belum ada)
1. Di sidebar, klik **App Store**
2. Cari **Node.js** atau gunakan terminal VPS

Atau install manual via terminal:

```bash
# Login ke VPS via SSH
ssh root@alamat-ip-anda

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Cek versi
node -v
npm -v
```

---

## 📤 Bagian 3: Upload File ke VPS

### Step 3.1 - Upload via aPanel File Manager
1. Di aPanel, klik **Files** → **File Manager**
2. Buka folder `/www/wwwroot/file-app`
3. Klik **Upload** dan upload semua file project:
   - Semua file di folder `dist/` (hasil build)
   - Folder `server/` lengkap

**Atau** via terminal (lebih cepat):

```bash
# Di komputer lokal, gunakan rsync atau scp
rsync -avz -e ssh ./server user@alamat-ip-anda:/www/wwwroot/file-app/
rsync -avz -e ssh ./dist user@alamat-ip-anda:/www/wwwroot/file-app/
```

### Step 3.2 - Setup Folder yang Diperlukan

```bash
# Login ke VPS
ssh root@alamat-ip-anda

cd /www/wwwroot/file-app/server

# Buat folder uploads dan data jika belum ada
mkdir -p uploads
mkdir -p data

# Install dependencies backend
cd /www/wwwroot/file-app/server
npm install
```

---

## ⚙️ Bagian 4: Konfigurasi Environment

### Step 4.1 - Buat File .env

```bash
cd /www/wwwroot/file-app/server
nano .env
```

Isi dengan:

```env
PORT=3003
JWT_SECRET=ubah-ini-dengan-kode-rahasia-yang-panjang-dan-aman
# Contoh: JWT_SECRET=kode_rahasia_very_secure_123456789
```

Simpan (Ctrl+O, Enter, Ctrl+X)

---

## 🚀 Bagian 5: Jalankan Backend dengan PM2

PM2 adalah process manager agar Node.js tetap berjalan meski terminal ditutup.

### Step 5.1 - Install PM2

```bash
npm install -g pm2
```

### Step 5.2 - Jalankan Backend

```bash
cd /www/wwwroot/file-app/server
pm2 start index.js --name file-manager-backend

# Agar otomatis restart saat server reboot
pm2 startup
pm2 save
```

### Step 5.3 - Cek Status

```bash
pm2 status
# atau
pm2 logs file-manager-backend
```

---

## 🌐 Bagian 6: Konfigurasi Website di aPanel

Sekarang backend sudah berjalan di port 3003. Selanjutnya konfigurasi agar website bisa diakses.

### Option A: Static Files Saja (Tanpa Nginx Reverse Proxy)

1. Di aPanel, klik **Website** → **Website List**
2. Klik ikon **Config** di网站 kamu
3. Di section **Website Root**, ubah ke:
   ```
   /www/wwwroot/file-app/dist
   ```
4. Klik **Save**

Tapi ini belum bisa connect ke backend. Gunakan Option B.

### Option B: Konfigurasi Nginx Reverse Proxy (Disarankan)

1. Di aPanel, klik **Website** → **Website List**
2. Klik **Delete**网站 yang ada, lalu buat lagi dengan:
   - **Website Root**: `/www/wwwroot/file-app/dist`
   - **PHP Version**: `Disable PHP`
3. Klik **Create**

4. Setelah created, klik **nginx Configuration**:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}

location /api/ {
    proxy_pass http://127.0.0.1:3003;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_cache_bypass $http_upgrade;
}

location /uploads/ {
    proxy_pass http://127.0.0.1:3003;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}
```

5. Klik **Save**

### Step 6.1 - Restart nginx

```bash
pm2 restart all
# atau di aPanel, restart nginx melalui dashboard
```

---

## ✅ Bagian 7: Verifikasi

Buka browser dan akses domain kamu. Test:

1. **Halaman Utama**: Apakah terbuka?
2. **Register**: Buat akun baru
3. **Login**: Login dengan akun yang baru dibuat
4. **Upload**: Upload file sederhana
5. **Lihat File**: Cek apakah file muncul di galeri
6. **Share**: Coba share file dan buka link-nya

Jika ada error, cek logs:

```bash
pm2 logs file-manager-backend
```

---

## 🔧 Troubleshooting

### Error: "Cannot find module"
```bash
cd /www/wwwroot/file-app/server
npm install
pm2 restart file-manager-backend
```

### Error: Database tidak bisa ditulis
```bash
chmod 755 /www/wwwroot/file-app/server/data
chmod 644 /www/wwwroot/file-app/server/data/database.sqlite
```

### Ganti domain/subdomain
1. Di aPanel, **Website** → **Website List**
2. Edit website, ganti domain名称
3.DNS record haruspointing ke IP VPS

### Update project setelah perubahan code
```bash
# Di lokal
npm run build

# Upload新的 dist folder
rsync -avz --delete ./dist user@alamat-ip-anda:/www/wwwroot/file-app/dist/

# Restart backend
pm2 restart file-manager-backend
```

---

## 📝 Ringkasan Perintah Penting

```bash
# Login VPS
ssh root@alamat-ip-anda

# Masuk ke folder project
cd /www/wwwroot/file-app

# Install/Update dependencies
cd server && npm install && cd ..

# Restart backend
pm2 restart file-manager-backend

# Cek logs
pm2 logs file-manager-backend

# Cek status
pm2 status
```

---

## 🔐 Keamanan Tambahan

1. **Firewall**: Pastikan port 3003 tidak exposed ke Publik
   - Di aPanel, **Security** → **Firewall**
   - Hanya izinkan port 80, 443, 8888

2. **JWT_SECRET**: Gunakan kode yang kuat dan simpan di `.env`

3. **Update Regular**: Patch security secara berkala
   ```bash
   npm audit fix
   ```

---

## 📞 Butuh Bantuan?

Jika ada masalah, coba cek:
1. `pm2 logs` untuk error logs
2. Pastikan Node.js dan npm terinstall dengan benar
3. Pastikan folder `uploads/` dan `data/` writable