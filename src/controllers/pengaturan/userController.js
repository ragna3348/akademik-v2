const prisma = require('../../prisma/client');
const bcrypt = require('bcryptjs');

const getAll = async (req, res) => {
    try {
        const data = await prisma.user.findMany({
            include: { roles: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, total: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const data = await prisma.user.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { roles: true }
        });
        if (!data) return res.status(404).json({ success: false, message: 'User tidak ditemukan!' });
        const { password, ...safe } = data;
        res.json({ success: true, data: safe });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const create = async (req, res) => {
    try {
        const { nama, email, password, roles } = req.body;
        if (!nama || !email || !password || !roles || roles.length === 0) {
            return res.status(400).json({ success: false, message: 'Nama, email, password, dan role wajib diisi!' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const data = await prisma.user.create({
            data: {
                nama,
                email,
                password: hashed,
                roles: {
                    create: roles.map(role => ({ role }))
                }
            },
            include: { roles: true }
        });

        const { password: _, ...safe } = data;
        res.status(201).json({ success: true, message: 'User berhasil dibuat!', data: safe });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'Email sudah digunakan!' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const { nama, email, password, roles, status } = req.body;
        const userId = parseInt(req.params.id);

        const updateData = { nama, email, status };
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Update user
        await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        // Update roles jika ada
        if (roles && roles.length > 0) {
            await prisma.userRole.deleteMany({ where: { userId } });
            await prisma.userRole.createMany({
                data: roles.map(role => ({ userId, role }))
            });
        }

        const updated = await prisma.user.findUnique({
            where: { id: userId },
            include: { roles: true }
        });

        const { password: _, ...safe } = updated;
        res.json({ success: true, message: 'User berhasil diupdate!', data: safe });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'Email sudah digunakan!' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const toggleStatus = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan!' });

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { status: !user.status }
        });

        res.json({
            success: true,
            message: `User ${updated.status ? 'diaktifkan' : 'dinonaktifkan'}!`,
            data: updated
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { passwordBaru } = req.body;
        if (!passwordBaru || passwordBaru.length < 8) {
            return res.status(400).json({ success: false, message: 'Password minimal 8 karakter!' });
        }

        const hashed = await bcrypt.hash(passwordBaru, 10);
        await prisma.user.update({
            where: { id: parseInt(req.params.id) },
            data: { password: hashed }
        });

        res.json({ success: true, message: 'Password berhasil direset!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const remove = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Jangan hapus diri sendiri
        if (userId === req.user.id) {
            return res.status(400).json({ success: false, message: 'Tidak bisa menghapus akun sendiri!' });
        }

        await prisma.userRole.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } });

        res.json({ success: true, message: 'User berhasil dihapus!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAll, getById, create, update, toggleStatus, resetPassword, remove };