const prisma = require('../../prisma/client');

const getAll = async (req, res) => {
    try {
        const { status, mahasiswaId, prodiId, search } = req.query;
        const where = {};
        if (status) where.status = status;
        if (mahasiswaId) where.mahasiswaId = parseInt(mahasiswaId);
        if (prodiId) where.mahasiswa = { prodiId: parseInt(prodiId) };
        if (search) where.mahasiswa = {
            OR: [
                { nama: { contains: search, mode: 'insensitive' } },
                { nim: { contains: search, mode: 'insensitive' } }
            ]
        };

        const data = await prisma.keuangan.findMany({
            where,
            include: { mahasiswa: { include: { prodi: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const totalTagihan = data.reduce((s, k) => s + k.nominal, 0);
        const totalLunas = data.filter(k => k.status === 'sudah_bayar').reduce((s, k) => s + k.nominal, 0);
        const totalBelum = data.filter(k => k.status === 'belum_bayar').reduce((s, k) => s + k.nominal, 0);

        res.json({
            success: true,
            total: data.length,
            summary: { totalTagihan, totalLunas, totalBelum },
            data
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const create = async (req, res) => {
    try {
        const { mahasiswaId, jenis, nominal, status, keterangan, tanggal } = req.body;
        if (!mahasiswaId || !jenis || !nominal) {
            return res.status(400).json({ success: false, message: 'Mahasiswa, jenis, dan nominal wajib diisi!' });
        }

        const data = await prisma.keuangan.create({
            data: {
                mahasiswaId: parseInt(mahasiswaId),
                jenis,
                nominal: parseFloat(nominal),
                status: status || 'belum_bayar',
                keterangan: keterangan || null,
                tanggal: tanggal ? new Date(tanggal) : new Date()
            },
            include: { mahasiswa: { include: { prodi: true } } }
        });

        res.status(201).json({ success: true, message: 'Tagihan berhasil dibuat!', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createMassal = async (req, res) => {
    try {
        const { prodiId, jenisKelasId, tahunAngkatan, jenis, nominal, keterangan } = req.body;
        if (!jenis || !nominal) {
            return res.status(400).json({ success: false, message: 'Jenis dan nominal wajib diisi!' });
        }

        const where = { status: 'AKTIF' };
        if (prodiId) where.prodiId = parseInt(prodiId);
        if (jenisKelasId) where.jenisKelasId = parseInt(jenisKelasId);
        if (tahunAngkatan) where.tahunAngkatan = parseInt(tahunAngkatan);

        const mahasiswa = await prisma.mahasiswa.findMany({ where });
        if (mahasiswa.length === 0) {
            return res.status(400).json({ success: false, message: 'Tidak ada mahasiswa yang sesuai filter!' });
        }

        await prisma.keuangan.createMany({
            data: mahasiswa.map(m => ({
                mahasiswaId: m.id,
                jenis,
                nominal: parseFloat(nominal),
                status: 'belum_bayar',
                keterangan: keterangan || null,
                tanggal: new Date()
            }))
        });

        res.json({
            success: true,
            message: `Tagihan berhasil dibuat untuk ${mahasiswa.length} mahasiswa!`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const { jenis, nominal, status, keterangan, tanggal } = req.body;
        const data = await prisma.keuangan.update({
            where: { id: parseInt(req.params.id) },
            data: {
                jenis,
                nominal: parseFloat(nominal),
                status,
                keterangan: keterangan || null,
                tanggal: tanggal ? new Date(tanggal) : undefined
            },
            include: { mahasiswa: { include: { prodi: true } } }
        });
        res.json({ success: true, message: 'Tagihan berhasil diupdate!', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const bayar = async (req, res) => {
    try {
        const data = await prisma.keuangan.update({
            where: { id: parseInt(req.params.id) },
            data: { status: 'sudah_bayar', tanggal: new Date() },
            include: { mahasiswa: true }
        });
        res.json({ success: true, message: 'Pembayaran berhasil dikonfirmasi!', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const bayarMassal = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Pilih minimal 1 tagihan!' });
        }

        await prisma.keuangan.updateMany({
            where: { id: { in: ids.map(Number) } },
            data: { status: 'sudah_bayar', tanggal: new Date() }
        });

        res.json({ success: true, message: `${ids.length} tagihan berhasil dikonfirmasi!` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const remove = async (req, res) => {
    try {
        await prisma.keuangan.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true, message: 'Tagihan berhasil dihapus!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAll, create, createMassal, update, bayar, bayarMassal, remove };