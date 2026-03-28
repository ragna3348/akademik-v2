require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
    origin: [
        'http://localhost:3001',
        'http://localhost:3000',
        process.env.FRONTEND_URL,
    ].filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, message: 'Terlalu banyak request!' }
});
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Terlalu banyak percobaan login!' }
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// ===== ROOT =====
app.get('/', (req, res) => {
    res.json({ message: "🎓 API Sistem Akademik", versi: "7.0.0" });
});

// ===== AUTH =====
app.use('/auth', loginLimiter, require('./src/routes/auth/authRoutes'));
app.use('/otp', require('./src/routes/auth/otpRoutes'));

// ===== AKADEMIK — urutan penting, spesifik dulu =====
app.use('/fakultas', require('./src/routes/akademik/fakultasRoutes'));
app.use('/prodi', require('./src/routes/akademik/prodiRoutes'));
app.use('/jenis-kelas', require('./src/routes/akademik/jenisKelasRoutes'));

app.use('/akademik/mata-kuliah', require('./src/routes/akademik/mataKuliahRoutes'));
app.use('/akademik/dosen', require('./src/routes/akademik/dosenRoutes'));
app.use('/akademik/krs', require('./src/routes/akademik/krsRoutes'));
app.use('/akademik/heregistrasi', require('./src/routes/akademik/heregistrasiRoutes'));
app.use('/akademik/mahasiswa', require('./src/routes/akademik/mahasiswaRoutes')); //DINAMIK HARUS PALING BAWAH

app.use('/jadwal', require('./src/routes/akademik/jadwalRoutes'));

// ===== KEUANGAN =====
app.use('/keuangan', require('./src/routes/keuangan/keuanganRoutes'));

// ===== PAMABA =====
app.use('/pamaba/gelombang', require('./src/routes/pamaba/gelombangRoutes'));
app.use('/pamaba/pendaftar', require('./src/routes/pamaba/pendaftarRoutes'));
app.use('/pamaba/pembayaran', require('./src/routes/pamaba/pembayaranMabaRoutes'));
app.use('/pamaba/afiliasi', require('./src/routes/pamaba/afiliasiRoutes'));

// ===== PORTAL MAHASISWA =====
app.use('/portal', require('./src/routes/portal/portalRoutes'));

// ===== DASHBOARD =====
app.use('/dashboard', require('./src/routes/dashboardRoutes'));

// ===== PENGATURAN =====
app.use('/pengaturan/users', require('./src/routes/pengaturan/userRoutes'));
app.use('/pengaturan/setting', require('./src/routes/pengaturan/settingRoutes'));

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.stack);
    const isProd = process.env.NODE_ENV === 'production';
    res.status(err.status || 500).json({
        success: false,
        message: isProd ? 'Terjadi kesalahan server!' : err.message
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server berjalan di http://localhost:${PORT}`);
});