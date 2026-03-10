const prisma = require('../../prisma/client');

const getAll = async (req, res) => {
    try {
        const data = await prisma.jenisKelas.findMany({
            orderBy: { kodeAngka: 'asc' }
        });
        res.json({ success: true, total: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAktif = async (req, res) => {
    try {
        const data = await prisma.jenisKelas.findMany({
            where: { isAktif: true },
            orderBy: { kodeAngka: 'asc' }
        });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const create = async (req, res) => {
    try {
        const { nama, kodeAngka } = req.body;
        if (!nama || kodeAngka === undefined) return res.status(400).json({
            success: false, message: 'Nama dan kode angka harus diisi!'
        });
        const data = await prisma.jenisKelas.create({
            data: { nama, kodeAngka: parseInt(kodeAngka) }
        });
        res.status(201).json({ success: true, message: 'Jenis kelas berhasil ditambahkan!', data });
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({
            success: false, message: 'Kode angka sudah digunakan!'
        });
        res.status(500).json({ success: false, message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const { nama, kodeAngka, isAktif } = req.body;
        const data = await prisma.jenisKelas.update({
            where: { id: parseInt(req.params.id) },
            data: { nama, kodeAngka: parseInt(kodeAngka), isAktif }
        });
        res.json({ success: true, message: 'Jenis kelas berhasil diupdate!', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const toggleAktif = async (req, res) => {
    try {
        const current = await prisma.jenisKelas.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        const data = await prisma.jenisKelas.update({
            where: { id: parseInt(req.params.id) },
            data: { isAktif: !current.isAktif }
        });
        res.json({
            success: true,
            message: `Jenis kelas ${data.isAktif ? 'diaktifkan' : 'dinonaktifkan'}!`,
            data
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const remove = async (req, res) => {
    try {
        await prisma.jenisKelas.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true, message: 'Jenis kelas berhasil dihapus!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAll, getAktif, create, update, toggleAktif, remove };