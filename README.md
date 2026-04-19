# AYDAKAR TEAM — TEKNOFEST Web Sitesi

Modern, responsive, **Three.js destekli 3D model görüntüleyicili** ve **kendi içine entegre admin paneline** sahip takım web sitesi.

## Teknik Özet

- **Frontend**: Vanilla JS, modern CSS (custom properties, grid), Three.js (3D model)
- **Backend**: Node.js + Express 5, dosya tabanlı veri (JSON), bcrypt hash'li 2 faktörlü admin
- **Mail**: Nodemailer ile SMTP üzerinden iletişim formu (Gmail App Password destekli)
- **Yükleme**: Multer + Sharp (otomatik thumbnail, JPEG/PNG/WEBP/GIF, max 5 MB)
- **Güvenlik**: Helmet, rate limit, same-origin koruması, httpOnly + sameSite=strict + (prod) secure cookies

---

## Lokal Geliştirme

```bash
npm install
npm start
# http://localhost:8000
```

### Admin Paneli
- URL: `http://localhost:8000/#admin`
- **Şifre**: `AydakarTeam..`
- **2FA Kodu**: `1905`
- (İstersen panelden değiştirebilirsin.)

---

## Ortam Değişkenleri (`.env`)

Proje kökünde bir `.env` dosyası oluştur (`.env.example` referans alabilirsin):

```bash
# Mail (iletisim formu)
CONTACT_TO=aydakarteam@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=aydakarteam@gmail.com
SMTP_PASS=GMAIL_APP_PASSWORD_BURAYA   # 16 haneli App Password (boşluksuz)

# (Opsiyonel) Admin
ADMIN_PASSWORD=AydakarTeam..
ADMIN_2FA=1905

# Production'da ayarla
NODE_ENV=production
PORT=8000
```

> `.env` dosyası **asla git'e commit edilmemelidir** (zaten `.gitignore`'da).

### Gmail App Password Nasıl Alınır
1. https://myaccount.google.com/security → **2 Adımlı Doğrulama**'yı etkinleştir
2. https://myaccount.google.com/apppasswords → Mail + Other ("AYDAKAR Web") → 16 haneli şifreyi kopyala

---

## Yayına Alma (Deploy)

### Önerilen: Render.com (Ücretsiz, Kalıcı Disk Destekli)

1. **GitHub'a yükle**: Önce projeyi git deposuna at (Gmail şifresi gibi sırlar `.gitignore`'da olduğu için güvenli):
   ```bash
   git init
   git add .
   git commit -m "Initial: AYDAKAR TEAM site"
   git branch -M main
   git remote add origin https://github.com/<kullanici>/<repo>.git
   git push -u origin main
   ```

2. **Render hesabı aç**: https://render.com → "New" → **Web Service** → GitHub deposunu seç.

3. **Yapılandırma**:
   - Region: **Frankfurt** (Türkiye'ye en yakın)
   - Branch: `main`
   - Runtime: **Node**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: **Starter ($7/ay)** veya Free (free tier'da kalıcı disk yok — yüklediğin görseller her uyandığında silinir, üretim için Starter şart)

4. **Environment Variables** (Render → Settings → Environment):
   ```
   NODE_ENV=production
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=aydakarteam@gmail.com
   SMTP_PASS=fbbswtnkhtjmxzzo
   CONTACT_TO=aydakarteam@gmail.com
   ADMIN_PASSWORD=AydakarTeam..
   ADMIN_2FA=1905
   ```

5. **Disk Ekle** (görsel/upload kalıcılığı için):
   - Settings → **Disks** → "Add Disk"
   - Mount Path: `/opt/render/project/src/uploads`
   - Size: 1 GB

   Aynısını `data/` için de yap (Mount Path: `/opt/render/project/src/data`, Size: 1 GB).

6. **Deploy**'a bas. ~3 dakikada `https://<proje-adi>.onrender.com` üzerinde yayında olur.

### Alternatif Hosting Seçenekleri

| Servis | Ücret | Kalıcı Disk | Türkiye Yakın Bölge |
|---|---|---|---|
| **Render.com** | Starter $7/ay | Var (eklenmeli) | Frankfurt |
| **Railway.app** | $5 free credit/ay | Volume var | EU West |
| **Fly.io** | Hobby ücretsiz | Volume var | Frankfurt (fra) |
| **Hetzner CX22 VPS** | ~€4/ay | Tam kontrol | Almanya (en hızlı) |

VPS daha güçlü ama PM2 + Nginx + Certbot kurulumu gerektirir. Render başlangıç için en sade.

### Domain Bağlama

1. Bir alan adı al: **Namecheap**, **GoDaddy**, **Nic.tr** (`.com.tr` için)
2. Render'da: Settings → **Custom Domain** → `aydakarteam.com` ekle
3. Render sana 2 DNS kaydı verir (`A` ve `CNAME`):
   - Domain sağlayıcının DNS panelinde bu kayıtları ekle
   - Render otomatik **HTTPS sertifikası** üretir (Let's Encrypt, ücretsiz)
4. ~30 dakika - 1 saat içinde `https://aydakarteam.com` aktif olur.

---

## Dosya Yapısı

```
teknofest-site/
├── index.html              # Tek sayfa (sections + admin panel)
├── styles.css              # Tüm stiller
├── script.js               # UI + admin paneli
├── viewer.js               # Three.js 3D model
├── server.js               # Express backend
├── package.json
├── .env                    # SIRLAR (commit edilmez)
├── .env.example            # Şablon
├── .gitignore
├── data/
│   ├── state.json          # Site içerikleri (üyeler, galeri, vs.)
│   ├── sessions.json       # Aktif admin oturumları
│   └── analytics.json      # Ziyaretçi sayacı
├── uploads/                # Yüklenen görseller (admin panelinden)
│   └── thumbs/             # Otomatik thumbnail'lar
└── assets/                 # Statik logo/görseller
```

---

## Yedekleme

İçeriklerini kaybetmemek için düzenli aralıklarla şu klasör/dosyaları yedekle:
- `data/state.json` — tüm site içerikleri
- `uploads/` — yüklenen görseller

> `defaultState` (`server.js` içinde) zaten kalıcı varsayılan olarak gömülü, ama dinamik eklediğin yeni içerikler `state.json`'da tutulur.
