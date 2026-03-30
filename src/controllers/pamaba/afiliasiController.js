const prisma = require('../../prisma/client');

const getAll = async (req, res) => {
    try {
        const data = await prisma.userAfiliasi.findMany({
            include: {
                pendaftar: {
                    include: { prodi: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const result = data.map(a => ({
            ...a,
            totalPendaftar: a.pendaftar.length,
            pendaftarLulus: a.pendaftar.filter(p => p.status === 'LULUS').length,
            pendaftarGagal: a.pendaftar.filter(p => p.status === 'GAGAL').length,
        }));

        res.json({ success: true, total: data.length, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const data = await prisma.userAfiliasi.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                pendaftar: {
                    include: { prodi: true, gelombang: true },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!data) return res.status(404).json({ success: false, message: 'Afiliasi tidak ditemukan!' });

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const create = async (req, res) => {
    try {
        const { nama, email, telepon } = req.body;
        if (!nama) {
            return res.status(400).json({ success: false, message: 'Nama wajib diisi!' });
        }

        // Generate kode afiliasi unik
        const kodeAfiliasi = await generateKode(nama);

        const data = await prisma.userAfiliasi.create({
            data: {
                nama,
                email: email || null,
                telepon: telepon || null,
                kodeAfiliasi,
                isAktif: true
            }
        });

        res.status(201).json({ success: true, message: 'Afiliasi berhasil dibuat!', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const generateKode = async (nama) => {
    const prefix = nama
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 4);

    const random = Math.floor(1000 + Math.random() * 9000);
    const kode = `${prefix}${random}`;

    // Pastikan unik
    const existing = await prisma.userAfiliasi.findUnique({ where: { kodeAfiliasi: kode } });
    if (existing) return generateKode(nama);

    return kode;
};

const update = async (req, res) => {
    try {
        const { nama, email, telepon, isAktif } = req.body;
        const data = await prisma.userAfiliasi.update({
            where: { id: parseInt(req.params.id) },
            data: {
                nama,
                email: email || null,
                telepon: telepon || null,
                isAktif: isAktif !== undefined ? isAktif : true
            }
        });
        res.json({ success: true, message: 'Afiliasi berhasil diupdate!', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const toggleStatus = async (req, res) => {
    try {
        const afiliasi = await prisma.userAfiliasi.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!afiliasi) return res.status(404).json({ success: false, message: 'Afiliasi tidak ditemukan!' });

        const updated = await prisma.userAfiliasi.update({
            where: { id: parseInt(req.params.id) },
            data: { isAktif: !afiliasi.isAktif }
        });

        res.json({
            success: true,
            message: `Afiliasi ${updated.isAktif ? 'diaktifkan' : 'dinonaktifkan'}!`,
            data: updated
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const regenerateKode = async (req, res) => {
    try {
        const afiliasi = await prisma.userAfiliasi.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!afiliasi) return res.status(404).json({ success: false, message: 'Afiliasi tidak ditemukan!' });

        const kodeAfiliasi = await generateKode(afiliasi.nama);
        const updated = await prisma.userAfiliasi.update({
            where: { id: parseInt(req.params.id) },
            data: { kodeAfiliasi }
        });

        res.json({ success: true, message: 'Kode berhasil digenerate ulang!', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const remove = async (req, res) => {
    try {
        // Lepas relasi pendaftar dulu
        await prisma.pendaftar.updateMany({
            where: { afiliasiId: parseInt(req.params.id) },
            data: { afiliasiId: null }
        });

        await prisma.userAfiliasi.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true, message: 'Afiliasi berhasil dihapus!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /afiliasi/cek/:kode — untuk form pendaftaran cek kode
const cekKode = async (req, res) => {
    try {
        const data = await prisma.userAfiliasi.findUnique({
            where: { kodeAfiliasi: req.params.kode },
            select: { id: true, nama: true, kodeAfiliasi: true, isAktif: true }
        });

        if (!data || !data.isAktif) {
            return res.status(404).json({ success: false, message: 'Kode afiliasi tidak valid!' });
        }

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAll, getById, create, update, toggleStatus, regenerateKode, remove, cekKode };