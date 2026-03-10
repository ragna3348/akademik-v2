const prisma = require('../../prisma/client');

const getAll = async (req, res) => {
    try {
        const { prodiId, dosenId, hari } = req.query;
        const where = {};
        if (prodiId) where.mataKuliah = { prodiId: parseInt(prodiId) };
        if (dosenId) where.dosenId = parseInt(dosenId);
        if (hari) where.hari = hari;

        const data = await prisma.jadwalKuliah.findMany({
            where,
            include: {
                mataKuliah: { include: { prodi: true } },
                dosen: true
            },
            orderBy: [{ hari: 'asc' }, { jamMulai: 'asc' }]
        });
        res.json({ success: true, total: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const create = async (req, res) => {
    try {
        const { mataKuliahId, dosenId, hari, jamMulai, jamSelesai, ruangan, tahunAjaran, semester } = req.body;
        if (!mataKuliahId || !hari || !jamMulai || !jamSelesai) {
            return res.status(400).json({ success: false, message: 'Mata kuliah, hari, dan jam wajib diisi!' });
        }

        const data = await prisma.jadwalKuliah.create({
            data: {
                mataKuliahId: parseInt(mataKuliahId),
                dosenId: dosenId ? parseInt(dosenId) : null,
                hari,
                jamMulai,
                jamSelesai,
                ruangan: ruangan || null,
                tahunAjaran: tahunAjaran || null,
                semester: semester ? parseInt(semester) : null
            },
            include: { mataKuliah: { include: { prodi: true } }, dosen: true }
        });

        res.status(201).json({ success: true, message: 'Jadwal berhasil ditambahkan!', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const { mataKuliahId, dosenId, hari, jamMulai, jamSelesai, ruangan, tahunAjaran, semester } = req.body;
        const data = await prisma.jadwalKuliah.update({
            where: { id: parseInt(req.params.id) },
            data: {
                mataKuliahId: parseInt(mataKuliahId),
                dosenId: dosenId ? parseInt(dosenId) : null,
                hari,
                jamMulai,
                jamSelesai,
                ruangan: ruangan || null,
                tahunAjaran: tahunAjaran || null,
                semester: semester ? parseInt(semester) : null
            },
            include: { mataKuliah: { include: { prodi: true } }, dosen: true }
        });
        res.json({ success: true, message: 'Jadwal berhasil diupdate!', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const remove = async (req, res) => {
    try {
        await prisma.jadwalKuliah.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true, message: 'Jadwal berhasil dihapus!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAll, create, update, remove };