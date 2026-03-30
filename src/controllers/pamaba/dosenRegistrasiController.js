const prisma = require('../../prisma/client');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config for dosen berkas
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/dosen';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `dosen_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const uploadBerkas = upload.fields([
    { name: 'dokumenCV', maxCount: 1 },
    { name: 'dokumenIjazah', maxCount: 1 },
    { name: 'dokumenKTP', maxCount: 1 },
    { name: 'dokumenSertifikasi', maxCount: 1 },
    { name: 'foto', maxCount: 1 },
]);

const buildFilePath = (file) => {
    if (!file) return null;
    return '/' + file.path.replace(/\\/g, '/').replace(/^\//, '');
};

// Daftar Dosen — no OTP, langsung buat akun + record Dosen
const daftar = async (req, res) => {
    try {
        const { nama, username, nidn, email, password, telepon, pendidikanTerakhir } = req.body;

        if (!nama || !email || !password || !username) {
            return res.status(400).json({ success: false, message: 'Nama, username, email, dan password harus diisi!' });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, message: 'Password minimal 8 karakter!' });
        }

        // Cek email/username sudah ada
        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email }, { username }] }
        });
        if (existingUser) {
            return res.status(400).json({
                success: false, 
                message: existingUser.email === email ? 'Email sudah terdaftar!' : 'Username sudah digunakan!'
            });
        }

        // Cek NIDN sudah ada (jika diisi)
        if (nidn) {
            const existingDosen = await prisma.dosen.findUnique({ where: { nidn } });
            if (existingDosen) {
                return res.status(400).json({ success: false, message: 'NIDN sudah terdaftar!' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Buat User dengan role DOSEN
        const user = await prisma.user.create({
            data: {
                nama, email, username,
                password: hashedPassword,
                roles: { create: [{ role: 'DOSEN' }] }
            },
            include: { roles: true }
        });

        // Buat record Dosen dengan status PENDING
        const dosen = await prisma.dosen.create({
            data: {
                nidn: nidn || `TEMP-${Date.now()}`, // Temporary NIDN if not provided
                nama,
                email,
                telepon: telepon || null,
                pendidikanTerakhir: pendidikanTerakhir || null,
                isAktif: false, // Belum aktif sampai disetujui
                statusVerifikasi: 'PENDING',
                foto: buildFilePath(req.files?.foto?.[0]),
                dokumenCV: buildFilePath(req.files?.dokumenCV?.[0]),
                dokumenIjazah: buildFilePath(req.files?.dokumenIjazah?.[0]),
                dokumenKTP: buildFilePath(req.files?.dokumenKTP?.[0]),
                dokumenSertifikasi: buildFilePath(req.files?.dokumenSertifikasi?.[0]),
            }
        });

        res.status(201).json({
            success: true,
            message: 'Pendaftaran dosen berhasil! Menunggu persetujuan admin.',
            data: {
                user: { id: user.id, nama: user.nama, email: user.email, roles: user.roles.map(r => r.role) },
                dosen
            }
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'Email atau NIDN sudah terdaftar!' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get dosen berkas status by email
const getByEmail = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ success: false, message: 'Email harus diisi!' });

        const dosen = await prisma.dosen.findUnique({ where: { email } });
        if (!dosen) return res.status(404).json({ success: false, message: 'Dosen tidak ditemukan!' });

        res.json({ success: true, data: dosen });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update berkas dosen (reupload)
const updateBerkas = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const dosen = await prisma.dosen.findUnique({ where: { id } });
        if (!dosen) return res.status(404).json({ success: false, message: 'Dosen tidak ditemukan!' });

        const updateData = {};
        if (req.files?.dokumenCV?.[0]) updateData.dokumenCV = buildFilePath(req.files.dokumenCV[0]);
        if (req.files?.dokumenIjazah?.[0]) updateData.dokumenIjazah = buildFilePath(req.files.dokumenIjazah[0]);
        if (req.files?.dokumenKTP?.[0]) updateData.dokumenKTP = buildFilePath(req.files.dokumenKTP[0]);
        if (req.files?.dokumenSertifikasi?.[0]) updateData.dokumenSertifikasi = buildFilePath(req.files.dokumenSertifikasi[0]);
        if (req.files?.foto?.[0]) updateData.foto = buildFilePath(req.files.foto[0]);

        // Reset status ke PENDING karena berkas diupdate
        updateData.statusVerifikasi = 'PENDING';
        updateData.alasanTolak = null;

        const updated = await prisma.dosen.update({ where: { id }, data: updateData });
        res.json({ success: true, message: 'Berkas berhasil diupdate!', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin: approve/reject dosen
const verifikasi = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { status, alasanTolak } = req.body; // 'DISETUJUI' or 'DITOLAK'

        if (!['DISETUJUI', 'DITOLAK'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status harus DISETUJUI atau DITOLAK!' });
        }

        const dosen = await prisma.dosen.findUnique({ where: { id } });
        if (!dosen) return res.status(404).json({ success: false, message: 'Dosen tidak ditemukan!' });

        const updateData = {
            statusVerifikasi: status,
            alasanTolak: status === 'DITOLAK' ? (alasanTolak || 'Berkas tidak lengkap') : null,
            isAktif: status === 'DISETUJUI'
        };

        const updated = await prisma.dosen.update({ where: { id }, data: updateData });
        res.json({ success: true, message: `Dosen ${status === 'DISETUJUI' ? 'disetujui' : 'ditolak'}!`, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all pending dosen for admin
const getPending = async (req, res) => {
    try {
        const data = await prisma.dosen.findMany({
            where: { statusVerifikasi: 'PENDING' },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, total: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { daftar, getByEmail, updateBerkas, verifikasi, getPending, uploadBerkas };
