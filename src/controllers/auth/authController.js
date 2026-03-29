const prisma = require('../../prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper validasi email
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Helper sanitasi error agar tidak bocor ke client
const safeError = (error, defaultMsg = 'Terjadi kesalahan server!') => {
    return process.env.NODE_ENV === 'production' ? defaultMsg : error.message;
};

// Register
const register = async (req, res) => {
    try {
        const { nama, email, password, roles } = req.body;
        if (!nama || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Nama, email, dan password harus diisi!'
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ success: false, message: 'Format email tidak valid!' });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, message: 'Password minimal 8 karakter!' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                nama, email,
                password: hashedPassword,
                roles: {
                    create: (roles || ['ADMIN']).map(role => ({ role }))
                }
            },
            include: { roles: true }
        });

        res.status(201).json({
            success: true,
            message: 'User berhasil dibuat!',
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

// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body; // 'email' di sini bertindak sebagai 'identifier'
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email/Username/NIM/NIDN dan password harus diisi!'
            });
        }

        const identifier = email;

        // 1. Cari by Email atau Username di tabel User
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
                ]
            },
            include: { roles: true }
        });

        // 2. Jika tidak ketemu, cari by NIM di tabel Mahasiswa
        if (!user) {
            const mahasiswa = await prisma.mahasiswa.findUnique({
                where: { nim: identifier }
            });
            if (mahasiswa && mahasiswa.email) {
                user = await prisma.user.findUnique({
                    where: { email: mahasiswa.email },
                    include: { roles: true }
                });
            }
        }

        // 3. Jika tidak ketemu, cari by NIDN di tabel Dosen
        if (!user) {
            const dosen = await prisma.dosen.findUnique({
                where: { nidn: identifier }
            });
            if (dosen && dosen.email) {
                user = await prisma.user.findUnique({
                    where: { email: dosen.email },
                    include: { roles: true }
                });
            }
        }

        const isMatch = user ? await bcrypt.compare(password, user.password) : false;

        // --- DEBUG LOG UNTUK RAILWAY ---
        if (identifier === 'superadmin@kampus.ac.id') {
            console.log(`[DEBUG SUPERADMIN] Ditemukan: ${!!user}, isMatch: ${isMatch}, password hash length: ${user?.password?.length}`);
        }

        if (!user || !isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Identifier atau password salah!'
            });
        }

        if (!user.status) {
            return res.status(401).json({
                success: false,
                message: 'Akun Anda telah dinonaktifkan!'
            });
        }

        const roles = user.roles.map(r => r.role);

        const token = jwt.sign(
            { id: user.id, nama: user.nama, email: user.email, roles },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login berhasil!',
            token,
            user: {
                id: user.id,
                nama: user.nama,
                email: user.email,
                username: user.username,
                roles
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: safeError(error) });
    }
};

// Get Profile
const getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { roles: true }
        });
        if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan!' });
        res.json({
            success: true,
            data: {
                id: user.id,
                nama: user.nama,
                email: user.email,
                roles: user.roles.map(r => r.role)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: safeError(error) });
    }
};

// Cek apakah mahasiswa sudah mengisi form pendaftaran
const cekStatus = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { roles: true }
        });

        if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan!' });

        const roles = user.roles.map(r => r.role);

        // Cek apakah role PENDAFTAR/MAHASISWA  
        if (roles.includes('MAHASISWA')) {
            const mahasiswa = await prisma.mahasiswa.findFirst({ where: { email: user.email } });
            return res.json({
                success: true,
                data: { sudahDaftar: true, role: roles, mahasiswa }
            });
        }

        if (roles.includes('PENDAFTAR')) {
            const pendaftar = await prisma.pendaftar.findUnique({ where: { email: user.email } });
            return res.json({
                success: true,
                data: { sudahDaftar: !!pendaftar, role: roles, pendaftar: pendaftar || null }
            });
        }

        res.json({
            success: true,
            data: { sudahDaftar: true, role: roles }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: safeError(error) });
    }
};

module.exports = { register, login, getProfile, cekStatus };