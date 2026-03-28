const prisma = require('../../prisma/client');
const bcrypt = require('bcryptjs');
const { kirimOTP } = require('../../utils/emailSender');

// Simpan OTP sementara di memory (simple, tanpa tabel baru)
const otpStore = new Map();

// Cleanup OTP expired setiap 5 menit
setInterval(() => {
    const now = Date.now();
    for (const [email, data] of otpStore.entries()) {
        if (now > data.expiredAt) {
            otpStore.delete(email);
        }
    }
}, 5 * 60 * 1000);

// Generate OTP 6 digit menggunakan crypto
const generateOTP = () => {
    return String(require('crypto').randomInt(100000, 1000000));
};

// Helper sanitasi error
const safeError = (error, defaultMsg = 'Terjadi kesalahan server!') => {
    return process.env.NODE_ENV === 'production' ? defaultMsg : error.message;
};

// Kirim OTP ke email
const kirimKodeOTP = async (req, res) => {
    try {
        const { nama, email, password, konfirmasiPassword } = req.body;

        if (!nama || !email || !password || !konfirmasiPassword) {
            return res.status(400).json({
                success: false,
                message: 'Semua field harus diisi!'
            });
        }

        if (password !== konfirmasiPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password dan konfirmasi password tidak sama!'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password minimal 8 karakter!'
            });
        }

        // Rate limit per email: max 3 request OTP per 10 menit
        const existing = otpStore.get(email);
        if (existing && existing.attempts >= 3 && Date.now() < existing.expiredAt) {
            return res.status(429).json({
                success: false,
                message: 'Terlalu banyak permintaan OTP! Tunggu beberapa menit.'
            });
        }

        // Cek email sudah terdaftar di user
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email sudah terdaftar!'
            });
        }

        // Cek email sudah terdaftar di pendaftar
        const existingPendaftar = await prisma.pendaftar.findUnique({ where: { email } });
        if (existingPendaftar) {
            return res.status(400).json({
                success: false,
                message: 'Email sudah digunakan untuk mendaftar!'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const expiredAt = Date.now() + 10 * 60 * 1000; // 10 menit
        const attempts = existing ? (existing.attempts || 0) + 1 : 1;

        // Simpan OTP + data user sementara
        otpStore.set(email, {
            otp,
            expiredAt,
            nama,
            email,
            password,
            attempts
        });

        // Verifikasi ENV
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('Email credentials di .env atau server belum di set!');
            return res.status(500).json({
                success: false,
                message: 'Server sedang mengalami gangguan pengiriman email, harap hubungi administrator.'
            });
        }

        // Kirim OTP ke email
        await kirimOTP(email, otp, nama);

        res.json({
            success: true,
            message: `Kode OTP telah dikirim ke ${email}!`,
            otp: process.env.NODE_ENV === 'development' ? otp : undefined // Untuk testing lokal
        });

    } catch (error) {
        console.error('Error kirim OTP:', error.message);
        res.status(500).json({
            success: false,
            message: 'Gagal mengirim kode ke email. Pastikan format email Anda benar!'
        });
    }
};

// Verifikasi OTP & buat akun
const verifikasiOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email dan OTP harus diisi!'
            });
        }

        // Cek OTP di store
        const data = otpStore.get(email);

        if (!data) {
            return res.status(400).json({
                success: false,
                message: 'OTP tidak ditemukan! Silakan minta OTP baru.'
            });
        }

        // Cek expired
        if (Date.now() > data.expiredAt) {
            otpStore.delete(email);
            return res.status(400).json({
                success: false,
                message: 'OTP sudah expired! Silakan minta OTP baru.'
            });
        }

        // Cek OTP benar
        if (data.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Kode OTP salah!'
            });
        }

        // OTP benar — hapus dari store
        otpStore.delete(email);

        // Buat akun user dengan role PENDAFTAR
        const hashedPassword = await bcrypt.hash(data.password, 12);
        const user = await prisma.user.create({
            data: {
                nama: data.nama,
                email: data.email,
                password: hashedPassword,
                roles: {
                    create: [{ role: 'PENDAFTAR' }]
                }
            },
            include: { roles: true }
        });

        res.status(201).json({
            success: true,
            message: 'Email berhasil diverifikasi! Akun telah dibuat.',
            data: {
                id: user.id,
                nama: user.nama,
                email: user.email,
                roles: user.roles.map(r => r.role)
            }
        });

    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                message: 'Email sudah terdaftar!'
            });
        }
        res.status(500).json({ success: false, message: safeError(error) });
    }
};

// Kirim ulang OTP
const kirimUlangOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const data = otpStore.get(email);

        if (!data) {
            return res.status(400).json({
                success: false,
                message: 'Session habis! Silakan mulai dari awal.'
            });
        }

        // Rate limit
        if (data.attempts >= 5) {
            return res.status(429).json({
                success: false,
                message: 'Terlalu banyak permintaan OTP! Tunggu beberapa menit.'
            });
        }

        const otp = generateOTP();
        const expiredAt = Date.now() + 10 * 60 * 1000;
        const attempts = (data.attempts || 0) + 1;

        otpStore.set(email, { ...data, otp, expiredAt, attempts });

        // Cek ENV email
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(500).json({
                success: false,
                message: 'Server sedang mengalami gangguan pengiriman email.'
            });
        }

        // Kirim ulang OTP
        await kirimOTP(email, otp, data.nama);

        res.json({
            success: true,
            message: `OTP baru telah dikirim ke ${email}!`,
            otp: process.env.NODE_ENV === 'development' ? otp : undefined
        });

    } catch (error) {
        console.error('Error resend OTP:', error.message);
        res.status(500).json({
            success: false,
            message: 'Gagal mengirim ulang OTP.'
        });
    }
};

module.exports = { kirimKodeOTP, verifikasiOTP, kirimUlangOTP };