const prisma = require('../../prisma/client');

const getAll = async (req, res) => {
    try {
        const data = await prisma.prodi.findMany({
            orderBy: { nama: 'asc' },
            include: {
                fakultas: true,
                kaprodi: true,
                _count: {
                    select: { mahasiswa: true, dosen: true }
                }
            }
        });
        res.json({ success: true, total: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const data = await prisma.prodi.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                fakultas: true,
                kaprodi: true,
                _count: { select: { mahasiswa: true, dosen: true } }
            }
        });
        if (!data) return res.status(404).json({
            success: false, message: 'Prodi tidak ditemukan!'
        });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const create = async (req, res) => {
    try {
        const { kode, kodeNim, nama, jenjang, fakultasId, skProdi, akreditasi, tglExAkreditasi, kaprodiId } = req.body;

        if (!kode || !kodeNim || !nama || !jenjang) {
            return res.status(400).json({
                success: false,
                message: 'Kode, kodeNim, nama, dan jenjang harus diisi!'
            });
        }

        const data = await prisma.prodi.create({
            data: {
                kode, kodeNim, nama, jenjang,
                fakultasId: fakultasId ? parseInt(fakultasId) : null,
                skProdi: skProdi || null,
                akreditasi: akreditasi || null,
                tglExAkreditasi: tglExAkreditasi ? new Date(tglExAkreditasi) : null,
                kaprodiId: kaprodiId ? parseInt(kaprodiId) : null
            },
            include: { fakultas: true, kaprodi: true }
        });

        res.status(201).json({
            success: true, message: 'Prodi berhasil ditambahkan!', data
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false, message: 'Kode prodi atau kode NIM sudah digunakan!'
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const { kodeNim, nama, jenjang, fakultasId, skProdi, akreditasi, tglExAkreditasi, kaprodiId } = req.body;
        const data = await prisma.prodi.update({
            where: { id: parseInt(req.params.id) },
            data: {
                kodeNim, nama, jenjang,
                fakultasId: fakultasId ? parseInt(fakultasId) : null,
                skProdi: skProdi || null,
                akreditasi: akreditasi || null,
                tglExAkreditasi: tglExAkreditasi ? new Date(tglExAkreditasi) : null,
                kaprodiId: kaprodiId ? parseInt(kaprodiId) : null
            },
            include: { fakultas: true, kaprodi: true }
        });
        res.json({ success: true, message: 'Prodi berhasil diupdate!', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const remove = async (req, res) => {
    try {
        await prisma.prodi.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ success: true, message: 'Prodi berhasil dihapus!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAll, getById, create, update, remove };