# ☁️ Secure Cloud File Manager [![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://vitejs.dev/guide/) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Sebuah aplikasi web modern untuk manajemen file berbasis cloud. Aplikasi ini memungkinkan pengguna untuk membuat akun, mengunggah file, melihat galeri file mereka di dashboard, dan membagikan file tersebut kepada orang lain dengan aman.

## ✨ Fitur Utama

- **Autentikasi Pengguna**: Login dan registrasi yang aman dengan JWT.
- **Dashboard Pribadi**: Antarmuka pengguna yang bersih untuk melihat dan mengelola semua file yang diunggah.
- **Upload File**: Mengunggah file dengan mudah melalui komponen drag-and-drop atau pemilih file.
- **Galeri File**: Menampilkan daftar file dalam bentuk galeri yang mudah dinavigasi.
- **Berbagi File**: Menghasilkan tautan unik untuk membagikan file tertentu kepada pengguna lain dengan aman.

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

## 📱 Screenshot

![Hero Section](src/assets/hero-cloud.jpg)

*(Dashboard screenshot - tambahkan gambar dashboard jika tersedia)*

## 📖 Panduan Penggunaan

1. **Registrasi**: Buka halaman utama, klik "Daftar", isi email dan password.
2. **Login**: Masuk dengan kredensial akun Anda.
3. **Upload File**: Di dashboard, gunakan area drag-and-drop atau tombol pilih file.
4. **Lihat Galeri**: File muncul di galeri, klik FileCard untuk detail.
5. **Bagikan File**: Klik tombol share untuk dapatkan link unik.

## 🚀 Cara Menjalankan Project Secara Lokal

Ikuti langkah-langkah berikut untuk menjalankan aplikasi ini di komputer Anda:

### Prasyarat
- Node.js (versi 18+)

### 1. Install Dependencies & Run

**Terminal 1 (Backend):**
```bash
cd server
npm install
npm start
```
Backend berjalan di `http://localhost:3003`

**Terminal 2 (Frontend):**
```bash
npm install
npm run dev
```
Frontend di `http://localhost:8080` (Vite dev server)

### 2. Konfigurasi Environment (Opsional)

Buat `server/.env`:
```env
PORT=3003
JWT_SECRET=kode_rahasia_anda_yang_panjang_dan_aman
```

## 🌍 Deployment

Untuk deploy ke VPS Ubuntu + aPanel, lihat [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🤝 Kontribusi

1. Fork project ini
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buka Pull Request

Lihat [CONTRIBUTING.md](CONTRIBUTING.md) untuk detail.

## 📄 Lisensi

MIT License - lihat [LICENSE](LICENSE) untuk detail.
