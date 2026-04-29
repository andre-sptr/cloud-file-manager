# ☁️ Secure Cloud File Manager

Sebuah aplikasi web modern untuk manajemen file berbasis cloud. Aplikasi ini memungkinkan pengguna untuk membuat akun, mengunggah file, melihat galeri file mereka di dashboard, dan membagikan file tersebut kepada orang lain dengan aman.

## ✨ Fitur Utama

- **Autentikasi Pengguna**: Login dan registrasi yang aman dengan JWT.
- **Dashboard Pribadi**: Antarmuka pengguna yang bersih untuk melihat dan mengelola semua file yang diunggah.
- **Upload File**: Mengunggah file dengan mudah melalui komponen drag-and-drop atau pemilih file.
- **Galeri File**: Menampilkan daftar file dalam bentuk galeri yang mudah dinavigasi.
- **Berbagi File**: Menghasilkan tautan unik untuk membagikan file tertentu kepada pengguna lain.

## 💻 Teknologi yang Digunakan

**Frontend:**
- [React.js](https://react.dev/) dengan [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) untuk komponen antarmuka pengguna

**Backend & Database:**
- [Express.js](https://expressjs.com/) (Node.js)
- [SQLite](https://www.sqlite.org/) untuk database lokal
- [JWT](https://jwt.io/) untuk autentikasi

## 🚀 Cara Menjalankan Project Secara Lokal

Ikuti langkah-langkah berikut untuk menjalankan aplikasi ini di komputer Anda:

### Prasyarat
- Node.js terinstal di komputer Anda.

### 2. Menjalankan Aplikasi

Jalankan frontend dan backend secara terpisah di dua terminal:

**Terminal 1 (Backend):**
```bash
cd server
npm install
npm start
# Backend akan berjalan di http://localhost:3000
```

**Terminal 2 (Frontend):**
```bash
npm install
npm run dev
# Frontend akan terbuka di http://localhost:8080
```

### 3. Konfigurasi Environment (Opsional)

Buat file `.env` di folder `server/` untuk konfigurasi khusus:

```env
PORT=3000
JWT_SECRET=kode_rahasia_anda
```

## 🌍 Deploy ke VPS (Ubuntu dengan aPanel)

Untuk panduan lengkap deployment ke VPS Ubuntu menggunakan aPanel, lihat文件:
**[DEPLOYMENT.md](./DEPLOYMENT.md)**

File tersebut mencakup:
- Persiapan di komputer lokal (build frontend)
- Setup VPS dengan aPanel
- Upload file ke server
- Install Node.js dan PM2
- Konfigurasi Nginx reverse proxy
- Verifikasi dan troubleshooting
```bash
git clone https://github.com/andre-sptr/file.git