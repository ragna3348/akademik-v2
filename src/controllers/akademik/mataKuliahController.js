const prisma = require('../../prisma/client');

const getAll = async (req, res) => {
    try {
        const { prodiId, semester } = req.query;
        const where = {};
        if (prodiId) where.prodiId = parseInt(prodiId);
        if (semester) where.semester = parseInt(semester);

        const data = await prisma.mataKuliah.findMany({
            where,
            include: { prodi: true },
            orderBy: [{ semester: 'asc' }, { nama: 'asc' }]
        });
        res.json({ success: true, total: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const create = async (req, res) => {
    try {
        const { kode, nama, sks, semester, prodiId, jenis, deskripsi } = req.body;
        if (!kode || !nama || !sks || !semester || !prodiId) {
            return res.status(400).json({ success: false, message: 'Kode, nama, SKS, semester, dan prodi wajib diisi!' });
        }

        const data = await prisma.mataKuliah.create({
            data: {
                kode,
                nama,
                sks: parseInt(sks),
                semester: parseInt(semester),
                prodiId: parseInt(prodiId),
                jenis: jenis || 'WAJIB',
                deskripsi: deskripsi || null,
                isAktif: true
            },
            include: { prodi: true }
        });

        res.status(201).json({ success: true, message: 'Mata kuliah berhasil ditambahkan!', data });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'Kode mata kuliah sudah digunakan!' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const { kode, nama, sks, semester, prodiId, jenis, deskripsi, isAktif } = req.body;
        const data = await prisma.mataKuliah.update({
            where: { id: parseInt(req.params.id) },
            data: {
                kode, nama,
                sks: parseInt(sks),
                semester: parseInt(semester),
                prodiId: parseInt(prodiId),
                jenis: jenis || 'WAJIB',
                deskripsi: deskripsi || null,
                isAktif: isAktif !== undefined ? isAktif : true
            },
            include: { prodi: true }
        });
        res.json({ success: true, message: 'Mata kuliah berhasil diupdate!', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const remove = async (req, res) => {
    try {
        await prisma.mataKuliah.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true, message: 'Mata kuliah berhasil dihapus!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAll, create, update, remove };