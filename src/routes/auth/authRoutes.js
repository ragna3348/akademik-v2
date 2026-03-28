const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { register, login, getProfile, cekStatus } = require('../../controllers/auth/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', auth, getProfile);

// DEBUG DATABASE ROUTE (Hapus setelah testing)
router.get('/db-debug', async (req, res) => {
    try {
        const { PrismaClient } = require('@prisma/client');
        const bcrypt = require('bcryptjs');
        const prisma = new PrismaClient();
        
        let user = await prisma.user.findUnique({
            where: { email: 'superadmin@kampus.ac.id' }
        });

        if (!user) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            user = await prisma.user.create({
                data: {
                    nama: 'Super Admin',
                    email: 'superadmin@kampus.ac.id',
                    password: hashedPassword,
                    status: true,
                    roles: {
                        create: { role: 'SUPER_ADMIN' }
                    }
                }
            });
        } else {
             const hashedPassword = await bcrypt.hash('password123', 10);
             user = await prisma.user.update({
                 where: { email: 'superadmin@kampus.ac.id' },
                 data: { password: hashedPassword, status: true }
             });
        }

        res.json({
            success: true,
            dbUrl: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'none',
            found: !!user,
            message: 'SUPERADMIN TELAH DISEED DAN DI-RESET KE password123 SECARA PAKSA OLEH SISTEM!',
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.get('/cek-status', auth, cekStatus);

module.exports = router;