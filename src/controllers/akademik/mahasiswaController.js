const prisma = require('../../prisma/client');
const bcrypt = require('bcryptjs');

const getAll = async (req, res) => {
    try {
        const { prodiId, jenisKelasId, status, tahunAngkatan, search } = req.query;
        const where = {};
        if (prodiId) where.prodiId = parseInt(prodiId);
        if (jenisKelasId) where.jenisKelasId = parseInt(jenisKelasId);
        if (status) where.status = status;
        if (tahunAngkatan) where.tahunAngkatan = parseInt(tahunAngkatan);
        if (search) where.OR = [
            { nama: { contains: search, mode: 'insensitive' } },
            { nim: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
        ];

        const data = await prisma.mahasiswa.findMany({
            where,
            include: {
                prodi: { include: { fakultas: true } },
                jenisKelas: true,
                dosenWali: true
            },
            orderBy: { nim: 'asc' }
        });
        res.json({ success: true, total: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const data = await prisma.mahasiswa.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                prodi: { include: { fakultas: true } },
                jenisKelas: true,
                dosenWali: true,
                krs: {
                    include: {
                        periode: true,
                        detailKRS: { include: { mataKuliah: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                keuangan: { orderBy: { createdAt: 'desc' } }
            }
        });
        if (!data) return res.status(404).json({ success: false, message: 'Mahasiswa tidak ditemukan!' });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const create = async (req, res) => {
    try {
        const {
            nim, nama, email, telepon, alamat,
            tahunAngkatan, semester, status,
            prodiId, jenisKelasId, dosenWaliId, password
        } = req.body;

        if (!nim || !nama || !prodiId) {
            return res.status(400).json({ success: false, message: 'NIM, nama, dan prodi wajib diisi!' });
        }

        // Buat akun user jika ada email
        if (email) {
            const hashed = await bcrypt.hash(password || 'mahasiswa123', 10);
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (!existingUser) {
                await prisma.user.create({
                    data: {
                        nama, email, password: hashed,
                        roles: { create: { role: 'MAHASISWA' } }
                    }
                });
            }
        }

        const data = await prisma.mahasiswa.create({
            data: {
                nim, nama,
                email: email || null,
                telepon: telepon || null,
                alamat: alamat || null,
                tahunAngkatan: parseInt(tahunAngkatan),
                semester: semester ? parseInt(semester) : 1,
                status: status || 'AKTIF',
                prodiId: parseInt(prodiId),
                jenisKelasId: jenisKelasId ? parseInt(jenisKelasId) : null,
                dosenWaliId: dosenWaliId ? parseInt(dosenWaliId) : null
            },
            include: { prodi: true, jenisKelas: true }
        });

        res.status(201).json({ success: true, message: 'Mahasiswa berhasil ditambahkan!', data });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'NIM atau email sudah digunakan!' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const {
            nama, email, telepon, alamat,
            tahunAngkatan, semester, status,
            prodiId, jenisKelasId, dosenWaliId
        } = req.body;

        const data = await prisma.mahasiswa.update({
            where: { id: parseInt(req.params.id) },
            data: {
                nama,
                email: email || null,
                telepon: telepon || null,
                alamat: alamat || null,
                tahunAngkatan: parseInt(tahunAngkatan),
                semester: semester ? parseInt(semester) : 1,
                status: status || 'AKTIF',
                prodiId: parseInt(prodiId),
                jenisKelasId: jenisKelasId ? parseInt(jenisKelasId) : null,
                dosenWaliId: dosenWaliId ? parseInt(dosenWaliId) : null
            },
            include: { prodi: true, jenisKelas: true, dosenWali: true }
        });
        res.json({ success: true, message: 'Mahasiswa berhasil diupdate!', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const naikSemester = async (req, res) => {
    try {
        const { mahasiswaIds } = req.body;
        if (!mahasiswaIds || mahasiswaIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Pilih minimal 1 mahasiswa!' });
        }

        await prisma.mahasiswa.updateMany({
            where: {
                id: { in: mahasiswaIds.map(Number) },
                status: 'AKTIF',
                semester: { lt: 14 }
            },
            data: { semester: { increment: 1 } }
        });

        res.json({ success: true, message: `${mahasiswaIds.length} mahasiswa berhasil naik semester!` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const remove = async (req, res) => {
    try {
        await prisma.mahasiswa.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true, message: 'Mahasiswa berhasil dihapus!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAll, getById, create, update, naikSemester, remove };