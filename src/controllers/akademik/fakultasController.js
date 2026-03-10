const prisma = require('../../prisma/client');

const getAll = async (req, res) => {
    try {
        const data = await prisma.fakultas.findMany({
            orderBy: { nama: 'asc' },
            include: { _count: { select: { prodi: true } } }
        });
        res.json({ success: true, total: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const create = async (req, res) => {
    try {
        const { nama, kode } = req.body;
        if (!nama || !kode) return res.status(400).json({
            success: false, message: 'Nama dan kode harus diisi!'
        });
        const data = await prisma.fakultas.create({ data: { nama, kode } });
        res.status(201).json({ success: true, message: 'Fakultas berhasil ditambahkan!', data });
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({
            success: false, message: 'Kode fakultas sudah digunakan!'
        });
        res.status(500).json({ success: false, message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const { nama, kode, isAktif } = req.body;
        const data = await prisma.fakultas.update({
            where: { id: parseInt(req.params.id) },
            data: { nama, kode, isAktif }
        });
        res.json({ success: true, message: 'Fakultas berhasil diupdate!', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const remove = async (req, res) => {
    try {
        await prisma.fakultas.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true, message: 'Fakultas berhasil dihapus!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAll, create, update, remove };