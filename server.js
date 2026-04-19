require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const sharp = require('sharp');
const nodemailer = require('nodemailer');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = Number.parseInt(process.env.PORT || '8000', 10);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'state.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const THUMBS_DIR = path.join(UPLOADS_DIR, 'thumbs');
const SESSION_COOKIE = 'aydakar_session';
const PENDING_COOKIE = 'aydakar_pending';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24;
const PENDING_TTL_MS = 1000 * 60 * 5;
const IS_PROD = process.env.NODE_ENV === 'production';
const BCRYPT_ROUNDS = 12;
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AydakarTeam..';
const DEFAULT_ADMIN_2FA = process.env.ADMIN_2FA || '1905';
const CONTACT_TO = process.env.CONTACT_TO || 'aydakarteam@gmail.com';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const ANALYTICS_FILE = path.join(__dirname, 'data', 'analytics.json');
const MAX_UPLOAD_MB = 5;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const sessions = new Map();
const pendingSessions = new Map();

let sessionsLoaded = false;
let sessionsFlushTimer = null;

const persistSessionsSoon = () => {
  if (sessionsFlushTimer) return;
  sessionsFlushTimer = setTimeout(async () => {
    sessionsFlushTimer = null;
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(
        SESSIONS_FILE,
        JSON.stringify(Object.fromEntries(sessions), null, 0),
        'utf8'
      );
    } catch {
      // disk kayitini atlariz, in-memory akis bozulmasin
    }
  }, 250);
};

const loadSessions = async () => {
  if (sessionsLoaded) return;
  sessionsLoaded = true;
  try {
    const raw = await fs.readFile(SESSIONS_FILE, 'utf8');
    const data = JSON.parse(raw || '{}');
    const now = Date.now();
    Object.entries(data).forEach(([token, expiresAt]) => {
      if (typeof expiresAt === 'number' && expiresAt > now) {
        sessions.set(token, expiresAt);
      }
    });
  } catch {
    // dosya yoksa veya bozuksa sifirdan baslariz
  }
};

// NOT: Bu defaultState, data/state.json silinse veya bozulsa bile
// takim semasi, galeri, gif'ler ve uyelerin geri yuklenebilmesi icin
// kod icine gomulmus kalici varsayilan icerigi tutar.
const defaultState = {
  adminPasswordHash: '',
  adminSecondFactorHash: '',
  logos: {
    team: '/uploads/1776619078782-logo11.PNG',
    teknofest: '/uploads/1776619079168-teknologo.PNG'
  },
  socialLinks: {
    instagram: '#https://www.instagram.com/aydakarsiha?igsh=eGM1eWltcXM1dmJr&utm_source=qr',
    twitter: '#',
    linkedin: '#https://www.linkedin.com/in/aydakar-team-840095404/',
    github: '#'
  },
  orgChart: {
    advisorName: 'Ahmet Ali Süzen',
    captainName: 'Ferhan Çıbık',
    teams: ['Yazılım Ekibi', 'Mekanik Ekibi', 'Elektronik Ekibi', 'PR ve Sosyal Medya']
  },
  projectGifs: [
    '/uploads/1776619656051-machine.gif',
    '/uploads/1776619645386-_________________________.gif',
    ''
  ],
  orgChartPhotoUrl: '',
  sponsors: [],
  roadmap: [
    { title: 'Yarışma Son Başvuru', date: '28.02.2026', description: 'TEKNOFEST Savaşan İHA başvuru süreci tamamlandı.', status: 'completed' },
    { title: 'Teknik Yeterlilik Formu (TYF) Teslimi', date: '24.03.2026 - 17:00', description: 'TYF dökümanı resmi olarak teslim edildi.', status: 'completed' },
    { title: 'TYF Sonuçlarının Açıklanması', date: '10.04.2026', description: 'Teknik Yeterlilik Formu sonuçları açıklandı, takımımız geçti.', status: 'completed' },
    { title: 'Kritik Tasarım Raporu (KTR) Teslimi', date: '30.04.2026 - 17:00', description: 'Şu an üzerinde çalıştığımız kritik aşama. Detaylı tasarım raporumuz hazırlanıyor.', status: 'active' },
    { title: 'KTR Sonuçlarının Açıklanması', date: '22.05.2026', description: 'Kritik Tasarım Raporu değerlendirme sonuçları açıklanacak.', status: 'upcoming' },
    { title: 'Sistem Tanımlama ve Uçuş Kanıt Videoları', date: '14.07.2026 - 17:00', description: 'Saha test videoları ve sistem tanımlama dökümanları teslim edilecek.', status: 'upcoming' },
    { title: 'Finalist Takımların Açıklanması', date: '31.07.2026', description: 'Yarışmaya finalde katılmaya hak kazanan takımlar duyurulacak.', status: 'upcoming' },
    { title: 'TEKNOFEST Şanlıurfa - Yarışma', date: '30 Eylül - 4 Ekim 2026', description: 'Saha yarışması Şanlıurfa\'da gerçekleştirilecek.', status: 'upcoming' }
  ],
  gallery: [
    {
      imageUrl: '/uploads/1776618569283-20260301_213416.jpg',
      thumbnailUrl: '/uploads/thumbs/thumb-1776618569283-20260301_213416.jpg.webp',
      caption: 'Galeri görseli'
    },
    {
      imageUrl: '/uploads/1776618556471-IMG_0188.JPG',
      thumbnailUrl: '/uploads/thumbs/thumb-1776618556471-IMG_0188.JPG.webp',
      caption: 'Galeri görseli'
    },
    {
      imageUrl: '/uploads/1776618539588-tak__mfoto2.jpeg',
      thumbnailUrl: '/uploads/thumbs/thumb-1776618539588-tak__mfoto2.jpeg.webp',
      caption: 'Galeri görseli'
    }
  ],
  members: [
    { name: 'İbrahim Duman', team: 'Mekanik Ekibi', role: 'Mekanik Tasarım ve Entegrasyon Sorumlusu', photoUrl: '' },
    { name: 'Begüm Küçüköztürk', team: 'Mekanik Ekibi', role: 'Aerodinamik ve Performans Sorumlusu', photoUrl: '' },
    { name: 'Furkan Kodaz', team: 'Mekanik Ekibi', role: 'Yapısal Analiz ve Malzeme Sorumlusu', photoUrl: '' },
    { name: 'Hasan Yahya Kahraman', team: 'Mekanik Ekibi', role: 'Üretim Teknolojileri ve Prototipleme Sorumlusu', photoUrl: '' },
    { name: 'Hasan Tozlu', team: 'Elektronik Ekibi', role: 'Telemetri ve Gömülü Sistemler Geliştiricisi', photoUrl: '' },
    { name: 'Utku Berkay Hatipoğlu', team: 'Elektronik Ekibi', role: 'Aviyonik Sistemler Tasarımcısı', photoUrl: '' },
    { name: 'Şevval Çoban', team: 'Yazılım Ekibi', role: 'Yazılım Ekip Lideri', photoUrl: '' },
    { name: 'Ömer Taşkın', team: 'Yazılım Ekibi', role: 'Simülasyon Sistemleri Geliştiricisi', photoUrl: '' },
    { name: 'Reyyan Çeliköz', team: 'Yazılım Ekibi', role: 'Haberleşme Sistemleri Geliştiricisi', photoUrl: '' },
    { name: 'Yunus Emre Erdem', team: 'Yazılım Ekibi', role: 'Yapay Zeka Geliştiricisi', photoUrl: '' },
    { name: 'Ceren Yalçınkaya', team: 'Yazılım Ekibi', role: 'Yapay Zeka Geliştiricisi', photoUrl: '' },
    { name: 'Esra Eskin', team: 'PR ve Sosyal Medya', role: 'Sosyal Medya ve Pr Sorumlusu', photoUrl: '' },
    { name: 'Ferhan Çıbık', team: 'Yönetim Ekibi', role: 'Takım Kaptanı', photoUrl: '' },
    { name: 'Ahmet Ali Süzen', team: 'Yönetim Ekibi', role: 'Danışman', photoUrl: '' }
  ]
};

app.disable('x-powered-by');
// Reverse proxy (Render, Railway, Nginx vb.) arkasinda dogru istemci IP'sini
// alabilmek icin gerekli. Hem rate-limit hem secure cookies icin kritik.
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOADS_DIR));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Cok fazla giris denemesi. Lutfen daha sonra tekrar deneyin.' }
});

const writeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Cok fazla istek gonderildi. Lutfen kisa sure sonra tekrar deneyin.' }
});

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
      cb(null, UPLOADS_DIR);
    } catch (err) {
      cb(err);
    }
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const name = `${Date.now()}-${safeName}`;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      cb(new Error('Sadece JPG, PNG, WEBP ve GIF dosyalari yuklenebilir.'));
      return;
    }
    cb(null, true);
  }
});

const sessionCookieOptions = (maxAge) => ({
  httpOnly: true,
  sameSite: 'strict',
  secure: IS_PROD,
  maxAge
});

const requireSameOrigin = (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  const origin = req.get('origin');
  const host = req.get('host');
  if (!origin) return next();
  try {
    const originHost = new URL(origin).host;
    if (originHost !== host) {
      return res.status(403).json({ message: 'Gecersiz origin' });
    }
  } catch {
    return res.status(403).json({ message: 'Gecersiz origin' });
  }
  return next();
};

const hashSecret = async (plain) => bcrypt.hash(String(plain).trim(), BCRYPT_ROUNDS);
const compareSecret = async (plain, hashed) => bcrypt.compare(String(plain || '').trim(), String(hashed || ''));

app.use('/api', requireSameOrigin);
app.use('/api', writeLimiter);

const cleanString = (value, fallback = '', maxLen = 200) => {
  const normalized = String(value ?? fallback).trim();
  return normalized.slice(0, maxLen);
};

const safeUploadUrl = (value) => {
  const v = cleanString(value, '', 600);
  if (!v) return '';
  if (v.startsWith('/uploads/')) return v;
  try {
    const parsed = new URL(v);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return v;
  } catch {
    return '';
  }
  return '';
};

const normalizeState = (raw, currentSecrets = {}) => {
  const base = raw || {};
  const teams = Array.isArray(base?.orgChart?.teams)
    ? base.orgChart.teams.map((x) => cleanString(x, '', 80)).filter(Boolean).slice(0, 10)
    : defaultState.orgChart.teams;
  return {
    adminPasswordHash: currentSecrets.adminPasswordHash || base.adminPasswordHash || '',
    adminSecondFactorHash: currentSecrets.adminSecondFactorHash || base.adminSecondFactorHash || '',
    logos: {
      team: safeUploadUrl(base?.logos?.team) || defaultState.logos.team,
      teknofest: safeUploadUrl(base?.logos?.teknofest) || defaultState.logos.teknofest
    },
    socialLinks: {
      instagram: cleanString(base?.socialLinks?.instagram, '#', 500) || '#',
      twitter: cleanString(base?.socialLinks?.twitter, '#', 500) || '#',
      linkedin: cleanString(base?.socialLinks?.linkedin, '#', 500) || '#',
      github: cleanString(base?.socialLinks?.github, '#', 500) || '#'
    },
    orgChart: {
      advisorName: cleanString(base?.orgChart?.advisorName, defaultState.orgChart.advisorName, 100),
      captainName: cleanString(base?.orgChart?.captainName, defaultState.orgChart.captainName, 100),
      teams
    },
    projectGifs: Array.isArray(base?.projectGifs) ? base.projectGifs.map((x) => safeUploadUrl(x)).slice(0, 3) : ['', '', ''],
    orgChartPhotoUrl: safeUploadUrl(base?.orgChartPhotoUrl),
    sponsors: Array.isArray(base?.sponsors)
      ? base.sponsors.slice(0, 60).map((s) => ({
        name: cleanString(s?.name, 'Sponsor', 120),
        websiteUrl: cleanString(s?.websiteUrl, '', 500),
        logoUrl: safeUploadUrl(s?.logoUrl)
      })).filter((s) => s.name)
      : [],
    roadmap: Array.isArray(base?.roadmap)
      ? base.roadmap.slice(0, 80).map((r) => ({
        title: cleanString(r?.title, 'Adım', 160),
        date: cleanString(r?.date, '', 60),
        description: cleanString(r?.description, '', 500),
        status: ['upcoming', 'active', 'completed'].includes(r?.status) ? r.status : 'upcoming'
      }))
      : [],
    gallery: Array.isArray(base?.gallery)
      ? base.gallery.slice(0, 200).map((item) => ({
        imageUrl: safeUploadUrl(item?.imageUrl),
        thumbnailUrl: safeUploadUrl(item?.thumbnailUrl),
        caption: cleanString(item?.caption, 'Galeri görseli', 160)
      })).filter((x) => x.imageUrl)
      : [],
    members: Array.isArray(base?.members)
      ? base.members.slice(0, 300).map((m) => ({
        name: cleanString(m?.name, 'Üye', 100),
        team: cleanString(m?.team, 'Yönetim Ekibi', 80),
        role: cleanString(m?.role, '', 100),
        photoUrl: safeUploadUrl(m?.photoUrl)
      }))
      : []
  };
};

const createSession = () => {
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  persistSessionsSoon();
  return token;
};

const createPendingSession = () => {
  const token = crypto.randomBytes(24).toString('hex');
  pendingSessions.set(token, Date.now() + PENDING_TTL_MS);
  return token;
};

const verifySession = async (req, res, next) => {
  await loadSessions();
  const token = req.cookies[SESSION_COOKIE];
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ message: 'Yetkisiz' });
  }
  const expiresAt = sessions.get(token);
  if (Date.now() > expiresAt) {
    sessions.delete(token);
    persistSessionsSoon();
    return res.status(401).json({ message: 'Oturum süresi doldu' });
  }
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  persistSessionsSoon();
  next();
};

setInterval(() => {
  const now = Date.now();
  let changed = false;
  sessions.forEach((expiresAt, token) => {
    if (now > expiresAt) {
      sessions.delete(token);
      changed = true;
    }
  });
  pendingSessions.forEach((expiresAt, token) => {
    if (now > expiresAt) pendingSessions.delete(token);
  });
  if (changed) persistSessionsSoon();
}, 60 * 1000).unref();

loadSessions();

const ensureDataFile = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.mkdir(THUMBS_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    const initialState = normalizeState(defaultState, {
      adminPasswordHash: await hashSecret(DEFAULT_ADMIN_PASSWORD),
      adminSecondFactorHash: await hashSecret(DEFAULT_ADMIN_2FA)
    });
    await fs.writeFile(DATA_FILE, JSON.stringify(initialState, null, 2), 'utf8');
  }
};

const readState = async () => {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  const data = JSON.parse(raw);
  const migratedSecrets = {
    adminPasswordHash: data.adminPasswordHash,
    adminSecondFactorHash: data.adminSecondFactorHash
  };
  if (!migratedSecrets.adminPasswordHash) {
    migratedSecrets.adminPasswordHash = await hashSecret(data.adminPassword || DEFAULT_ADMIN_PASSWORD);
  }
  if (!migratedSecrets.adminSecondFactorHash) {
    migratedSecrets.adminSecondFactorHash = await hashSecret(data.adminSecondFactor || DEFAULT_ADMIN_2FA);
  }
  const normalized = normalizeState({ ...defaultState, ...data }, migratedSecrets);
  if (
    data.adminPassword || data.adminSecondFactor
    || !data.adminPasswordHash || !data.adminSecondFactorHash
  ) {
    await writeState(normalized);
  }
  return normalized;
};

const writeState = async (state) => {
  await fs.writeFile(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
};

app.get('/api/state', async (_req, res) => {
  const state = await readState();
  const { adminPasswordHash, adminSecondFactorHash, ...publicState } = state;
  void adminPasswordHash;
  void adminSecondFactorHash;
  res.json(publicState);
});

app.post('/api/admin/login', loginLimiter, async (req, res) => {
  const { password } = req.body || {};
  const state = await readState();
  const ok = await compareSecret(password, state.adminPasswordHash);
  if (!ok) {
    return res.status(401).json({ message: 'Şifre hatalı' });
  }
  const pendingToken = createPendingSession();
  res.cookie(PENDING_COOKIE, pendingToken, sessionCookieOptions(PENDING_TTL_MS));
  res.json({ requiresSecondFactor: true });
});

app.post('/api/admin/verify-2fa', loginLimiter, async (req, res) => {
  const { code } = req.body || {};
  const pendingToken = req.cookies[PENDING_COOKIE];
  if (!pendingToken || !pendingSessions.has(pendingToken)) {
    return res.status(401).json({ message: '2FA oturumu gecersiz' });
  }
  const pendingExpires = pendingSessions.get(pendingToken);
  if (Date.now() > pendingExpires) {
    pendingSessions.delete(pendingToken);
    return res.status(401).json({ message: '2FA oturumu suresi doldu' });
  }
  const state = await readState();
  const ok = await compareSecret(code, state.adminSecondFactorHash);
  if (!ok) {
    return res.status(401).json({ message: '2FA kodu hatali' });
  }
  pendingSessions.delete(pendingToken);
  res.clearCookie(PENDING_COOKIE, { sameSite: 'strict', secure: IS_PROD });
  const token = createSession();
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions(SESSION_TTL_MS));
  res.json({ ok: true });
});

app.put('/api/admin/password', verifySession, async (req, res) => {
  const { password } = req.body || {};
  if (!password || String(password).trim().length < 6) {
    return res.status(400).json({ message: 'Şifre en az 6 karakter olmalı' });
  }
  const state = await readState();
  state.adminPasswordHash = await hashSecret(password);
  await writeState(state);
  res.json({ ok: true });
});

app.put('/api/state', verifySession, async (req, res) => {
  const current = await readState();
  const next = req.body || {};
  const safeState = {
    ...normalizeState(next, {
      adminPasswordHash: current.adminPasswordHash,
      adminSecondFactorHash: current.adminSecondFactorHash
    })
  };
  await writeState(safeState);
  res.json({ ok: true });
});

app.put('/api/admin/second-factor', verifySession, async (req, res) => {
  const { code } = req.body || {};
  const normalized = String(code || '').trim();
  if (!/^\d{4,8}$/.test(normalized)) {
    return res.status(400).json({ message: '2FA kodu 4-8 hane sayi olmali' });
  }
  const state = await readState();
  state.adminSecondFactorHash = await hashSecret(normalized);
  await writeState(state);
  res.json({ ok: true });
});

app.post('/api/upload', verifySession, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Dosya bulunamadı' });
  }
  const thumbFilename = `thumb-${req.file.filename}.webp`;
  const thumbPath = path.join(THUMBS_DIR, thumbFilename);
  const isGif = req.file.mimetype === 'image/gif';

  try {
    await sharp(req.file.path, isGif ? { animated: true } : {})
      .rotate()
      .resize(640, 420, { fit: 'cover' })
      .webp({ quality: 82 })
      .toFile(thumbPath);
  } catch {
    // sharp basarisiz olursa thumb olusturmadan devam ederiz
  }

  if (!isGif) {
    try {
      const rotatedBuffer = await sharp(req.file.path).rotate().toBuffer();
      await fs.writeFile(req.file.path, rotatedBuffer);
    } catch {
      // orijinal dosyayi yeniden yazma basarisiz olursa orijinal kalir
    }
  }

  const url = `/uploads/${req.file.filename}`;
  const thumbnailUrl = `/uploads/thumbs/${thumbFilename}`;
  res.json({ url, thumbnailUrl });
});

// ==== Iletisim formu (Nodemailer) ====
const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Cok fazla mesaj gonderildi, lutfen bir sure sonra deneyin.' }
});

let mailTransporter = null;
const getTransporter = () => {
  if (mailTransporter) return mailTransporter;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  mailTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  return mailTransporter;
};

app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, subject, message } = req.body || {};
  const cleanName = cleanString(name, '', 120);
  const cleanEmail = cleanString(email, '', 200);
  const cleanSubject = cleanString(subject, 'Web sitesi iletisim', 200);
  const cleanMessage = cleanString(message, '', 4000);

  if (!cleanName || !cleanEmail || !cleanMessage) {
    return res.status(400).json({ message: 'Ad, e-posta ve mesaj gerekli.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ message: 'Gecerli bir e-posta girin.' });
  }

  const transporter = getTransporter();
  if (!transporter) {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const logPath = path.join(DATA_DIR, 'contact-messages.log');
      const line = JSON.stringify({ at: new Date().toISOString(), name: cleanName, email: cleanEmail, subject: cleanSubject, message: cleanMessage });
      await fs.appendFile(logPath, line + '\n', 'utf8');
    } catch {
      // log basarisiz olsa da basarili sayalim, ama uyaralim
    }
    return res.json({ ok: true, queued: true });
  }

  try {
    await transporter.sendMail({
      from: `AYDAKAR Web <${SMTP_USER}>`,
      to: CONTACT_TO,
      replyTo: cleanEmail,
      subject: `[Web İletişim] ${cleanSubject}`,
      text: `Ad: ${cleanName}\nE-posta: ${cleanEmail}\n\nMesaj:\n${cleanMessage}`
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Mail gonderilemedi: ' + (err?.message || 'sunucu hatasi') });
  }
});

// ==== Basit ziyaretci analitigi ====
const readAnalytics = async () => {
  try {
    const raw = await fs.readFile(ANALYTICS_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
};
const writeAnalytics = async (data) => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(ANALYTICS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch {
    // disk yazimi basarisiz olsa bile akisi kesmeyiz
  }
};

app.post('/api/analytics/visit', async (req, res) => {
  const data = await readAnalytics();
  const today = new Date().toISOString().slice(0, 10);
  data.totalVisits = (data.totalVisits || 0) + 1;
  data.daily = data.daily || {};
  data.daily[today] = (data.daily[today] || 0) + 1;
  await writeAnalytics(data);
  res.json({ ok: true, totalVisits: data.totalVisits });
});

app.get('/api/analytics/summary', verifySession, async (_req, res) => {
  const data = await readAnalytics();
  res.json(data);
});

app.delete('/api/upload', verifySession, async (req, res) => {
  const { url, thumbnailUrl } = req.body || {};
  if (!url || typeof url !== 'string' || !url.startsWith('/uploads/')) {
    return res.status(400).json({ message: 'Gecersiz dosya yolu' });
  }

  const safeJoin = (relUrl) => {
    const abs = path.normalize(path.join(__dirname, relUrl));
    if (!abs.startsWith(UPLOADS_DIR)) return null;
    return abs;
  };

  const filePath = safeJoin(url);
  if (!filePath) return res.status(400).json({ message: 'Gecersiz dosya yolu' });
  await fs.unlink(filePath).catch(() => {});

  if (thumbnailUrl && typeof thumbnailUrl === 'string' && thumbnailUrl.startsWith('/uploads/')) {
    const thumbPath = safeJoin(thumbnailUrl);
    if (thumbPath) await fs.unlink(thumbPath).catch(() => {});
  }

  res.json({ ok: true });
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: `Dosya boyutu en fazla ${MAX_UPLOAD_MB}MB olabilir.` });
  }
  if (err && err.message) {
    return res.status(400).json({ message: err.message });
  }
  return res.status(500).json({ message: 'Sunucu hatasi' });
});

app.listen(PORT, () => {
  console.log(`AYDAKAR TEAM backend running: http://localhost:${PORT}`);
});
