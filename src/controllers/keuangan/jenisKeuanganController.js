const prisma = require('../../prisma/client');

const getAll = async (req, res) => {
    try {
        const data = await prisma.jenisKeuangan.findMany({ orderBy: { kode: 'asc' } });
        res.json({ success: true, total: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAktif = async (req, res) => {
    try {
        const data = await prisma.jenisKeuangan.findMany({
            where: { isAktif: true },
            orderBy: { kode: 'asc' }
        });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const create = async (req, res) => {
    try {
        const { kode, nama, keterangan } = req.body;
        if (!kode || !nama) return res.status(400).json({ success: false, message: 'Kode dan nama wajib diisi!' });
        const data = await prisma.jenisKeuangan.create({ data: { kode, nama, keterangan } });
        res.status(201).json({ success: true, message: 'Jenis keuangan berhasil dibuat!', data });
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ success: false, message: 'Kode sudah digunakan!' });
        res.status(500).json({ success: false, message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const { kode, nama, keterangan, isAktif } = req.body;
        const data = await prisma.jenisKeuangan.update({
            where: { id: parseInt(req.params.id) },
            data: { kode, nama, keterangan, isAktif }
        });
        res.json({ success: true, message: 'Jenis keuangan berhasil diupdate!', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const remove = async (req, res) => {
    try {
        await prisma.jenisKeuangan.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true, message: 'Jenis keuangan berhasil dihapus!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const toggleAktif = async (req, res) => {
    try {
        const current = await prisma.jenisKeuangan.findUnique({ where: { id: parseInt(req.params.id) } });
        const data = await prisma.jenisKeuangan.update({
            where: { id: parseInt(req.params.id) },
            data: { isAktif: !current.isAktif }
        });
        res.json({ success: true, message: `Jenis keuangan ${data.isAktif ? 'diaktifkan' : 'dinonaktifkan'}!`, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAll, getAktif, create, update, remove, toggleAktif };
