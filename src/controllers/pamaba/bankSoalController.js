const prisma = require('../../prisma/client');

const getAll = async (req, res) => {
    try {
        const { search, kategori, page = 1, limit = 50 } = req.query;
        const where = {};
        if (search) {
            where.pertanyaan = { contains: search, mode: 'insensitive' };
        }
        if (kategori) {
            where.kategori = kategori;
        }
        const [data, total] = await Promise.all([
            prisma.bankSoal.findMany({
                where,
                orderBy: { id: 'desc' },
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit)
            }),
            prisma.bankSoal.count({ where })
        ]);
        res.json({ success: true, total, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const data = await prisma.bankSoal.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!data) return res.status(404).json({ success: false, message: 'Soal tidak ditemukan!' });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const create = async (req, res) => {
    try {
        const { pertanyaan, tipeSoal, opsiA, opsiB, opsiC, opsiD, jawaban, kategori } = req.body;
        if (!pertanyaan || !jawaban) {
            return res.status(400).json({ success: false, message: 'Pertanyaan dan jawaban wajib diisi!' });
        }
        const data = await prisma.bankSoal.create({
            data: { pertanyaan, tipeSoal: tipeSoal || 'PG', opsiA, opsiB, opsiC, opsiD, jawaban, kategori }
        });
        res.status(201).json({ success: true, message: 'Soal berhasil ditambahkan!', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const { pertanyaan, tipeSoal, opsiA, opsiB, opsiC, opsiD, jawaban, kategori } = req.body;
        const data = await prisma.bankSoal.update({
            where: { id: parseInt(req.params.id) },
            data: { pertanyaan, tipeSoal, opsiA, opsiB, opsiC, opsiD, jawaban, kategori }
        });
        res.json({ success: true, message: 'Soal berhasil diupdate!', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const remove = async (req, res) => {
    try {
        await prisma.bankSoal.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true, message: 'Soal berhasil dihapus!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getKategoriList = async (req, res) => {
    try {
        const data = await prisma.bankSoal.findMany({
            select: { kategori: true },
            distinct: ['kategori'],
            where: { kategori: { not: null } }
        });
        res.json({ success: true, data: data.map(d => d.kategori).filter(Boolean) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAll, getById, create, update, remove, getKategoriList };
