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
        const prisma = new PrismaClient();
        const user = await prisma.user.findUnique({
            where: { email: 'superadmin@kampus.ac.id' }
        });
        res.json({
            success: true,
            dbUrl: process.env.DATABASE_URL.substring(0, 30) + '...',
            found: !!user,
            hash: user ? user.password : null,
            status: user ? user.status : null
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.get('/cek-status', auth, cekStatus);

module.exports = router;