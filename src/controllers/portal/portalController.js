const prisma = require('../../prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Helper: ambil mahasiswa dari user login
const getMahasiswaByEmail = async (email) => {
    return await prisma.mahasiswa.findFirst({
        where: { email },
        include: {
            prodi: { include: { fakultas: true } },
            jenisKelas: true,
            dosenWali: true
        }
    });
};

// GET /portal/profil
const getProfil = async (req, res) => {
    try {
        const mahasiswa = await getMahasiswaByEmail(req.user.email);
        if (!mahasiswa) return res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan!' });
        res.json({ success: true, data: mahasiswa });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /portal/profil
const updateProfil = async (req, res) => {
    try {
        const mahasiswa = await getMahasiswaByEmail(req.user.email);
        if (!mahasiswa) return res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan!' });

        const { telepon, alamat } = req.body;

        let foto = mahasiswa.foto;
        if (req.file) {
            // Hapus foto lama
            if (mahasiswa.foto) {
                const oldPath = path.join(__dirname, '../../../', mahasiswa.foto);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            foto = `/uploads/foto/${req.file.filename}`;
        }

        const updated = await prisma.mahasiswa.update({
            where: { id: mahasiswa.id },
            data: { telepon, alamat, foto },
            include: { prodi: true, jenisKelas: true }
        });

        res.json({ success: true, message: 'Profil berhasil diupdate!', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /portal/ganti-password
const gantiPassword = async (req, res) => {
    try {
        const { passwordLama, passwordBaru } = req.body;
        const user = await prisma.user.findUnique({ where: { email: req.user.email } });
        const valid = await bcrypt.compare(passwordLama, user.password);
        if (!valid) return res.status(400).json({ success: false, message: 'Password lama salah!' });
        const hashed = await bcrypt.hash(passwordBaru, 10);
        await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
        res.json({ success: true, message: 'Password berhasil diganti!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /portal/dashboard
const getDashboard = async (req, res) => {
    try {
        const mahasiswa = await getMahasiswaByEmail(req.user.email);
        if (!mahasiswa) return res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan!' });

        const [krs, tagihan] = await Promise.all([
            prisma.kRS.findMany({
                where: { mahasiswaId: mahasiswa.id },
                include: { periode: true, detailKRS: { include: { mataKuliah: true } } },
                orderBy: { createdAt: 'desc' },
                take: 1
            }),
            prisma.keuangan.findMany({
                where: { mahasiswaId: mahasiswa.id, status: 'belum_bayar' }
            })
        ]);

        res.json({
            success: true,
            data: {
                mahasiswa,
                krsAktif: krs[0] || null,
                tagihanBelumBayar: tagihan.length,
                totalTagihan: tagihan.reduce((s, t) => s + t.nominal, 0)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /portal/krs
const getKRS = async (req, res) => {
    try {
        const mahasiswa = await getMahasiswaByEmail(req.user.email);
        if (!mahasiswa) return res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan!' });

        const periodeAktif = await prisma.periodeKRS.findFirst({ where: { isAktif: true } });
        const semua = await prisma.kRS.findMany({
            where: { mahasiswaId: mahasiswa.id },
            include: {
                periode: true,
                detailKRS: { include: { mataKuliah: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Mata kuliah tersedia untuk semester mahasiswa
        const mataKuliah = await prisma.mataKuliah.findMany({
            where: { prodiId: mahasiswa.prodiId, semester: mahasiswa.semester }
        });

        res.json({
            success: true,
            data: { krs: semua, periodeAktif, mataKuliah, mahasiswa }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /portal/krs
const ajukanKRS = async (req, res) => {
    try {
        const { periodeId, mataKuliahIds } = req.body;
        const mahasiswa = await getMahasiswaByEmail(req.user.email);
        if (!mahasiswa) return res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan!' });

        // Cek sudah ada KRS di periode ini
        const existing = await prisma.kRS.findUnique({
            where: { mahasiswaId_periodeId: { mahasiswaId: mahasiswa.id, periodeId: parseInt(periodeId) } }
        });
        if (existing) return res.status(400).json({ success: false, message: 'KRS periode ini sudah diajukan!' });

        // Hitung total SKS
        const mks = await prisma.mataKuliah.findMany({
            where: { id: { in: mataKuliahIds.map(Number) } }
        });
        const totalSks = mks.reduce((s, m) => s + m.sks, 0);

        const krs = await prisma.kRS.create({
            data: {
                mahasiswaId: mahasiswa.id,
                periodeId: parseInt(periodeId),
                status: 'DIAJUKAN',
                totalSks,
                detailKRS: {
                    create: mataKuliahIds.map(id => ({ mataKuliahId: parseInt(id) }))
                }
            },
            include: { detailKRS: { include: { mataKuliah: true } }, periode: true }
        });

        res.status(201).json({ success: true, message: 'KRS berhasil diajukan!', data: krs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /portal/jadwal
const getJadwal = async (req, res) => {
    try {
        const mahasiswa = await getMahasiswaByEmail(req.user.email);
        if (!mahasiswa) return res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan!' });

        const jadwal = await prisma.jadwalKuliah.findMany({
            where: { mataKuliah: { prodiId: mahasiswa.prodiId, semester: mahasiswa.semester } },
            include: { mataKuliah: true, dosen: true },
            orderBy: [{ hari: 'asc' }, { jamMulai: 'asc' }]
        });

        res.json({ success: true, data: jadwal });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /portal/keuangan
const getKeuangan = async (req, res) => {
    try {
        const mahasiswa = await getMahasiswaByEmail(req.user.email);
        if (!mahasiswa) return res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan!' });

        const tagihan = await prisma.keuangan.findMany({
            where: { mahasiswaId: mahasiswa.id },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, data: tagihan });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getProfil, updateProfil, gantiPassword, getDashboard, getKRS, ajukanKRS, getJadwal, getKeuangan };