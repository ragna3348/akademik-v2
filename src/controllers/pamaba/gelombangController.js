const prisma = require('../../prisma/client');

const getAll = async (req, res) => {
    try {
        const data = await prisma.gelombang.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { pendaftar: true } }
            }
        });
        res.json({ success: true, total: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const data = await prisma.gelombang.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                _count: { select: { pendaftar: true } }
            }
        });
        if (!data) return res.status(404).json({
            success: false, message: 'Gelombang tidak ditemukan!'
        });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const create = async (req, res) => {
    try {
        const { nama, tahun, tanggalBuka, tanggalTutup, biayaDaftar } = req.body;
        if (!nama || !tahun || !tanggalBuka || !tanggalTutup || !biayaDaftar) {
            return res.status(400).json({
                success: false, message: 'Semua field harus diisi!'
            });
        }
        const data = await prisma.gelombang.create({
            data: {
                nama, tahun: parseInt(tahun),
                tanggalBuka: new Date(tanggalBuka),
                tanggalTutup: new Date(tanggalTutup),
                biayaDaftar: parseFloat(biayaDaftar)
            }
        });
        res.status(201).json({
            success: true, message: 'Gelombang berhasil dibuat!', data
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const { nama, tahun, tanggalBuka, tanggalTutup, biayaDaftar, isAktif } = req.body;
        const data = await prisma.gelombang.update({
            where: { id: parseInt(req.params.id) },
            data: {
                nama,
                tahun: tahun ? parseInt(tahun) : undefined,
                tanggalBuka: tanggalBuka ? new Date(tanggalBuka) : undefined,
                tanggalTutup: tanggalTutup ? new Date(tanggalTutup) : undefined,
                biayaDaftar: biayaDaftar ? parseFloat(biayaDaftar) : undefined,
                isAktif: isAktif !== undefined ? isAktif : undefined
            }
        });
        res.json({ success: true, message: 'Gelombang berhasil diupdate!', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const toggleAktif = async (req, res) => {
    try {
        const gelombang = await prisma.gelombang.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        const data = await prisma.gelombang.update({
            where: { id: parseInt(req.params.id) },
            data: { isAktif: !gelombang.isAktif }
        });
        res.json({
            success: true,
            message: `Gelombang ${data.isAktif ? 'diaktifkan' : 'dinonaktifkan'}!`,
            data
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const remove = async (req, res) => {
    try {
        await prisma.gelombang.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ success: true, message: 'Gelombang berhasil dihapus!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAll, getById, create, update, toggleAktif, remove };