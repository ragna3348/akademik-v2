const prisma = require('../../prisma/client');

const getAll = async (req, res) => {
    try {
        const data = await prisma.hargaKeuangan.findMany({
            include: { jenisKeuangan: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, total: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const data = await prisma.hargaKeuangan.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { jenisKeuangan: true }
        });
        if (!data) return res.status(404).json({ success: false, message: 'Harga tidak ditemukan!' });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const create = async (req, res) => {
    try {
        const { jenisKeuanganId, nominal, angkatan, keterangan } = req.body;
        
        if (!jenisKeuanganId || nominal === undefined) {
            return res.status(400).json({ success: false, message: 'Jenis Keuangan dan Nominal wajib diisi!' });
        }

        const data = await prisma.hargaKeuangan.create({
            data: {
                jenisKeuanganId: parseInt(jenisKeuanganId),
                nominal: parseFloat(nominal),
                angkatan: angkatan ? parseInt(angkatan) : null,
                keterangan: keterangan || null
            },
            include: { jenisKeuangan: true }
        });

        res.status(201).json({ success: true, message: 'Harga berhasil ditambahkan!', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const { jenisKeuanganId, nominal, angkatan, keterangan } = req.body;
        
        const data = await prisma.hargaKeuangan.update({
            where: { id: parseInt(req.params.id) },
            data: {
                jenisKeuanganId: jenisKeuanganId ? parseInt(jenisKeuanganId) : undefined,
                nominal: nominal !== undefined ? parseFloat(nominal) : undefined,
                angkatan: angkatan !== undefined ? (angkatan ? parseInt(angkatan) : null) : undefined,
                keterangan: keterangan !== undefined ? keterangan : undefined
            },
            include: { jenisKeuangan: true }
        });

        res.json({ success: true, message: 'Harga berhasil diupdate!', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const remove = async (req, res) => {
    try {
        await prisma.hargaKeuangan.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ success: true, message: 'Harga berhasil dihapus!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAll, getById, create, update, remove };
