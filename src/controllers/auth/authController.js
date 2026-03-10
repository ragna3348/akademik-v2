const prisma = require('../../prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

        const hashedPassword = await bcrypt.hash(password, 10);

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
        res.status(500).json({ success: false, message: error.message });
    }
};

// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email dan password harus diisi!'
            });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { roles: true }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email atau password salah!'
            });
        }

        if (!user.status) {
            return res.status(401).json({
                success: false,
                message: 'Akun Anda telah dinonaktifkan!'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Email atau password salah!'
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
                roles
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Profile
const getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { roles: true }
        });
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
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cek apakah mahasiswa sudah mengisi form pendaftaran
const cekStatus = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { roles: true }
        });

        const roles = user.roles.map(r => r.role);

        // Cek apakah role MAHASISWA
        if (!roles.includes('MAHASISWA')) {
            return res.json({
                success: true,
                data: { sudahDaftar: true, role: roles }
            });
        }

        // Cek apakah sudah mengisi form pendaftaran
        const pendaftar = await prisma.pendaftar.findUnique({
            where: { email: user.email }
        });

        res.json({
            success: true,
            data: {
                sudahDaftar: !!pendaftar,
                role: roles,
                pendaftar: pendaftar || null
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { register, login, getProfile, cekStatus };