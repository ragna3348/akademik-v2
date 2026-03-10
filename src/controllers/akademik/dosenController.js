const prisma = require('../../prisma/client');
const bcrypt = require('bcryptjs');

const getAll = async (req, res) => {
    try {
        const data = await prisma.dosen.findMany({
            include: { prodi: true },
            orderBy: { nama: 'asc' }
        });
        res.json({ success: true, total: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const data = await prisma.dosen.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { prodi: true }
        });
        if (!data) return res.status(404).json({ success: false, message: 'Dosen tidak ditemukan!' });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const create = async (req, res) => {
    try {
        const { nidn, nama, email, telepon, jabatan, pendidikanTerakhir, prodiId, password } = req.body;
        if (!nidn || !nama || !email) {
            return res.status(400).json({ success: false, message: 'NIDN, nama, dan email wajib diisi!' });
        }

        // Buat akun user untuk dosen
        const hashed = await bcrypt.hash(password || 'dosen123', 10);
        const user = await prisma.user.create({
            data: {
                nama,
                email,
                password: hashed,
                roles: { create: { role: 'DOSEN' } }
            }
        });

        const data = await prisma.dosen.create({
            data: {
                nidn,
                nama,
                email,
                telepon: telepon || null,
                jabatan: jabatan || null,
                pendidikanTerakhir: pendidikanTerakhir || null,
                prodiId: prodiId ? parseInt(prodiId) : null,
                isAktif: true
            },
            include: { prodi: true }
        });

        res.status(201).json({ success: true, message: 'Dosen berhasil ditambahkan!', data });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'NIDN atau email sudah digunakan!' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const { nidn, nama, email, telepon, jabatan, pendidikanTerakhir, prodiId, isAktif } = req.body;
        const data = await prisma.dosen.update({
            where: { id: parseInt(req.params.id) },
            data: {
                nidn, nama, email,
                telepon: telepon || null,
                jabatan: jabatan || null,
                pendidikanTerakhir: pendidikanTerakhir || null,
                prodiId: prodiId ? parseInt(prodiId) : null,
                isAktif: isAktif !== undefined ? isAktif : true
            },
            include: { prodi: true }
        });
        res.json({ success: true, message: 'Dosen berhasil diupdate!', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const remove = async (req, res) => {
    try {
        await prisma.dosen.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true, message: 'Dosen berhasil dihapus!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAll, getById, create, update, remove };