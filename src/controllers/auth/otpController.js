const prisma = require('../../prisma/client');
const bcrypt = require('bcryptjs');
const { kirimOTP } = require('../../utils/emailSender');

// Simpan OTP sementara di memory (simple, tanpa tabel baru)
const otpStore = new Map();

// Generate OTP 6 digit
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
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

        // Cek email sudah terdaftar
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email sudah terdaftar!'
            });
        }

        // Cek email sudah terdaftar di pendaftar
        const existingPendaftar = await prisma.pendaftar.findUnique({
            where: { email }
        });

        if (existingPendaftar) {
            return res.status(400).json({
                success: false,
                message: 'Email sudah digunakan untuk mendaftar!'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const expiredAt = Date.now() + 10 * 60 * 1000; // 10 menit

        // Simpan OTP + data user sementara
        otpStore.set(email, {
            otp,
            expiredAt,
            nama,
            email,
            password
        });

        // Kirim OTP ke email
        await kirimOTP(email, otp, nama);

        res.json({
            success: true,
            message: `Kode OTP telah dikirim ke ${email}!`
        });

    } catch (error) {
        console.error('Error kirim OTP:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengirim OTP! Cek konfigurasi email.'
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

        // Buat akun user dengan role MAHASISWA
        const hashedPassword = await bcrypt.hash(data.password, 10);
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
        res.status(500).json({ success: false, message: error.message });
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

        const otp = generateOTP();
        const expiredAt = Date.now() + 10 * 60 * 1000;

        otpStore.set(email, { ...data, otp, expiredAt });

        await kirimOTP(email, otp, data.nama);

        res.json({
            success: true,
            message: `OTP baru telah dikirim ke ${email}!`
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { kirimKodeOTP, verifikasiOTP, kirimUlangOTP };