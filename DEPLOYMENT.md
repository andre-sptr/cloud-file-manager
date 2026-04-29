# 📦 Tutorial Deploy ke VPS Ubuntu dengan aPanel

Project fullstack ini terdiri dari:
- **Frontend**: React + Vite + TypeScript (Static files di `dist/`)
- **Backend**: Express.js + SQLite (`server/data/database.sqlite`)

## 🏠 Bagian 1: Persiapan Lokal

### 1.1 Install Dependencies & Build Frontend

```bash
# Frontend
npm install
npm run build  # Hasil di folder `dist/`

# Backend
cd server
npm install
cd ..
```

## 🖥️ Bagian 2: Setup VPS aPanel

### 2.1 Login aPanel
```
https://ip-atau-domain-anda:8888
```

### 2.2 Buat Website Baru
- **Website** > **Create Site**
- **Domain**: `file.domain-anda.com`
- **Website Root**: `/www/wwwroot/file-app`
- **PHP**: Disable (Node.js project)
- **Create**

### 2.3 Install Node.js (jika belum)

Via aPanel **App Store** atau terminal:
```bash
ssh root@ip-vps-anda
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # Verifikasi
```

## 📤 Bagian 3: Upload Files

### 3.1 Via File Manager aPanel
- **Files** > **File Manager** > `/www/wwwroot/file-app`
- Upload `dist/` dan `server/`

### 3.2 Via Terminal (Recommended)
```bash
# Dari lokal
rsync -avz -e ssh dist/ user@ip-vps:/www/wwwroot/file-app/
rsync -avz -e ssh server/ user@ip-vps:/www/wwwroot/file-app/
```

### 3.3 Setup Folders
```bash
cd /www/wwwroot/file-app/server
mkdir -p uploads data
npm install
chown -R www-data:www-data uploads data  # Permissions
```

## ⚙️ Bagian 4: Environment (.env)

Di `/www/wwwroot/file-app/server/.env`:
```env
PORT=3003
JWT_SECRET=super_rahasia_jwt_production_64_chars_minim
DB_PATH=./data/database.sqlite
UPLOAD_DIR=./uploads
NODE_ENV=production
```

## 🚀 Bagian 5: Jalankan dengan PM2

```bash
npm install -g pm2
cd /www/wwwroot/file-app/server
pm2 start index.js --name "file-manager"
pm2 startup
pm2 save
pm2 status
```

## 🌐 Bagian 6: Nginx Reverse Proxy (aPanel)

1. **Website** > **Config** > **Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name file.domain-anda.com;

    root /www/wwwroot/file-app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3003/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3003/uploads/;
        proxy_set_header Host $host;
    }
}
```
2. **Save** & restart Nginx via aPanel.

## ✅ Bagian 7: Verifikasi & Test

- Akses `https://file.domain-anda.com`
- Test: Register > Login > Upload > Share
- Logs: `pm2 logs file-manager`

## 🔧 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Module not found | `cd server && npm install` |
| DB permission | `chmod 755 data; chmod 644 data/database.sqlite` |
| PM2 not start | `pm2 delete all; pm2 start index.js --name file-manager` |
| 502 Proxy | Cek `pm2 status`, port 3003 listen? |

**Update Code:**
```bash
npm run build  # Lokal
rsync -avz --delete dist/ user@ip:/www/wwwroot/file-app/dist/
pm2 restart file-manager
```

## 🐳 Deployment Alternatif: Docker (Opsional)

### Dockerfile (root)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3003
CMD ["node", "server/index.js"]
```

Build & run:
```bash
docker build -t file-manager .
docker run -d -p 3003:3003 -v /path/to/data:/app/server/data file-manager
```

## 🔐 Keamanan

- **Firewall**: Block port 3003 public (ufw/aPanel)
- **HTTPS**: Enable SSL di aPanel
- **Rate Limit**: Tambah `express-rate-limit` di backend
- **Backup**: Rsync `data/` & `uploads/` rutin

## 📝 Perintah Cepat

```bash
pm2 logs file-manager
pm2 restart file-manager
pm2 status
tail -f server/logs/error.log  # Jika diaktifkan
